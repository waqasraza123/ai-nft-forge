import { describe, expect, it } from "vitest";

import { createSourceAssetService } from "./service";
import { SourceAssetServiceError } from "./error";

function createSourceAssetHarness() {
  const assets = new Map<
    string,
    {
      byteSize: number | null;
      contentType: string;
      createdAt: Date;
      id: string;
      originalFilename: string;
      ownerUserId: string;
      status: "pending_upload" | "uploaded" | "upload_failed";
      storageBucket: string;
      storageObjectKey: string;
      uploadedAt: Date | null;
    }
  >();
  let assetIndex = 0;
  const objectHeads = new Map<
    string,
    {
      byteSize: number | null;
      contentType: string | null;
    }
  >();

  const service = createSourceAssetService({
    now: () => new Date("2026-04-05T00:00:00.000Z"),
    repositories: {
      generatedAssetRepository: {
        async listByGenerationRequestIds() {
          return [];
        }
      },
      generationRequestRepository: {
        async listBySourceAssetIds() {
          return [];
        }
      },
      sourceAssetRepository: {
        async createPendingUpload(input) {
          assetIndex += 1;
          const asset = {
            byteSize: null,
            contentType: input.contentType,
            createdAt: new Date("2026-04-05T00:00:00.000Z"),
            id: `asset_${assetIndex}`,
            originalFilename: input.originalFilename,
            ownerUserId: input.ownerUserId,
            status: "pending_upload" as const,
            storageBucket: input.storageBucket,
            storageObjectKey: input.storageObjectKey,
            uploadedAt: null
          };

          assets.set(asset.id, asset);

          return asset;
        },

        async findByIdForOwner(input) {
          const asset = assets.get(input.id);

          if (!asset || asset.ownerUserId !== input.ownerUserId) {
            return null;
          }

          return asset;
        },

        async listByOwnerUserId(ownerUserId) {
          return [...assets.values()].filter(
            (asset) => asset.ownerUserId === ownerUserId
          );
        },

        async updateUploadState(input) {
          const currentAsset = assets.get(input.id);

          if (!currentAsset) {
            throw new Error("Missing source asset in test harness.");
          }

          const updatedAsset = {
            ...currentAsset,
            byteSize: input.byteSize,
            status: input.status,
            uploadedAt: input.uploadedAt
          };

          assets.set(updatedAsset.id, updatedAsset);

          return updatedAsset;
        }
      }
    },
    storage: {
      async createUploadDescriptor(input) {
        return {
          expiresAt: "2026-04-05T00:15:00.000Z",
          headers: {
            "content-type": input.contentType
          },
          method: "PUT" as const,
          objectKey: `source-assets/${input.ownerUserId}/asset-upload.jpg`,
          url: "http://127.0.0.1:59000/private-upload"
        };
      },
      async headPrivateObject(input) {
        return objectHeads.get(`${input.bucket}:${input.key}`) ?? null;
      },
      privateBucketName: "ai-nft-forge-private"
    }
  });

  return {
    assets,
    objectHeads,
    service
  };
}

describe("createSourceAssetService", () => {
  it("creates a pending upload intent and source asset record", async () => {
    const harness = createSourceAssetHarness();

    const result = await harness.service.createUploadIntent({
      contentType: "image/jpeg",
      fileName: "portrait.jpg",
      ownerUserId: "user_1"
    });

    expect(result.asset.status).toBe("pending_upload");
    expect(result.asset.originalFilename).toBe("portrait.jpg");
    expect(result.upload.method).toBe("PUT");
    expect(result.upload.headers["content-type"]).toBe("image/jpeg");
  });

  it("marks an uploaded source asset as uploaded after object storage confirmation", async () => {
    const harness = createSourceAssetHarness();
    const uploadIntent = await harness.service.createUploadIntent({
      contentType: "image/png",
      fileName: "portrait.png",
      ownerUserId: "user_1"
    });

    harness.objectHeads.set(
      `ai-nft-forge-private:${uploadIntent.upload.objectKey}`,
      {
        byteSize: 4096,
        contentType: "image/png"
      }
    );

    const result = await harness.service.completeUpload({
      assetId: uploadIntent.asset.id,
      ownerUserId: "user_1"
    });

    expect(result.asset.status).toBe("uploaded");
    expect(result.asset.byteSize).toBe(4096);
    expect(result.asset.uploadedAt).toBe("2026-04-05T00:00:00.000Z");
  });

  it("rejects upload completion when the storage object is missing", async () => {
    const harness = createSourceAssetHarness();
    const uploadIntent = await harness.service.createUploadIntent({
      contentType: "image/webp",
      fileName: "portrait.webp",
      ownerUserId: "user_1"
    });

    await expect(
      harness.service.completeUpload({
        assetId: uploadIntent.asset.id,
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new SourceAssetServiceError(
        "OBJECT_MISSING",
        "Uploaded source asset object is not available yet.",
        409
      )
    );
  });

  it("lists source assets with the latest generation and generated outputs", async () => {
    const generationRequests = [
      {
        completedAt: new Date("2026-04-05T00:30:00.000Z"),
        createdAt: new Date("2026-04-05T00:15:00.000Z"),
        failedAt: null,
        failureCode: null,
        failureMessage: null,
        id: "generation_2",
        pipelineKey: "collectible-portrait-v1",
        queueJobId: "job_2",
        requestedVariantCount: 2,
        resultJson: {
          generatedVariantCount: 2,
          outputGroupKey: "generated-assets/user_1/generation_2",
          storedAssetCount: 2
        },
        sourceAssetId: "asset_1",
        startedAt: new Date("2026-04-05T00:20:00.000Z"),
        status: "succeeded" as const
      },
      {
        completedAt: null,
        createdAt: new Date("2026-04-05T00:10:00.000Z"),
        failedAt: new Date("2026-04-05T00:12:00.000Z"),
        failureCode: "GENERATION_PROCESSING_FAILED",
        failureMessage: "Temporary backend failure",
        id: "generation_1",
        pipelineKey: "collectible-portrait-v1",
        queueJobId: "job_1",
        requestedVariantCount: 4,
        resultJson: null,
        sourceAssetId: "asset_1",
        startedAt: new Date("2026-04-05T00:11:00.000Z"),
        status: "failed" as const
      }
    ];
    const generatedAssets = [
      {
        byteSize: 2048,
        contentType: "image/png",
        createdAt: new Date("2026-04-05T00:31:00.000Z"),
        generationRequestId: "generation_2",
        id: "generated_asset_1",
        moderatedAt: new Date("2026-04-05T00:33:00.000Z"),
        moderationStatus: "approved" as const,
        sourceAssetId: "asset_1",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey:
          "generated-assets/user_1/generation_2/variant-01-portrait.png",
        variantIndex: 1
      },
      {
        byteSize: 3072,
        contentType: "image/png",
        createdAt: new Date("2026-04-05T00:32:00.000Z"),
        generationRequestId: "generation_2",
        id: "generated_asset_2",
        moderatedAt: null,
        moderationStatus: "pending_review" as const,
        sourceAssetId: "asset_1",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey:
          "generated-assets/user_1/generation_2/variant-02-portrait.png",
        variantIndex: 2
      }
    ];
    const listedAssets = [
      {
        byteSize: 4096,
        contentType: "image/png",
        createdAt: new Date("2026-04-05T00:00:00.000Z"),
        id: "asset_1",
        originalFilename: "portrait.png",
        ownerUserId: "user_1",
        status: "uploaded" as const,
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "source-assets/user_1/portrait.png",
        uploadedAt: new Date("2026-04-05T00:05:00.000Z")
      }
    ];
    const service = createSourceAssetService({
      now: () => new Date("2026-04-05T00:00:00.000Z"),
      repositories: {
        generatedAssetRepository: {
          async listByGenerationRequestIds() {
            return generatedAssets;
          }
        },
        generationRequestRepository: {
          async listBySourceAssetIds() {
            return generationRequests;
          }
        },
        sourceAssetRepository: {
          async createPendingUpload() {
            throw new Error("Not used in list test.");
          },
          async findByIdForOwner() {
            throw new Error("Not used in list test.");
          },
          async listByOwnerUserId() {
            return listedAssets;
          },
          async updateUploadState() {
            throw new Error("Not used in list test.");
          }
        }
      },
      storage: {
        async createUploadDescriptor() {
          throw new Error("Not used in list test.");
        },
        async headPrivateObject() {
          throw new Error("Not used in list test.");
        },
        privateBucketName: "ai-nft-forge-private"
      }
    });

    const result = await service.listSourceAssets({
      ownerUserId: "user_1"
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.generationHistory).toHaveLength(2);
    expect(result.assets[0]?.generationHistory[0]?.id).toBe("generation_2");
    expect(result.assets[0]?.generationHistory[1]?.id).toBe("generation_1");
    expect(result.assets[0]?.latestGeneration?.id).toBe("generation_2");
    expect(result.assets[0]?.latestGeneration?.generatedAssets).toHaveLength(2);
    expect(result.assets[0]?.latestGeneratedAssets[0]?.id).toBe(
      "generated_asset_1"
    );
    expect(
      result.assets[0]?.latestGeneration?.generatedAssets[0]?.moderationStatus
    ).toBe("approved");
    expect(
      result.assets[0]?.latestGeneration?.generatedAssets[1]?.moderationStatus
    ).toBe("pending_review");
    expect(
      result.assets[0]?.generationHistory[1]?.generatedAssets
    ).toHaveLength(0);
  });
});
