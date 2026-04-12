import type {
  GeneratedAsset,
  GeneratedAssetModerationStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type GeneratedAssetRepositoryDatabase = Pick<
  DatabaseExecutor,
  "generatedAsset"
>;

type CreateGeneratedAssetInput = {
  byteSize: number | null;
  contentType: string;
  generationRequestId: string;
  ownerUserId: string;
  sourceAssetId: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
  workspaceId: string;
};

export function createGeneratedAssetRepository(
  database: GeneratedAssetRepositoryDatabase
) {
  return {
    createMany(inputs: CreateGeneratedAssetInput[]): Promise<GeneratedAsset[]> {
      return Promise.all(
        inputs.map((input) =>
          database.generatedAsset.create({
            data: input
          })
        )
      );
    },

    listByGenerationRequestIds(
      generationRequestIds: string[]
    ): Promise<GeneratedAsset[]> {
      if (generationRequestIds.length === 0) {
        return Promise.resolve([]);
      }

      return database.generatedAsset.findMany({
        orderBy: [
          {
            generationRequestId: "desc"
          },
          {
            variantIndex: "asc"
          }
        ],
        where: {
          generationRequestId: {
            in: generationRequestIds
          }
        }
      });
    },

    listByOwnerUserId(ownerUserId: string): Promise<GeneratedAsset[]> {
      return database.generatedAsset.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<GeneratedAsset | null> {
      return database.generatedAsset.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<GeneratedAsset | null> {
      return database.generatedAsset.findFirst({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    listByWorkspaceId(workspaceId: string): Promise<GeneratedAsset[]> {
      return database.generatedAsset.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId
        }
      });
    },

    updateModerationByIdForOwner(input: {
      id: string;
      moderatedAt: Date | null;
      moderationStatus: GeneratedAssetModerationStatus;
      ownerUserId: string;
    }): Promise<GeneratedAsset | null> {
      return database.generatedAsset
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((asset) => {
          if (!asset) {
            return null;
          }

          return database.generatedAsset.update({
            data: {
              moderatedAt: input.moderatedAt,
              moderationStatus: input.moderationStatus
            },
            where: {
              id: asset.id
            }
          });
        });
    },

    listRecentForOwnerUserId(input: { limit: number; ownerUserId: string }) {
      return database.generatedAsset.findMany({
        include: {
          generationRequest: {
            select: {
              id: true,
              pipelineKey: true,
              sourceAsset: {
                select: {
                  id: true,
                  originalFilename: true
                }
              }
            }
          }
        },
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit,
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    },

    listRecentForWorkspaceId(input: { limit: number; workspaceId: string }) {
      return database.generatedAsset.findMany({
        include: {
          generationRequest: {
            select: {
              id: true,
              pipelineKey: true,
              sourceAsset: {
                select: {
                  id: true,
                  originalFilename: true
                }
              }
            }
          }
        },
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit,
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    updateModerationByIdForWorkspace(input: {
      id: string;
      moderatedAt: Date | null;
      moderationStatus: GeneratedAssetModerationStatus;
      workspaceId: string;
    }): Promise<GeneratedAsset | null> {
      return database.generatedAsset
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((asset) => {
          if (!asset) {
            return null;
          }

          return database.generatedAsset.update({
            data: {
              moderatedAt: input.moderatedAt,
              moderationStatus: input.moderationStatus
            },
            where: {
              id: asset.id
            }
          });
        });
    }
  };
}

export type GeneratedAssetRepository = ReturnType<
  typeof createGeneratedAssetRepository
>;
