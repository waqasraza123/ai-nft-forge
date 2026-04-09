import { describe, expect, it } from "vitest";

import { GeneratedAssetServiceError } from "./error";
import { createGeneratedAssetService } from "./service";

function createGeneratedAssetHarness() {
  const assets = new Map<
    string,
    {
      byteSize: number | null;
      contentType: string;
      createdAt: Date;
      generationRequestId: string;
      id: string;
      moderatedAt: Date | null;
      moderationStatus: "approved" | "pending_review" | "rejected";
      ownerUserId: string;
      sourceAssetId: string;
      storageBucket: string;
      storageObjectKey: string;
      variantIndex: number;
    }
  >([
    [
      "generated_asset_1",
      {
        byteSize: 2048,
        contentType: "image/png",
        createdAt: new Date("2026-04-06T00:00:00.000Z"),
        generationRequestId: "generation_1",
        id: "generated_asset_1",
        moderatedAt: null,
        moderationStatus: "pending_review" as const,
        ownerUserId: "user_1",
        sourceAssetId: "asset_1",
        storageBucket: "ai-nft-forge-private",
        storageObjectKey: "generated-assets/user_1/generation_1/variant-01.png",
        variantIndex: 1
      }
    ]
  ]);
  const objectHeads = new Map<
    string,
    {
      byteSize: number | null;
      contentType: string | null;
    }
  >([
    [
      "ai-nft-forge-private:generated-assets/user_1/generation_1/variant-01.png",
      {
        byteSize: 4096,
        contentType: "image/png"
      }
    ]
  ]);
  const service = createGeneratedAssetService({
    now: () => new Date("2026-04-06T00:10:00.000Z"),
    repositories: {
      generatedAssetRepository: {
        async findByIdForOwner(input) {
          const asset = assets.get(input.id);

          if (!asset || asset.ownerUserId !== input.ownerUserId) {
            return null;
          }

          return asset;
        },
        async updateModerationByIdForOwner(input) {
          const asset = assets.get(input.id);

          if (!asset || asset.ownerUserId !== input.ownerUserId) {
            return null;
          }

          const updatedAsset = {
            ...asset,
            moderatedAt: input.moderatedAt,
            moderationStatus: input.moderationStatus
          };

          assets.set(updatedAsset.id, updatedAsset);

          return updatedAsset;
        }
      }
    },
    storage: {
      async createDownloadDescriptor(input) {
        return {
          expiresAt: "2026-04-06T00:05:00.000Z",
          method: "GET" as const,
          url: `http://127.0.0.1:59000/${input.bucket}/${input.key}`
        };
      },
      async headPrivateObject(input) {
        return objectHeads.get(`${input.bucket}:${input.key}`) ?? null;
      }
    }
  });

  return {
    objectHeads,
    service
  };
}

describe("createGeneratedAssetService", () => {
  it("creates a protected download intent for an owned generated asset", async () => {
    const harness = createGeneratedAssetHarness();

    const result = await harness.service.createDownloadIntent({
      generatedAssetId: "generated_asset_1",
      ownerUserId: "user_1"
    });

    expect(result.asset.byteSize).toBe(4096);
    expect(result.asset.contentType).toBe("image/png");
    expect(result.download.method).toBe("GET");
    expect(result.download.url).toContain(
      "generated-assets/user_1/generation_1"
    );
  });

  it("rejects download intents for missing generated assets", async () => {
    const harness = createGeneratedAssetHarness();

    await expect(
      harness.service.createDownloadIntent({
        generatedAssetId: "missing_asset",
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new GeneratedAssetServiceError(
        "GENERATED_ASSET_NOT_FOUND",
        "Generated asset was not found.",
        404
      )
    );
  });

  it("rejects download intents when the stored object is missing", async () => {
    const harness = createGeneratedAssetHarness();

    harness.objectHeads.clear();

    await expect(
      harness.service.createDownloadIntent({
        generatedAssetId: "generated_asset_1",
        ownerUserId: "user_1"
      })
    ).rejects.toEqual(
      new GeneratedAssetServiceError(
        "GENERATED_ASSET_NOT_FOUND",
        "Generated asset was not found.",
        404
      )
    );
  });

  it("updates moderation state for an owned generated asset", async () => {
    const harness = createGeneratedAssetHarness();

    const result = await harness.service.updateModeration({
      generatedAssetId: "generated_asset_1",
      moderationStatus: "approved",
      ownerUserId: "user_1"
    });

    expect(result.asset.moderationStatus).toBe("approved");
    expect(result.asset.moderatedAt).toBe("2026-04-06T00:10:00.000Z");
  });

  it("resets moderation state back to pending review", async () => {
    const harness = createGeneratedAssetHarness();

    await harness.service.updateModeration({
      generatedAssetId: "generated_asset_1",
      moderationStatus: "approved",
      ownerUserId: "user_1"
    });
    const result = await harness.service.updateModeration({
      generatedAssetId: "generated_asset_1",
      moderationStatus: "pending_review",
      ownerUserId: "user_1"
    });

    expect(result.asset.moderationStatus).toBe("pending_review");
    expect(result.asset.moderatedAt).toBeNull();
  });
});
