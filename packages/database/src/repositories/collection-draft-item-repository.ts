import type { CollectionDraftItem } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type CollectionDraftItemRepositoryDatabase = Pick<
  DatabaseExecutor,
  "collectionDraftItem"
>;

export function createCollectionDraftItemRepository(
  database: CollectionDraftItemRepositoryDatabase
) {
  return {
    create(input: {
      collectionDraftId: string;
      generatedAssetId: string;
      position: number;
    }): Promise<CollectionDraftItem> {
      return database.collectionDraftItem.create({
        data: input
      });
    },

    deleteByIdForDraftOwner(input: {
      collectionDraftId: string;
      id: string;
      ownerUserId: string;
    }): Promise<CollectionDraftItem | null> {
      return database.collectionDraftItem
        .findFirst({
          where: {
            collectionDraft: {
              ownerUserId: input.ownerUserId
            },
            collectionDraftId: input.collectionDraftId,
            id: input.id
          }
        })
        .then((item) => {
          if (!item) {
            return null;
          }

          return database.collectionDraftItem.delete({
            where: {
              id: item.id
            }
          });
        });
    },

    findByGeneratedAssetIdForDraft(input: {
      collectionDraftId: string;
      generatedAssetId: string;
    }): Promise<CollectionDraftItem | null> {
      return database.collectionDraftItem.findUnique({
        where: {
          collectionDraftId_generatedAssetId: {
            collectionDraftId: input.collectionDraftId,
            generatedAssetId: input.generatedAssetId
          }
        }
      });
    },

    listByCollectionDraftIdForOwner(input: {
      collectionDraftId: string;
      ownerUserId: string;
    }) {
      return database.collectionDraftItem.findMany({
        orderBy: [
          {
            position: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          collectionDraft: {
            ownerUserId: input.ownerUserId
          },
          collectionDraftId: input.collectionDraftId
        }
      });
    },

    updatePosition(input: {
      id: string;
      position: number;
    }): Promise<CollectionDraftItem> {
      return database.collectionDraftItem.update({
        data: {
          position: input.position
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type CollectionDraftItemRepository = ReturnType<
  typeof createCollectionDraftItemRepository
>;
