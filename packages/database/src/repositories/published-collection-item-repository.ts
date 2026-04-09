import type { PublishedCollectionItem } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type PublishedCollectionItemRepositoryDatabase = Pick<
  DatabaseExecutor,
  "publishedCollectionItem"
>;

export function createPublishedCollectionItemRepository(
  database: PublishedCollectionItemRepositoryDatabase
) {
  return {
    createMany(
      inputs: Array<{
        generatedAssetId: string;
        position: number;
        publicStorageBucket?: string | null;
        publicStorageObjectKey?: string | null;
        publishedCollectionId: string;
      }>
    ): Promise<PublishedCollectionItem[]> {
      return Promise.all(
        inputs.map((input) =>
          database.publishedCollectionItem.create({
            data: input
          })
        )
      );
    },

    listByPublishedCollectionId(publishedCollectionId: string): Promise<
      Array<{
        generatedAssetId: string;
        id: string;
        publicStorageBucket: string | null;
        publicStorageObjectKey: string | null;
      }>
    > {
      return database.publishedCollectionItem.findMany({
        orderBy: [
          {
            position: "asc"
          },
          {
            id: "asc"
          }
        ],
        select: {
          generatedAssetId: true,
          id: true,
          publicStorageBucket: true,
          publicStorageObjectKey: true
        },
        where: {
          publishedCollectionId
        }
      });
    },

    deleteByPublishedCollectionId(
      publishedCollectionId: string
    ): Promise<{ count: number }> {
      return database.publishedCollectionItem.deleteMany({
        where: {
          publishedCollectionId
        }
      });
    }
  };
}

export type PublishedCollectionItemRepository = ReturnType<
  typeof createPublishedCollectionItemRepository
>;
