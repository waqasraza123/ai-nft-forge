import type {
  PublishedCollectionReservation,
  PublishedCollectionReservationStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type PublishedCollectionReservationRepositoryDatabase = Pick<
  DatabaseExecutor,
  "publishedCollectionReservation"
>;

const publishedCollectionReservationDetailInclude = {
  publishedCollection: true,
  publishedCollectionItem: true
};

export function createPublishedCollectionReservationRepository(
  database: PublishedCollectionReservationRepositoryDatabase
) {
  return {
    create(input: {
      buyerDisplayName: string | null;
      buyerEmail: string;
      buyerWalletAddress: string | null;
      expiresAt: Date;
      ownerUserId: string;
      publicId: string;
      publishedCollectionId: string;
      publishedCollectionItemId: string;
      status?: PublishedCollectionReservationStatus;
    }): Promise<PublishedCollectionReservation> {
      return database.publishedCollectionReservation.create({
        data: input
      });
    },

    findByPublicId(publicId: string) {
      return database.publishedCollectionReservation.findUnique({
        include: publishedCollectionReservationDetailInclude,
        where: {
          publicId
        }
      });
    },

    listByPublishedCollectionIdAndStatuses(input: {
      publishedCollectionId: string;
      statuses: PublishedCollectionReservationStatus[];
    }): Promise<
      Array<{
        id: string;
        publishedCollectionItemId: string;
        status: PublishedCollectionReservationStatus;
      }>
    > {
      return database.publishedCollectionReservation.findMany({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        select: {
          id: true,
          publishedCollectionItemId: true,
          status: true
        },
        where: {
          publishedCollectionId: input.publishedCollectionId,
          status: {
            in: input.statuses
          }
        }
      });
    },

    expirePendingByPublishedCollectionId(input: {
      now: Date;
      publishedCollectionId: string;
    }): Promise<{ count: number }> {
      return database.publishedCollectionReservation.updateMany({
        data: {
          status: "expired"
        },
        where: {
          expiresAt: {
            lte: input.now
          },
          publishedCollectionId: input.publishedCollectionId,
          status: "pending"
        }
      });
    },

    updateStatusById(input: {
      canceledAt?: Date | null;
      completedAt?: Date | null;
      id: string;
      status: PublishedCollectionReservationStatus;
    }): Promise<PublishedCollectionReservation> {
      const data: {
        canceledAt?: Date | null;
        completedAt?: Date | null;
        status: PublishedCollectionReservationStatus;
      } = {
        status: input.status
      };

      if (input.canceledAt !== undefined) {
        data.canceledAt = input.canceledAt;
      }

      if (input.completedAt !== undefined) {
        data.completedAt = input.completedAt;
      }

      return database.publishedCollectionReservation.update({
        data,
        where: {
          id: input.id
        }
      });
    }
  };
}

export type PublishedCollectionReservationRepository = ReturnType<
  typeof createPublishedCollectionReservationRepository
>;
