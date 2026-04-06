import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpBackendGenerationAdapter } from "./http-backend-adapter.js";

describe("createHttpBackendGenerationAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates backend artifacts against storage before returning them", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: "image/png"
      })
      .mockResolvedValueOnce({
        ContentLength: 2048,
        ContentType: "image/png"
      });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            artifacts: [
              {
                contentType: "image/png",
                storageBucket: "ai-nft-forge-private",
                storageObjectKey:
                  "generated-assets/user_1/generation_1/variant-02-portrait.png",
                variantIndex: 2
              },
              {
                contentType: "image/png",
                storageBucket: "ai-nft-forge-private",
                storageObjectKey:
                  "generated-assets/user_1/generation_1/variant-01-portrait.png",
                variantIndex: 1
              }
            ],
            outputGroupKey: "generated-assets/user_1/generation_1"
          })
        )
      })
    );

    const adapter = createHttpBackendGenerationAdapter({
      backendUrl: "http://127.0.0.1:8787/generate",
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      storageClient: {
        send
      } as never,
      targetBucketName: "ai-nft-forge-private",
      timeoutMs: 30000
    });

    const result = await adapter.materializeGenerationOutputs({
      generationRequest: {
        id: "generation_1",
        ownerUserId: "user_1",
        pipelineKey: "collectible-portrait-v1",
        requestedVariantCount: 2,
        sourceAssetId: "asset_1"
      },
      sourceAsset: {
        contentType: "image/png",
        originalFilename: "portrait.png",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "source-assets/user_1/portrait.png"
      }
    });

    expect(result.outputGroupKey).toBe("generated-assets/user_1/generation_1");
    expect(result.generatedAssets).toEqual([
      {
        byteSize: 2048,
        contentType: "image/png",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey:
          "generated-assets/user_1/generation_1/variant-01-portrait.png",
        variantIndex: 1
      },
      {
        byteSize: 1024,
        contentType: "image/png",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey:
          "generated-assets/user_1/generation_1/variant-02-portrait.png",
        variantIndex: 2
      }
    ]);
  });
});
