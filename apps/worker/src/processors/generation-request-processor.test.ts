import { describe, expect, it, vi } from "vitest";

import { createGenerationRequestProcessor } from "./generation-request-processor.js";

describe("createGenerationRequestProcessor", () => {
  it("materializes outputs and persists generated assets before success", async () => {
    const markRunning = vi.fn().mockResolvedValue(undefined);
    const transactionGeneratedAssetCreate = vi
      .fn()
      .mockResolvedValue(undefined);
    const transactionGenerationRequestUpdate = vi
      .fn()
      .mockResolvedValue(undefined);
    const processor = createGenerationRequestProcessor({
      adapter: {
        cleanupMaterializedOutputs: vi.fn().mockResolvedValue(undefined),
        materializeGenerationOutputs: vi.fn().mockResolvedValue({
          generatedAssets: [
            {
              byteSize: 4096,
              contentType: "image/jpeg",
              storageBucket: "ai-nft-forge-private",
              storageObjectKey:
                "generated-assets/user_1/generation_1/variant-01-portrait.jpg",
              variantIndex: 1
            },
            {
              byteSize: 4096,
              contentType: "image/jpeg",
              storageBucket: "ai-nft-forge-private",
              storageObjectKey:
                "generated-assets/user_1/generation_1/variant-02-portrait.jpg",
              variantIndex: 2
            }
          ],
          outputGroupKey: "generated-assets/user_1/generation_1"
        })
      },
      databaseClient: {
        $transaction: vi.fn().mockImplementation(async (operation) =>
          operation({
            generatedAsset: {
              create: transactionGeneratedAssetCreate
            },
            generationRequest: {
              update: transactionGenerationRequestUpdate
            }
          })
        )
      } as never,
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      now: () => new Date("2026-04-06T00:00:00.000Z"),
      repositories: {
        generationRequestRepository: {
          findById: vi.fn().mockResolvedValue({
            id: "generation_1",
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            requestedVariantCount: 2,
            resultJson: null,
            sourceAssetId: "asset_1",
            status: "queued"
          }),
          markFailed: vi.fn(),
          markQueuedForRetry: vi.fn(),
          markRunning
        },
        sourceAssetRepository: {
          findById: vi.fn().mockResolvedValue({
            contentType: "image/jpeg",
            id: "asset_1",
            originalFilename: "portrait.jpg",
            ownerUserId: "user_1",
            storageBucket: "ai-nft-forge-private",
            storageObjectKey: "source-assets/user_1/portrait.jpg",
            status: "uploaded"
          })
        }
      }
    });

    const result = await processor({
      attemptsMade: 0,
      data: {
        generationRequestId: "generation_1",
        ownerUserId: "user_1",
        requestedAt: "2026-04-06T00:00:00.000Z",
        sourceAssetId: "asset_1"
      },
      id: "job_1",
      name: "process-source-asset-generation",
      opts: {
        attempts: 3
      },
      queueName: "generation-dispatch"
    });

    expect(markRunning).toHaveBeenCalledWith({
      id: "generation_1",
      startedAt: new Date("2026-04-06T00:00:00.000Z")
    });
    expect(transactionGeneratedAssetCreate).toHaveBeenCalledTimes(2);
    expect(transactionGenerationRequestUpdate).toHaveBeenCalledWith({
      data: {
        completedAt: new Date("2026-04-06T00:00:00.000Z"),
        failedAt: null,
        failureCode: null,
        failureMessage: null,
        resultJson: {
          generatedVariantCount: 2,
          outputGroupKey: "generated-assets/user_1/generation_1",
          storedAssetCount: 2
        },
        status: "succeeded"
      },
      where: {
        id: "generation_1"
      }
    });
    expect(result).toEqual({
      generatedVariantCount: 2,
      generationRequestId: "generation_1",
      outputGroupKey: "generated-assets/user_1/generation_1",
      queueName: "generation-dispatch",
      status: "succeeded",
      storedAssetCount: 2
    });
  });
});
