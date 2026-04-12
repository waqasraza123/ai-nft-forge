import { describe, expect, it, vi } from "vitest";

import { createGenerationService } from "./service";
import { GenerationServiceError } from "./error";

const defaultWorkspaceId = "workspace_1";

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
          findByIdForWorkspace: vi.fn(),
          findActiveForWorkspaceSourceAsset: vi.fn().mockResolvedValue(null),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForWorkspace: vi.fn().mockResolvedValue({
            id: "asset_1",
            ownerUserId: "user_1",
            status: "uploaded"
          })
        }
      }
    });

    const result = await service.createGenerationRequest({
      ownerUserId: "user_1",
      sourceAssetId: "asset_1",
      workspaceId: defaultWorkspaceId
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
          findByIdForWorkspace: vi.fn(),
          findActiveForWorkspaceSourceAsset: vi.fn().mockResolvedValue({
            id: "generation_1"
          }),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForWorkspace: vi.fn().mockResolvedValue({
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
        sourceAssetId: "asset_1",
        workspaceId: defaultWorkspaceId
      })
    ).rejects.toEqual(
      new GenerationServiceError(
        "ACTIVE_GENERATION_EXISTS",
        "A generation request is already active for this source asset.",
        409
      )
    );
  });

  it("retries a failed generation request with the same pipeline and variant count", async () => {
    const service = createGenerationService({
      now: () => new Date("2026-04-06T00:00:00.000Z"),
      queue: {
        enqueue: vi.fn().mockResolvedValue({
          jobId: "bullmq_job_2"
        })
      },
      repositories: {
        generationRequestRepository: {
          attachQueueJob: vi.fn().mockImplementation(async (input) => ({
            completedAt: null,
            createdAt: new Date("2026-04-06T00:00:05.000Z"),
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
            createdAt: new Date("2026-04-06T00:00:05.000Z"),
            failedAt: null,
            failureCode: null,
            failureMessage: null,
            id: "generation_2",
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            queueJobId: null,
            requestedVariantCount: 4,
            resultJson: null,
            sourceAssetId: "asset_1",
            startedAt: null,
            status: "queued"
          }),
          findActiveForWorkspaceSourceAsset: vi.fn().mockResolvedValue(null),
          findByIdForWorkspace: vi.fn().mockResolvedValue({
            completedAt: null,
            createdAt: new Date("2026-04-06T00:00:00.000Z"),
            failedAt: new Date("2026-04-06T00:00:04.000Z"),
            failureCode: "GENERATION_PROCESSING_FAILED",
            failureMessage: "ComfyUI request failed.",
            id: "generation_1",
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            queueJobId: "bullmq_job_1",
            requestedVariantCount: 4,
            resultJson: null,
            sourceAssetId: "asset_1",
            startedAt: new Date("2026-04-06T00:00:01.000Z"),
            status: "failed"
          }),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForWorkspace: vi.fn().mockResolvedValue({
            id: "asset_1",
            ownerUserId: "user_1",
            status: "uploaded"
          })
        }
      }
    });

    const result = await service.retryGenerationRequest({
      generationRequestId: "generation_1",
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(result.generation.id).toBe("generation_2");
    expect(result.generation.status).toBe("queued");
    expect(result.generation.requestedVariantCount).toBe(4);
    expect(result.generation.queueJobId).toBe("bullmq_job_2");
  });

  it("rejects retry when the generation request did not fail", async () => {
    const service = createGenerationService({
      now: () => new Date("2026-04-06T00:00:00.000Z"),
      queue: {
        enqueue: vi.fn()
      },
      repositories: {
        generationRequestRepository: {
          attachQueueJob: vi.fn(),
          createQueued: vi.fn(),
          findActiveForWorkspaceSourceAsset: vi.fn(),
          findByIdForWorkspace: vi.fn().mockResolvedValue({
            completedAt: new Date("2026-04-06T00:00:04.000Z"),
            createdAt: new Date("2026-04-06T00:00:00.000Z"),
            failedAt: null,
            failureCode: null,
            failureMessage: null,
            id: "generation_1",
            ownerUserId: "user_1",
            pipelineKey: "collectible-portrait-v1",
            queueJobId: "bullmq_job_1",
            requestedVariantCount: 4,
            resultJson: {
              generatedVariantCount: 4,
              outputGroupKey: "generated-assets/user_1/generation_1",
              storedAssetCount: 4
            },
            sourceAssetId: "asset_1",
            startedAt: new Date("2026-04-06T00:00:01.000Z"),
            status: "succeeded"
          }),
          markFailed: vi.fn()
        },
        sourceAssetRepository: {
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    await expect(
      service.retryGenerationRequest({
        generationRequestId: "generation_1",
        ownerUserId: "user_1",
        workspaceId: defaultWorkspaceId
      })
    ).rejects.toEqual(
      new GenerationServiceError(
        "GENERATION_NOT_RETRYABLE",
        "Only failed generation requests can be retried.",
        409
      )
    );
  });
});
