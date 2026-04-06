import { describe, expect, it, vi } from "vitest";

import { createGenerationService } from "./service";
import { GenerationServiceError } from "./error";

describe("createGenerationService", () => {
  it("creates and queues a generation request for an uploaded asset", async () => {
    const service = createGenerationService({
      now: () => new Date("2026-04-06T00:00:00.000Z"),
      queue: {
        enqueue: vi.fn().mockResolvedValue({
          jobId: "bullmq_job_1"
        })
      },
      repositories: {
        generationRequestRepository: {
          attachQueueJob: vi.fn().mockImplementation(async (input) => ({
            completedAt: null,
            createdAt: new Date("2026-04-06T00:00:00.000Z"),
            failedAt: null,
            failureCode: null,
            failureMessage: null,
            id: input.id,
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            queueJobId: input.queueJobId,
            requestedVariantCount: 4,
            resultJson: null,
            sourceAssetId: "asset_1",
            startedAt: null,
            status: "queued"
          })),
          createQueued: vi.fn().mockResolvedValue({
            completedAt: null,
            createdAt: new Date("2026-04-06T00:00:00.000Z"),
            failedAt: null,
            failureCode: null,
            failureMessage: null,
            id: "generation_1",
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            queueJobId: null,
            requestedVariantCount: 4,
            resultJson: null,
            sourceAssetId: "asset_1",
            startedAt: null,
            status: "queued"
          }),
          findActiveForSourceAsset: vi.fn().mockResolvedValue(null),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForOwner: vi.fn().mockResolvedValue({
            id: "asset_1",
            ownerUserId: "user_1",
            status: "uploaded"
          })
        }
      }
    });

    const result = await service.createGenerationRequest({
      ownerUserId: "user_1",
      sourceAssetId: "asset_1"
    });

    expect(result.generation.generatedAssets).toEqual([]);
    expect(result.generation.status).toBe("queued");
    expect(result.generation.queueJobId).toBe("bullmq_job_1");
    expect(result.generation.pipelineKey).toBe("collectible-portrait-v1");
  });

  it("rejects generation when an active request already exists", async () => {
    const service = createGenerationService({
      now: () => new Date("2026-04-06T00:00:00.000Z"),
      queue: {
        enqueue: vi.fn()
      },
      repositories: {
        generationRequestRepository: {
          attachQueueJob: vi.fn(),
          createQueued: vi.fn(),
          findActiveForSourceAsset: vi.fn().mockResolvedValue({
            id: "generation_1"
          }),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForOwner: vi.fn().mockResolvedValue({
            id: "asset_1",
            ownerUserId: "user_1",
            status: "uploaded"
          })
        }
      }
    });

    await expect(
      service.createGenerationRequest({
        ownerUserId: "user_1",
        sourceAssetId: "asset_1"
      })
    ).rejects.toEqual(
      new GenerationServiceError(
        "ACTIVE_GENERATION_EXISTS",
        "A generation request is already active for this source asset.",
        409
      )
    );
  });
});
