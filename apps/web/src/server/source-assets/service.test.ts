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
});
