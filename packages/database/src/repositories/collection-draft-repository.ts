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
    }): Promise<CollectionDraft> {
      return database.collectionDraft.create({
        data: {
          description: input.description,
          ownerUserId: input.ownerUserId,
          slug: input.slug,
          title: input.title
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

    findDetailedByIdForOwner(input: { id: string; ownerUserId: string }) {
      return database.collectionDraft.findFirst({
        include: collectionDraftDetailInclude,
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findBySlugForOwner(input: {
      ownerUserId: string;
      slug: string;
    }): Promise<CollectionDraft | null> {
      return database.collectionDraft.findUnique({
        where: {
          ownerUserId_slug: {
            ownerUserId: input.ownerUserId,
            slug: input.slug
          }
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
    }
  };
}

export type CollectionDraftRepository = ReturnType<
  typeof createCollectionDraftRepository
>;
