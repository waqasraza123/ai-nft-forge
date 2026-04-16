import {
  generationRequestCreateRequestSchema,
  generationRequestCreateResponseSchema,
  generationRequestSummarySchema,
  generationResultSummarySchema,
  type GenerationRequestStatus,
  type SourceAssetStatus
} from "@ai-nft-forge/shared";

import { GenerationServiceError } from "./error";

type SourceAssetRecord = {
  id: string;
  ownerUserId: string;
  status: SourceAssetStatus;
};

type GenerationRequestRecord = {
  completedAt: Date | null;
  createdAt: Date;
  failedAt: Date | null;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
  ownerUserId: string;
  pipelineKey: string;
  queueJobId: string | null;
  requestedVariantCount: number;
  resultJson: unknown;
  sourceAssetId: string;
  startedAt: Date | null;
  status: GenerationRequestStatus;
};

type GenerationRepositorySet = {
  generationRequestRepository: {
    attachQueueJob(input: {
      id: string;
      queueJobId: string;
    }): Promise<GenerationRequestRecord>;
    createQueued(input: {
      ownerUserId: string;
      pipelineKey: string;
      requestedVariantCount: number;
      sourceAssetId: string;
      workspaceId: string;
    }): Promise<GenerationRequestRecord>;
    findActiveForWorkspaceSourceAsset(input: {
      sourceAssetId: string;
      workspaceId: string;
    }): Promise<GenerationRequestRecord | null>;
    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<GenerationRequestRecord | null>;
    markFailed(input: {
      failureCode: string;
      failureMessage: string;
      failedAt: Date;
      id: string;
    }): Promise<GenerationRequestRecord>;
  };
  sourceAssetRepository: {
    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<SourceAssetRecord | null>;
  };
};

type GenerationQueueBoundary = {
  enqueue(input: {
    generationRequestId: string;
    ownerUserId: string;
    requestedAt: string;
    sourceAssetId: string;
  }): Promise<{
    jobId: string;
  }>;
};

type GenerationServiceDependencies = {
  now: () => Date;
  queue: GenerationQueueBoundary;
  repositories: GenerationRepositorySet;
};

function serializeGenerationRequest(
  generationRequest: GenerationRequestRecord
) {
  return generationRequestSummarySchema.parse({
    completedAt: generationRequest.completedAt?.toISOString() ?? null,
    createdAt: generationRequest.createdAt.toISOString(),
    failedAt: generationRequest.failedAt?.toISOString() ?? null,
    failureCode: generationRequest.failureCode,
    failureMessage: generationRequest.failureMessage,
    generatedAssets: [],
    id: generationRequest.id,
    pipelineKey: generationRequest.pipelineKey,
    queueJobId: generationRequest.queueJobId,
    requestedVariantCount: generationRequest.requestedVariantCount,
    result: generationRequest.resultJson
      ? generationResultSummarySchema.parse(generationRequest.resultJson)
      : null,
    sourceAssetId: generationRequest.sourceAssetId,
    startedAt: generationRequest.startedAt?.toISOString() ?? null,
    status: generationRequest.status
  });
}

async function enqueueCreatedGenerationRequest(
  dependencies: GenerationServiceDependencies,
  generationRequest: GenerationRequestRecord
) {
  try {
    const queuedJob = await dependencies.queue.enqueue({
      generationRequestId: generationRequest.id,
      ownerUserId: generationRequest.ownerUserId,
      requestedAt: dependencies.now().toISOString(),
      sourceAssetId: generationRequest.sourceAssetId
    });
    const queuedGeneration =
      await dependencies.repositories.generationRequestRepository.attachQueueJob(
        {
          id: generationRequest.id,
          queueJobId: queuedJob.jobId
        }
      );

    return generationRequestCreateResponseSchema.parse({
      generation: serializeGenerationRequest(queuedGeneration)
    });
  } catch {
    await dependencies.repositories.generationRequestRepository.markFailed({
      failureCode: "QUEUE_ENQUEUE_FAILED",
      failureMessage: "The generation request could not be queued.",
      failedAt: dependencies.now(),
      id: generationRequest.id
    });

    throw new GenerationServiceError(
      "GENERATION_QUEUE_ERROR",
      "The generation request could not be queued.",
      500
    );
  }
}

export function createGenerationService(
  dependencies: GenerationServiceDependencies
) {
  return {
    async createGenerationRequest(input: {
      ownerUserId: string;
      pipelineKey?: string;
      sourceAssetId: string;
      variantCount?: number;
      workspaceId: string;
    }) {
      const parsedInput = generationRequestCreateRequestSchema.parse(input);
      const sourceAsset =
        await dependencies.repositories.sourceAssetRepository.findByIdForWorkspace(
          {
            id: parsedInput.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      if (!sourceAsset) {
        throw new GenerationServiceError(
          "SOURCE_ASSET_NOT_FOUND",
          "Source asset was not found.",
          404
        );
      }

      if (sourceAsset.status !== "uploaded") {
        throw new GenerationServiceError(
          "SOURCE_ASSET_NOT_READY",
          "Source asset must be uploaded before generation can start.",
          409
        );
      }

      const activeGeneration =
        await dependencies.repositories.generationRequestRepository.findActiveForWorkspaceSourceAsset(
          {
            sourceAssetId: parsedInput.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      if (activeGeneration) {
        throw new GenerationServiceError(
          "ACTIVE_GENERATION_EXISTS",
          "A generation request is already active for this source asset.",
          409
        );
      }

      const generationRequest =
        await dependencies.repositories.generationRequestRepository.createQueued(
          {
            ownerUserId: input.ownerUserId,
            pipelineKey: parsedInput.pipelineKey,
            requestedVariantCount: parsedInput.variantCount,
            sourceAssetId: parsedInput.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      return enqueueCreatedGenerationRequest(dependencies, generationRequest);
    },

    async retryGenerationRequest(input: {
      generationRequestId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const existingGeneration =
        await dependencies.repositories.generationRequestRepository.findByIdForWorkspace(
          {
            id: input.generationRequestId,
            workspaceId: input.workspaceId
          }
        );

      if (!existingGeneration) {
        throw new GenerationServiceError(
          "GENERATION_NOT_FOUND",
          "Generation request was not found.",
          404
        );
      }

      if (existingGeneration.status !== "failed") {
        throw new GenerationServiceError(
          "GENERATION_NOT_RETRYABLE",
          "Only failed generation requests can be retried.",
          409
        );
      }

      const sourceAsset =
        await dependencies.repositories.sourceAssetRepository.findByIdForWorkspace(
          {
            id: existingGeneration.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      if (!sourceAsset) {
        throw new GenerationServiceError(
          "SOURCE_ASSET_NOT_FOUND",
          "Source asset was not found.",
          404
        );
      }

      if (sourceAsset.status !== "uploaded") {
        throw new GenerationServiceError(
          "SOURCE_ASSET_NOT_READY",
          "Source asset must be uploaded before generation can start.",
          409
        );
      }

      const activeGeneration =
        await dependencies.repositories.generationRequestRepository.findActiveForWorkspaceSourceAsset(
          {
            sourceAssetId: existingGeneration.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      if (activeGeneration) {
        throw new GenerationServiceError(
          "ACTIVE_GENERATION_EXISTS",
          "A generation request is already active for this source asset.",
          409
        );
      }

      const retriedGeneration =
        await dependencies.repositories.generationRequestRepository.createQueued(
          {
            ownerUserId: input.ownerUserId,
            pipelineKey: existingGeneration.pipelineKey,
            requestedVariantCount: existingGeneration.requestedVariantCount,
            sourceAssetId: existingGeneration.sourceAssetId,
            workspaceId: input.workspaceId
          }
        );

      return enqueueCreatedGenerationRequest(dependencies, retriedGeneration);
    }
  };
}
