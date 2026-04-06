import { Prisma, type GenerationRequest } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type GenerationRequestRepositoryDatabase = Pick<
  DatabaseExecutor,
  "generationRequest"
>;

type CreateQueuedGenerationRequestInput = {
  ownerUserId: string;
  pipelineKey: string;
  requestedVariantCount: number;
  sourceAssetId: string;
};

export function createGenerationRequestRepository(
  database: GenerationRequestRepositoryDatabase
) {
  return {
    attachQueueJob(input: {
      id: string;
      queueJobId: string;
    }): Promise<GenerationRequest> {
      return database.generationRequest.update({
        data: {
          queueJobId: input.queueJobId
        },
        where: {
          id: input.id
        }
      });
    },

    createQueued(
      input: CreateQueuedGenerationRequestInput
    ): Promise<GenerationRequest> {
      return database.generationRequest.create({
        data: {
          ...input,
          status: "queued"
        }
      });
    },

    findActiveForSourceAsset(input: {
      ownerUserId: string;
      sourceAssetId: string;
    }): Promise<GenerationRequest | null> {
      return database.generationRequest.findFirst({
        orderBy: {
          createdAt: "desc"
        },
        where: {
          ownerUserId: input.ownerUserId,
          sourceAssetId: input.sourceAssetId,
          status: {
            in: ["queued", "running"]
          }
        }
      });
    },

    findById(id: string): Promise<GenerationRequest | null> {
      return database.generationRequest.findUnique({
        where: {
          id
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<GenerationRequest | null> {
      return database.generationRequest.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    listBySourceAssetIds(
      sourceAssetIds: string[]
    ): Promise<GenerationRequest[]> {
      if (sourceAssetIds.length === 0) {
        return Promise.resolve([]);
      }

      return database.generationRequest.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          sourceAssetId: {
            in: sourceAssetIds
          }
        }
      });
    },

    markFailed(input: {
      failureCode: string;
      failureMessage: string;
      failedAt: Date;
      id: string;
    }): Promise<GenerationRequest> {
      return database.generationRequest.update({
        data: {
          completedAt: null,
          failedAt: input.failedAt,
          failureCode: input.failureCode,
          failureMessage: input.failureMessage,
          resultJson: Prisma.DbNull,
          status: "failed"
        },
        where: {
          id: input.id
        }
      });
    },

    markQueuedForRetry(id: string): Promise<GenerationRequest> {
      return database.generationRequest.update({
        data: {
          completedAt: null,
          failedAt: null,
          failureCode: null,
          failureMessage: null,
          startedAt: null,
          status: "queued"
        },
        where: {
          id
        }
      });
    },

    markRunning(input: {
      id: string;
      startedAt: Date;
    }): Promise<GenerationRequest> {
      return database.generationRequest.update({
        data: {
          completedAt: null,
          failedAt: null,
          failureCode: null,
          failureMessage: null,
          startedAt: input.startedAt,
          status: "running"
        },
        where: {
          id: input.id
        }
      });
    },

    markSucceeded(input: {
      completedAt: Date;
      id: string;
      resultJson: Prisma.InputJsonValue;
    }): Promise<GenerationRequest> {
      return database.generationRequest.update({
        data: {
          completedAt: input.completedAt,
          failedAt: null,
          failureCode: null,
          failureMessage: null,
          resultJson: input.resultJson,
          status: "succeeded"
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type GenerationRequestRepository = ReturnType<
  typeof createGenerationRequestRepository
>;
