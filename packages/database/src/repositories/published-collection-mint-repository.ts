import type { PublishedCollectionMint } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type PublishedCollectionMintRepositoryDatabase = Pick<
  DatabaseExecutor,
  "publishedCollectionMint"
>;

export function createPublishedCollectionMintRepository(
  database: PublishedCollectionMintRepositoryDatabase
) {
  return {
    create(input: {
      mintedAt: Date;
      ownerUserId: string;
      publishedCollectionId: string;
      publishedCollectionItemId: string;
      recipientWalletAddress: string;
      tokenId: number;
      txHash: string;
    }): Promise<PublishedCollectionMint> {
      return database.publishedCollectionMint.create({
        data: input
      });
    },

    findByTokenIdForPublishedCollection(input: {
      publishedCollectionId: string;
      tokenId: number;
    }): Promise<PublishedCollectionMint | null> {
      return database.publishedCollectionMint.findFirst({
        where: {
          publishedCollectionId: input.publishedCollectionId,
          tokenId: input.tokenId
        }
      });
    },

    listByPublishedCollectionId(publishedCollectionId: string) {
      return database.publishedCollectionMint.findMany({
        orderBy: [
          {
            mintedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          publishedCollectionId
        }
      });
    }
  };
}

export type PublishedCollectionMintRepository = ReturnType<
  typeof createPublishedCollectionMintRepository
>;
