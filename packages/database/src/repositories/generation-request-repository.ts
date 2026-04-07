import {
  Prisma,
  type GenerationRequest,
  type GenerationRequestStatus
} from "@prisma/client";

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

type RecentGenerationRequestOrder = "createdAtDesc" | "failedAtDesc";

type GenerationRequestWithSourceAssetAndCounts =
  Prisma.GenerationRequestGetPayload<{
    include: {
      _count: {
        select: {
          generatedAssets: true;
        };
      };
      sourceAsset: {
        select: {
          id: true;
          originalFilename: true;
          status: true;
        };
      };
    };
  }>;

const generationRequestActivityInclude = {
  _count: {
    select: {
      generatedAssets: true
    }
  },
  sourceAsset: {
    select: {
      id: true,
      originalFilename: true,
      status: true
    }
  }
} satisfies Prisma.GenerationRequestInclude;

function resolveRecentGenerationOrderBy(orderBy: RecentGenerationRequestOrder) {
  if (orderBy === "failedAtDesc") {
    return [
      {
        failedAt: "desc" as const
      },
      {
        createdAt: "desc" as const
      },
      {
        id: "desc" as const
      }
    ];
  }

  return [
    {
      createdAt: "desc" as const
    },
    {
      id: "desc" as const
    }
  ];
}

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

    async listDistinctOwnerUserIds(): Promise<string[]> {
      const rows = await database.generationRequest.findMany({
        distinct: ["ownerUserId"],
        orderBy: {
          ownerUserId: "asc"
        },
        select: {
          ownerUserId: true
        }
      });

      return rows.map((row) => row.ownerUserId);
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

    listRecentForOwnerUserId(input: {
      limit: number;
      orderBy?: RecentGenerationRequestOrder;
      ownerUserId: string;
      statuses?: GenerationRequestStatus[];
    }): Promise<GenerationRequestWithSourceAssetAndCounts[]> {
      return database.generationRequest.findMany({
        include: generationRequestActivityInclude,
        orderBy: resolveRecentGenerationOrderBy(
          input.orderBy ?? "createdAtDesc"
        ),
        take: input.limit,
        where: {
          ownerUserId: input.ownerUserId,
          ...(input.statuses && input.statuses.length > 0
            ? {
                status: {
                  in: input.statuses
                }
              }
            : {})
        }
      });
    },

    listRecentForOwnerUserIdSince(input: {
      orderBy?: RecentGenerationRequestOrder;
      ownerUserId: string;
      since: Date;
      statuses?: GenerationRequestStatus[];
    }): Promise<GenerationRequestWithSourceAssetAndCounts[]> {
      return database.generationRequest.findMany({
        include: generationRequestActivityInclude,
        orderBy: resolveRecentGenerationOrderBy(
          input.orderBy ?? "createdAtDesc"
        ),
        where: {
          createdAt: {
            gte: input.since
          },
          ownerUserId: input.ownerUserId,
          ...(input.statuses && input.statuses.length > 0
            ? {
                status: {
                  in: input.statuses
                }
              }
            : {})
        }
      });
    },

    findOldestForOwnerUserId(input: {
      ownerUserId: string;
      statuses: GenerationRequestStatus[];
    }): Promise<GenerationRequestWithSourceAssetAndCounts | null> {
      if (input.statuses.length === 0) {
        return Promise.resolve(null);
      }

      return database.generationRequest.findFirst({
        include: generationRequestActivityInclude,
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          ownerUserId: input.ownerUserId,
          status: {
            in: input.statuses
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
