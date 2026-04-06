import { describe, expect, it, vi } from "vitest";

import { generationBackendRequestSchema } from "@ai-nft-forge/shared";

import { createGenerationBackendService } from "./service.js";
import type { GenerationArtifactProvider } from "./provider.js";

describe("createGenerationBackendService", () => {
  function createProvider(): GenerationArtifactProvider {
    return {
      async generateArtifacts(input) {
        return Array.from(
          { length: input.generationRequest.requestedVariantCount },
          (_, index) => ({
            body: new Uint8Array([index + 1]),
            contentType: "image/png",
            fileExtension: "png",
            variantIndex: index + 1
          })
        );
      },
      kind: "deterministic_transform"
    };
  }

  it("stores provider artifacts into the target storage bucket", async () => {
    const sourceImage = new Uint8Array([1, 2, 3]);
    const storedOutputs = new Map<string, Uint8Array>();
    const service = createGenerationBackendService({
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      provider: createProvider(),
      storage: {
        async deleteObject() {
          throw new Error("deleteObject should not be called in success path.");
        },
        async getObjectBytes() {
          return {
            body: sourceImage,
            byteSize: sourceImage.byteLength,
            contentType: "image/png"
          };
        },
        async putObject(input) {
          storedOutputs.set(`${input.bucket}:${input.key}`, input.body);
        }
      },
      targetBucketName: "ai-nft-forge-private"
    });

    const result = await service.generate(
      generationBackendRequestSchema.parse({
        generationRequestId: "generation_1",
        ownerUserId: "user_1",
        pipelineKey: "collectible-portrait-v1",
        requestedVariantCount: 3,
        sourceAsset: {
          contentType: "image/png",
          originalFilename: "portrait.png",
          storageBucket: "ai-nft-forge-private",
          storageObjectKey: "source-assets/user_1/portrait.png"
        },
        target: {
          bucket: "ai-nft-forge-private",
          outputGroupKey: "generated-assets/user_1/generation_1"
        }
      })
    );

    expect(result.artifacts).toHaveLength(3);
    expect(result.artifacts[0]?.contentType).toBe("image/png");
    expect(result.artifacts[0]?.storageObjectKey).toContain(
      "variant-01-portrait.png"
    );
    expect(storedOutputs.size).toBe(3);
  });

  it("cleans up partial outputs when writing a later variant fails", async () => {
    const sourceImage = new Uint8Array([1, 2, 3]);
    const deleteObject = vi.fn().mockResolvedValue(undefined);
    const putObject = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Failed to store output object."));
    const service = createGenerationBackendService({
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      provider: createProvider(),
      storage: {
        deleteObject,
        async getObjectBytes() {
          return {
            body: sourceImage,
            byteSize: sourceImage.byteLength,
            contentType: "image/png"
          };
        },
        putObject
      },
      targetBucketName: "ai-nft-forge-private"
    });

    await expect(
      service.generate(
        generationBackendRequestSchema.parse({
          generationRequestId: "generation_1",
          ownerUserId: "user_1",
          pipelineKey: "collectible-portrait-v1",
          requestedVariantCount: 2,
          sourceAsset: {
            contentType: "image/png",
            originalFilename: "portrait.png",
            storageBucket: "ai-nft-forge-private",
            storageObjectKey: "source-assets/user_1/portrait.png"
          },
          target: {
            bucket: "ai-nft-forge-private",
            outputGroupKey: "generated-assets/user_1/generation_1"
          }
        })
      )
    ).rejects.toThrow("Failed to store output object.");

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      bucket: "ai-nft-forge-private",
      key: "generated-assets/user_1/generation_1/variant-01-portrait.png"
    });
  });

  it("fails when the provider returns fewer artifacts than requested", async () => {
    const service = createGenerationBackendService({
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      provider: {
        async generateArtifacts() {
          return [
            {
              body: new Uint8Array([1]),
              contentType: "image/png",
              fileExtension: "png",
              variantIndex: 1
            }
          ];
        },
        kind: "comfyui"
      },
      storage: {
        async deleteObject() {
          return undefined;
        },
        async getObjectBytes() {
          return {
            body: new Uint8Array([1, 2, 3]),
            byteSize: 3,
            contentType: "image/png"
          };
        },
        async putObject() {
          return undefined;
        }
      },
      targetBucketName: "ai-nft-forge-private"
    });

    await expect(
      service.generate(
        generationBackendRequestSchema.parse({
          generationRequestId: "generation_1",
          ownerUserId: "user_1",
          pipelineKey: "collectible-portrait-v1",
          requestedVariantCount: 2,
          sourceAsset: {
            contentType: "image/png",
            originalFilename: "portrait.png",
            storageBucket: "ai-nft-forge-private",
            storageObjectKey: "source-assets/user_1/portrait.png"
          },
          target: {
            bucket: "ai-nft-forge-private",
            outputGroupKey: "generated-assets/user_1/generation_1"
          }
        })
      )
    ).rejects.toThrow("Generation provider returned 1 artifacts");
  });
});
