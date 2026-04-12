import type {
  CommerceFulfillmentAutomationStatus,
  CommerceFulfillmentProviderKind,
  CommerceCheckoutFulfillmentStatus,
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
      providerSessionId?: string | null;
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

    listDetailedByOwnerUserId(ownerUserId: string) {
      return database.commerceCheckoutSession.findMany({
        include: commerceCheckoutSessionDetailInclude,
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

    listDetailedByWorkspaceId(workspaceId: string) {
      return database.commerceCheckoutSession.findMany({
        include: commerceCheckoutSessionDetailInclude,
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          publishedCollection: {
            workspaceId
          }
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
    },

    updateFulfillmentById(input: {
      fulfillmentNotes?: string | null;
      fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
      fulfilledAt?: Date | null;
      id: string;
    }): Promise<CommerceCheckoutSession> {
      const data: {
        fulfillmentNotes?: string | null;
        fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
        fulfilledAt?: Date | null;
      } = {
        fulfillmentStatus: input.fulfillmentStatus
      };

      if (input.fulfillmentNotes !== undefined) {
        data.fulfillmentNotes = input.fulfillmentNotes;
      }

      if (input.fulfilledAt !== undefined) {
        data.fulfilledAt = input.fulfilledAt;
      }

      return database.commerceCheckoutSession.update({
        data,
        where: {
          id: input.id
        }
      });
    },

    updateFulfillmentAutomationById(input: {
      fulfillmentAutomationAttemptCount?: number;
      fulfillmentAutomationErrorCode?: string | null;
      fulfillmentAutomationErrorMessage?: string | null;
      fulfillmentAutomationExternalReference?: string | null;
      fulfillmentAutomationLastAttemptedAt?: Date | null;
      fulfillmentAutomationLastSucceededAt?: Date | null;
      fulfillmentAutomationNextRetryAt?: Date | null;
      fulfillmentAutomationQueuedAt?: Date | null;
      fulfillmentAutomationStatus?: CommerceFulfillmentAutomationStatus;
      fulfillmentProviderKind?: CommerceFulfillmentProviderKind;
      id: string;
    }): Promise<CommerceCheckoutSession> {
      const data: {
        fulfillmentAutomationAttemptCount?: number;
        fulfillmentAutomationErrorCode?: string | null;
        fulfillmentAutomationErrorMessage?: string | null;
        fulfillmentAutomationExternalReference?: string | null;
        fulfillmentAutomationLastAttemptedAt?: Date | null;
        fulfillmentAutomationLastSucceededAt?: Date | null;
        fulfillmentAutomationNextRetryAt?: Date | null;
        fulfillmentAutomationQueuedAt?: Date | null;
        fulfillmentAutomationStatus?: CommerceFulfillmentAutomationStatus;
        fulfillmentProviderKind?: CommerceFulfillmentProviderKind;
      } = {};

      if (input.fulfillmentAutomationAttemptCount !== undefined) {
        data.fulfillmentAutomationAttemptCount =
          input.fulfillmentAutomationAttemptCount;
      }

      if (input.fulfillmentAutomationErrorCode !== undefined) {
        data.fulfillmentAutomationErrorCode =
          input.fulfillmentAutomationErrorCode;
      }

      if (input.fulfillmentAutomationErrorMessage !== undefined) {
        data.fulfillmentAutomationErrorMessage =
          input.fulfillmentAutomationErrorMessage;
      }

      if (input.fulfillmentAutomationExternalReference !== undefined) {
        data.fulfillmentAutomationExternalReference =
          input.fulfillmentAutomationExternalReference;
      }

      if (input.fulfillmentAutomationLastAttemptedAt !== undefined) {
        data.fulfillmentAutomationLastAttemptedAt =
          input.fulfillmentAutomationLastAttemptedAt;
      }

      if (input.fulfillmentAutomationLastSucceededAt !== undefined) {
        data.fulfillmentAutomationLastSucceededAt =
          input.fulfillmentAutomationLastSucceededAt;
      }

      if (input.fulfillmentAutomationNextRetryAt !== undefined) {
        data.fulfillmentAutomationNextRetryAt =
          input.fulfillmentAutomationNextRetryAt;
      }

      if (input.fulfillmentAutomationQueuedAt !== undefined) {
        data.fulfillmentAutomationQueuedAt = input.fulfillmentAutomationQueuedAt;
      }

      if (input.fulfillmentAutomationStatus !== undefined) {
        data.fulfillmentAutomationStatus = input.fulfillmentAutomationStatus;
      }

      if (input.fulfillmentProviderKind !== undefined) {
        data.fulfillmentProviderKind = input.fulfillmentProviderKind;
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
