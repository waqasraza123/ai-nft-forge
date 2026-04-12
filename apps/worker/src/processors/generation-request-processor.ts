import type { Job } from "bullmq";

import {
  createGeneratedAssetRepository,
  createGenerationRequestRepository,
  runDatabaseTransaction,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  generationJobPayloadSchema,
  generationResultSummarySchema,
  type GenerationJobPayload,
  type GenerationRequestStatus
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";
import type {
  GenerationAdapter,
  MaterializedGeneratedAsset
} from "../generation/adapter.js";

type GenerationRequestRecord = {
  id: string;
  ownerUserId: string;
  pipelineKey: string;
  requestedVariantCount: number;
  resultJson: unknown;
  sourceAssetId: string;
  status: GenerationRequestStatus;
};

type SourceAssetRecord = {
  contentType: string;
  id: string;
  originalFilename: string;
  ownerUserId: string;
  storageBucket: string;
  storageObjectKey: string;
  status: string;
};

type GenerationRequestProcessorDependencies = {
  adapter: GenerationAdapter;
  databaseClient: DatabaseClient;
  logger: Logger;
  now: () => Date;
  repositories: {
    generationRequestRepository: {
      findById(id: string): Promise<GenerationRequestRecord | null>;
      markFailed(input: {
        failureCode: string;
        failureMessage: string;
        failedAt: Date;
        id: string;
      }): Promise<unknown>;
      markQueuedForRetry(id: string): Promise<unknown>;
      markRunning(input: { id: string; startedAt: Date }): Promise<unknown>;
    };
    sourceAssetRepository: {
      findById(id: string): Promise<SourceAssetRecord | null>;
    };
  };
};

export type GenerationRequestJobResult = {
  generatedVariantCount: number;
  generationRequestId: string;
  outputGroupKey: string;
  queueName: string;
  status: "succeeded";
  storedAssetCount: number;
};

type GenerationRequestJob = Pick<
  Job<GenerationJobPayload>,
  "attemptsMade" | "data" | "id" | "name" | "opts" | "queueName"
>;

function resolveTotalAttempts(job: GenerationRequestJob) {
  return typeof job.opts.attempts === "number" && job.opts.attempts > 0
    ? job.opts.attempts
    : 1;
}

function requireWorkspaceId(
  record: { id: string } & Record<string, unknown>,
  label: string
) {
  const workspaceId =
    typeof record.workspaceId === "string" ? record.workspaceId : null;

  if (!workspaceId) {
    throw new Error(`${label} ${record.id} is missing a workspace scope.`);
  }

  return workspaceId;
}

export function createGenerationRequestProcessor(
  dependencies: GenerationRequestProcessorDependencies
) {
  return async (
    job: GenerationRequestJob
  ): Promise<GenerationRequestJobResult> => {
    const payload = generationJobPayloadSchema.parse(job.data);
    const totalAttempts = resolveTotalAttempts(job);
    const isFinalAttempt = job.attemptsMade + 1 >= totalAttempts;
    const generationRequest =
      await dependencies.repositories.generationRequestRepository.findById(
        payload.generationRequestId
      );

    if (!generationRequest) {
      throw new Error(
        `Generation request ${payload.generationRequestId} was not found.`
      );
    }

    const workspaceId = requireWorkspaceId(
      generationRequest as GenerationRequestRecord & Record<string, unknown>,
      "Generation request"
    );

    if (
      generationRequest.status === "succeeded" &&
      generationRequest.resultJson
    ) {
      const existingResult = generationResultSummarySchema.parse(
        generationRequest.resultJson
      );

      return {
        generatedVariantCount: existingResult.generatedVariantCount,
        generationRequestId: generationRequest.id,
        outputGroupKey: existingResult.outputGroupKey,
        queueName: job.queueName,
        status: "succeeded",
        storedAssetCount: existingResult.storedAssetCount
      };
    }

    const sourceAsset =
      await dependencies.repositories.sourceAssetRepository.findById(
        generationRequest.sourceAssetId
      );

    if (!sourceAsset || sourceAsset.status !== "uploaded") {
      const failureMessage =
        "Source asset must remain uploaded while generation is processed.";

      await dependencies.repositories.generationRequestRepository.markFailed({
        failureCode: "SOURCE_ASSET_NOT_READY",
        failureMessage,
        failedAt: dependencies.now(),
        id: generationRequest.id
      });

      throw new Error(failureMessage);
    }

    let materializedOutputs: MaterializedGeneratedAsset[] = [];

    try {
      await dependencies.repositories.generationRequestRepository.markRunning({
        id: generationRequest.id,
        startedAt: dependencies.now()
      });
      const materialization =
        await dependencies.adapter.materializeGenerationOutputs({
          generationRequest: {
            id: generationRequest.id,
            ownerUserId: generationRequest.ownerUserId,
            pipelineKey: generationRequest.pipelineKey,
            requestedVariantCount: generationRequest.requestedVariantCount,
            sourceAssetId: generationRequest.sourceAssetId
          },
          sourceAsset: {
            contentType: sourceAsset.contentType,
            originalFilename: sourceAsset.originalFilename,
            storageBucket: sourceAsset.storageBucket,
            storageObjectKey: sourceAsset.storageObjectKey
          }
        });
      const completedAt = dependencies.now();

      materializedOutputs = materialization.generatedAssets;

      await runDatabaseTransaction(
        dependencies.databaseClient,
        async (transaction) => {
          await createGeneratedAssetRepository(transaction).createMany(
            materializedOutputs.map((output) => ({
              byteSize: output.byteSize,
              contentType: output.contentType,
              generationRequestId: generationRequest.id,
              ownerUserId: generationRequest.ownerUserId,
              sourceAssetId: generationRequest.sourceAssetId,
              storageBucket: output.storageBucket,
              storageObjectKey: output.storageObjectKey,
              variantIndex: output.variantIndex,
              workspaceId
            }))
          );
          await createGenerationRequestRepository(transaction).markSucceeded({
            completedAt,
            id: generationRequest.id,
            resultJson: generationResultSummarySchema.parse({
              generatedVariantCount: generationRequest.requestedVariantCount,
              outputGroupKey: materialization.outputGroupKey,
              storedAssetCount: materializedOutputs.length
            })
          });
        }
      );

      const result = generationResultSummarySchema.parse({
        generatedVariantCount: generationRequest.requestedVariantCount,
        outputGroupKey: materialization.outputGroupKey,
        storedAssetCount: materializedOutputs.length
      });

      dependencies.logger.info("Processed generation request worker job", {
        generatedVariantCount: result.generatedVariantCount,
        generationRequestId: generationRequest.id,
        jobId: job.id,
        jobName: job.name,
        outputGroupKey: result.outputGroupKey,
        queueName: job.queueName,
        storedAssetCount: result.storedAssetCount
      });

      return {
        generatedVariantCount: result.generatedVariantCount,
        generationRequestId: generationRequest.id,
        outputGroupKey: result.outputGroupKey,
        queueName: job.queueName,
        status: "succeeded",
        storedAssetCount: result.storedAssetCount
      };
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message : "Unknown generation failure.";

      if (materializedOutputs.length > 0) {
        await dependencies.adapter.cleanupMaterializedOutputs(
          materializedOutputs
        );
      }

      if (isFinalAttempt) {
        await dependencies.repositories.generationRequestRepository.markFailed({
          failureCode: "GENERATION_PROCESSING_FAILED",
          failureMessage,
          failedAt: dependencies.now(),
          id: generationRequest.id
        });
      } else {
        await dependencies.repositories.generationRequestRepository.markQueuedForRetry(
          generationRequest.id
        );
      }

      throw error;
    }
  };
}
