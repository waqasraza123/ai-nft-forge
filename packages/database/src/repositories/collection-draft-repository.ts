import type { CollectionDraft, CollectionDraftStatus } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type CollectionDraftRepositoryDatabase = Pick<
  DatabaseExecutor,
  "collectionDraft"
>;

const collectionDraftItemOrderBy = [
  {
    position: "asc" as const
  },
  {
    id: "asc" as const
  }
];

const collectionDraftDetailInclude = {
  items: {
    include: {
      generatedAsset: {
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
        }
      }
    },
    orderBy: collectionDraftItemOrderBy
  }
};

export function createCollectionDraftRepository(
  database: CollectionDraftRepositoryDatabase
) {
  return {
    create(input: {
      description: string | null;
      ownerUserId: string;
      slug: string;
      title: string;
      workspaceId: string;
    }): Promise<CollectionDraft> {
      return database.collectionDraft.create({
        data: {
          description: input.description,
          ownerUserId: input.ownerUserId,
          slug: input.slug,
          title: input.title,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft.findFirst({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    findDetailedByIdForOwner(input: { id: string; ownerUserId: string }) {
      return database.collectionDraft.findFirst({
        include: collectionDraftDetailInclude,
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findDetailedByIdForWorkspace(input: { id: string; workspaceId: string }) {
      return database.collectionDraft.findFirst({
        include: collectionDraftDetailInclude,
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    findBySlugForOwner(input: {
      ownerUserId: string;
      slug: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft.findFirst({
        where: {
          ownerUserId: input.ownerUserId,
          slug: input.slug
        }
      });
    },

    findBySlugForWorkspace(input: {
      slug: string;
      workspaceId: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft.findFirst({
        where: {
          slug: input.slug,
          workspaceId: input.workspaceId
        }
      });
    },

    listByOwnerUserId(ownerUserId: string) {
      return database.collectionDraft.findMany({
        include: collectionDraftDetailInclude,
        orderBy: [
          {
            updatedAt: "desc"
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

    listByWorkspaceId(workspaceId: string) {
      return database.collectionDraft.findMany({
        include: collectionDraftDetailInclude,
        orderBy: [
          {
            updatedAt: "desc"
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

    updateByIdForOwner(input: {
      description: string | null;
      id: string;
      ownerUserId: string;
      slug: string;
      status: CollectionDraftStatus;
      title: string;
    }): Promise<CollectionDraft> {
      return database.collectionDraft
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((draft) => {
          if (!draft) {
            throw new Error("Collection draft was not found.");
          }

          return database.collectionDraft.update({
            data: {
              description: input.description,
              slug: input.slug,
              status: input.status,
              title: input.title
            },
            where: {
              id: draft.id
            }
          });
        });
    },

    updateByIdForWorkspace(input: {
      description: string | null;
      id: string;
      slug: string;
      status: CollectionDraftStatus;
      title: string;
      workspaceId: string;
    }): Promise<CollectionDraft> {
      return database.collectionDraft
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((draft) => {
          if (!draft) {
            throw new Error("Collection draft was not found.");
          }

          return database.collectionDraft.update({
            data: {
              description: input.description,
              slug: input.slug,
              status: input.status,
              title: input.title
            },
            where: {
              id: draft.id
            }
          });
        });
    },

    updateStatusByIdForOwner(input: {
      id: string;
      ownerUserId: string;
      status: CollectionDraftStatus;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((draft) => {
          if (!draft) {
            return null;
          }

          return database.collectionDraft.update({
            data: {
              status: input.status
            },
            where: {
              id: draft.id
            }
          });
        });
    },

    updateStatusByIdForWorkspace(input: {
      id: string;
      status: CollectionDraftStatus;
      workspaceId: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((draft) => {
          if (!draft) {
            return null;
          }

          return database.collectionDraft.update({
            data: {
              status: input.status
            },
            where: {
              id: draft.id
            }
          });
        });
    }
  };
}

export type CollectionDraftRepository = ReturnType<
  typeof createCollectionDraftRepository
>;
