import type {
  CommerceCheckoutProviderKind,
  CommerceCheckoutSession,
  CommerceCheckoutSessionStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type CommerceCheckoutSessionRepositoryDatabase = Pick<
  DatabaseExecutor,
  "commerceCheckoutSession"
>;

const commerceCheckoutSessionDetailInclude = {
  publishedCollection: true,
  reservation: {
    include: {
      publishedCollectionItem: true
    }
  }
};

export function createCommerceCheckoutSessionRepository(
  database: CommerceCheckoutSessionRepositoryDatabase
) {
  return {
    create(input: {
      checkoutUrl: string;
      expiresAt: Date;
      ownerUserId: string;
      providerKind: CommerceCheckoutProviderKind;
      publicId: string;
      publishedCollectionId: string;
      reservationId: string;
      status?: CommerceCheckoutSessionStatus;
    }): Promise<CommerceCheckoutSession> {
      return database.commerceCheckoutSession.create({
        data: input
      });
    },

    findByPublicId(publicId: string) {
      return database.commerceCheckoutSession.findUnique({
        include: commerceCheckoutSessionDetailInclude,
        where: {
          publicId
        }
      });
    },

    expireOpenByPublishedCollectionId(input: {
      now: Date;
      publishedCollectionId: string;
    }): Promise<{ count: number }> {
      return database.commerceCheckoutSession.updateMany({
        data: {
          status: "expired"
        },
        where: {
          expiresAt: {
            lte: input.now
          },
          publishedCollectionId: input.publishedCollectionId,
          status: "open"
        }
      });
    },

    updateStatusById(input: {
      canceledAt?: Date | null;
      completedAt?: Date | null;
      id: string;
      status: CommerceCheckoutSessionStatus;
    }): Promise<CommerceCheckoutSession> {
      const data: {
        canceledAt?: Date | null;
        completedAt?: Date | null;
        status: CommerceCheckoutSessionStatus;
      } = {
        status: input.status
      };

      if (input.canceledAt !== undefined) {
        data.canceledAt = input.canceledAt;
      }

      if (input.completedAt !== undefined) {
        data.completedAt = input.completedAt;
      }

      return database.commerceCheckoutSession.update({
        data,
        where: {
          id: input.id
        }
      });
    }
  };
}

export type CommerceCheckoutSessionRepository = ReturnType<
  typeof createCommerceCheckoutSessionRepository
>;
