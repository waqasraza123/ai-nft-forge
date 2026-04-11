import { randomBytes } from "node:crypto";

import {
  commerceFulfillmentCallbackRequestSchema,
  collectionCheckoutSessionResponseSchema,
  collectionCheckoutCreateRequestSchema,
  studioCommerceCheckoutActionResponseSchema,
  studioCommerceDashboardQuerySchema,
  studioCommerceDashboardResponseSchema,
  studioCommerceReportResponseSchema,
  studioCommerceReportQuerySchema,
  studioCommerceFulfillmentRetryRequestSchema,
  studioCommerceFulfillmentUpdateRequestSchema,
  type CollectionStorefrontStatus,
  type CommerceFulfillmentAutomationStatus,
  type CommerceFulfillmentProviderKind,
  type CommerceCheckoutFulfillmentStatus,
  type CommerceCheckoutProviderKind
} from "@ai-nft-forge/shared";

import { createCollectionCommerceAvailability } from "./availability";
import { CommerceServiceError } from "./error";
import type { CommercePaymentBoundary } from "./provider";

type PublishedCollectionCommerceRecord = {
  brandName: string;
  brandSlug: string;
  id: string;
  items: Array<{
    id: string;
    position: number;
  }>;
  mints: Array<{
    publishedCollectionItemId: string;
  }>;
  ownerUserId: string;
  priceAmountMinor: number | null;
  priceCurrency: string | null;
  priceLabel: string | null;
  slug: string;
  soldCount: number;
  storefrontStatus: CollectionStorefrontStatus;
  title: string;
  totalSupply: number | null;
};

type CheckoutSessionRecord = {
  canceledAt: Date | null;
  createdAt: Date;
  checkoutUrl: string;
  completedAt: Date | null;
  expiresAt: Date;
  fulfillmentAutomationAttemptCount: number;
  fulfillmentAutomationErrorCode: string | null;
  fulfillmentAutomationErrorMessage: string | null;
  fulfillmentAutomationExternalReference: string | null;
  fulfillmentAutomationLastAttemptedAt: Date | null;
  fulfillmentAutomationLastSucceededAt: Date | null;
  fulfillmentAutomationNextRetryAt: Date | null;
  fulfillmentAutomationQueuedAt: Date | null;
  fulfillmentAutomationStatus: CommerceFulfillmentAutomationStatus;
  fulfilledAt: Date | null;
  fulfillmentNotes: string | null;
  fulfillmentProviderKind: CommerceFulfillmentProviderKind;
  fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
  id: string;
  providerKind: CommerceCheckoutProviderKind;
  providerSessionId: string | null;
  publicId: string;
  publishedCollection: {
    brandName: string;
    brandSlug: string;
    id: string;
    ownerUserId: string;
    priceAmountMinor: number | null;
    priceCurrency: string | null;
    priceLabel: string | null;
    slug: string;
    soldCount: number;
    storefrontStatus: CollectionStorefrontStatus;
    title: string;
    totalSupply: number | null;
  };
  reservation: {
    buyerDisplayName: string | null;
    buyerEmail: string;
    buyerWalletAddress: string | null;
    completedAt: Date | null;
    expiresAt: Date;
    id: string;
    publishedCollectionItem: {
      id: string;
      position: number;
    };
    status: "pending" | "completed" | "expired" | "canceled";
  };
  status: "open" | "completed" | "expired" | "canceled";
};

type BrandRecord = {
  id: string;
  name: string;
  slug: string;
};

type CommerceRepositorySet = {
  brandRepository: {
    listByOwnerUserId(ownerUserId: string): Promise<BrandRecord[]>;
  };
  commerceCheckoutSessionRepository: {
    create(input: {
      checkoutUrl: string;
      expiresAt: Date;
      ownerUserId: string;
      providerKind: CommerceCheckoutProviderKind;
      providerSessionId?: string | null;
      publicId: string;
      publishedCollectionId: string;
      reservationId: string;
      status?: "open" | "completed" | "expired" | "canceled";
    }): Promise<{
      checkoutUrl: string;
      completedAt: Date | null;
      expiresAt: Date;
      id: string;
      providerKind: CommerceCheckoutProviderKind;
      providerSessionId: string | null;
      publicId: string;
      status: "open" | "completed" | "expired" | "canceled";
    }>;
    expireOpenByPublishedCollectionId(input: {
      now: Date;
      publishedCollectionId: string;
    }): Promise<{ count: number }>;
    findByPublicId(publicId: string): Promise<CheckoutSessionRecord | null>;
    listDetailedByOwnerUserId(
      ownerUserId: string
    ): Promise<CheckoutSessionRecord[]>;
    updateFulfillmentById(input: {
      fulfillmentNotes?: string | null;
      fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
      fulfilledAt?: Date | null;
      id: string;
    }): Promise<unknown>;
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
    }): Promise<unknown>;
    updateStatusById(input: {
      canceledAt?: Date | null;
      completedAt?: Date | null;
      id: string;
      status: "open" | "completed" | "expired" | "canceled";
    }): Promise<unknown>;
  };
  publishedCollectionRepository: {
    findDetailedByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<PublishedCollectionCommerceRecord | null>;
    updateCommerceById(input: {
      id: string;
      soldCount: number;
      storefrontStatus?: CollectionStorefrontStatus;
    }): Promise<unknown>;
  };
  publishedCollectionReservationRepository: {
    create(input: {
      buyerDisplayName: string | null;
      buyerEmail: string;
      buyerWalletAddress: string | null;
      expiresAt: Date;
      ownerUserId: string;
      publicId: string;
      publishedCollectionId: string;
      publishedCollectionItemId: string;
      status?: "pending" | "completed" | "expired" | "canceled";
    }): Promise<{
      buyerDisplayName: string | null;
      buyerEmail: string;
      buyerWalletAddress: string | null;
      completedAt: Date | null;
      expiresAt: Date;
      id: string;
      status: "pending" | "completed" | "expired" | "canceled";
    }>;
    expirePendingByPublishedCollectionId(input: {
      now: Date;
      publishedCollectionId: string;
    }): Promise<{ count: number }>;
    listByPublishedCollectionIdAndStatuses(input: {
      publishedCollectionId: string;
      statuses: Array<"pending" | "completed" | "expired" | "canceled">;
    }): Promise<
      Array<{
        id: string;
        publishedCollectionItemId: string;
        status: "pending" | "completed" | "expired" | "canceled";
      }>
    >;
    updateStatusById(input: {
      canceledAt?: Date | null;
      completedAt?: Date | null;
      id: string;
      status: "pending" | "completed" | "expired" | "canceled";
    }): Promise<unknown>;
  };
};

type CommerceServiceDependencies = {
  fulfillmentAutomation: {
    enqueue(input: {
      checkoutSessionId: string;
      source: "automatic" | "manual_retry";
    }): Promise<void>;
    providerMode: "manual" | "webhook";
  };
  now: () => Date;
  payment: CommercePaymentBoundary;
  repositories: CommerceRepositorySet;
  reservationTtlSeconds: number;
  runTransaction<T>(
    operation: (repositories: CommerceRepositorySet) => Promise<T>
  ): Promise<T>;
};

function createPublicId(prefix: "chk" | "rsv") {
  return `${prefix}_${randomBytes(10).toString("hex")}`;
}

function normalizeFulfillmentNotes(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeAutomationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.trim() || "Unknown fulfillment automation failure.";
  }

  return "Unknown fulfillment automation failure.";
}

function buildCollectionLookup(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return {
    brandSlug: input.brandSlug,
    slug: input.collectionSlug
  };
}

function assertLiveCollection(publication: PublishedCollectionCommerceRecord) {
  if (publication.storefrontStatus !== "live") {
    throw new CommerceServiceError(
      "COLLECTION_NOT_LIVE",
      "Checkout is only available for live releases.",
      409
    );
  }
}

function serializeCheckoutSession(input: { session: CheckoutSessionRecord }) {
  return collectionCheckoutSessionResponseSchema.parse({
    checkout: {
      brandName: input.session.publishedCollection.brandName,
      brandSlug: input.session.publishedCollection.brandSlug,
      checkoutSessionId: input.session.publicId,
      checkoutUrl: input.session.checkoutUrl,
      collectionSlug: input.session.publishedCollection.slug,
      completedAt: input.session.completedAt?.toISOString() ?? null,
      expiresAt: input.session.expiresAt.toISOString(),
      providerSessionId: input.session.providerSessionId,
      priceLabel: input.session.publishedCollection.priceLabel,
      providerKind: input.session.providerKind,
      reservation: {
        buyerDisplayName: input.session.reservation.buyerDisplayName,
        buyerEmail: input.session.reservation.buyerEmail,
        buyerWalletAddress: input.session.reservation.buyerWalletAddress,
        completedAt:
          input.session.reservation.completedAt?.toISOString() ?? null,
        editionNumber:
          input.session.reservation.publishedCollectionItem.position,
        expiresAt: input.session.reservation.expiresAt.toISOString(),
        reservationId: input.session.reservation.id,
        status: input.session.reservation.status
      },
      status: input.session.status,
      title: input.session.publishedCollection.title
    }
  });
}

function buildCollectionPublicPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}`;
}

function escapeCsvValue(value: string | number | null) {
  if (value === null) {
    return "";
  }

  const normalizedValue = value.toString();

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

function serializeStudioCheckoutSession(input: {
  session: CheckoutSessionRecord;
}) {
  return studioCommerceCheckoutActionResponseSchema.shape.checkout.parse({
    brandName: input.session.publishedCollection.brandName,
    brandSlug: input.session.publishedCollection.brandSlug,
    buyerDisplayName: input.session.reservation.buyerDisplayName,
    buyerEmail: input.session.reservation.buyerEmail,
    buyerWalletAddress: input.session.reservation.buyerWalletAddress,
    checkoutSessionId: input.session.publicId,
    checkoutUrl: input.session.checkoutUrl,
    collectionPublicPath: buildCollectionPublicPath({
      brandSlug: input.session.publishedCollection.brandSlug,
      collectionSlug: input.session.publishedCollection.slug
    }),
    collectionSlug: input.session.publishedCollection.slug,
    completedAt: input.session.completedAt?.toISOString() ?? null,
    createdAt: input.session.createdAt.toISOString(),
    editionNumber: input.session.reservation.publishedCollectionItem.position,
    expiresAt: input.session.expiresAt.toISOString(),
    fulfillmentAutomationAttemptCount:
      input.session.fulfillmentAutomationAttemptCount,
    fulfillmentAutomationErrorCode:
      input.session.fulfillmentAutomationErrorCode,
    fulfillmentAutomationErrorMessage:
      input.session.fulfillmentAutomationErrorMessage,
    fulfillmentAutomationExternalReference:
      input.session.fulfillmentAutomationExternalReference,
    fulfillmentAutomationLastAttemptedAt:
      input.session.fulfillmentAutomationLastAttemptedAt?.toISOString() ?? null,
    fulfillmentAutomationLastSucceededAt:
      input.session.fulfillmentAutomationLastSucceededAt?.toISOString() ?? null,
    fulfillmentAutomationNextRetryAt:
      input.session.fulfillmentAutomationNextRetryAt?.toISOString() ?? null,
    fulfillmentAutomationQueuedAt:
      input.session.fulfillmentAutomationQueuedAt?.toISOString() ?? null,
    fulfillmentAutomationStatus: input.session.fulfillmentAutomationStatus,
    fulfilledAt: input.session.fulfilledAt?.toISOString() ?? null,
    fulfillmentNotes: input.session.fulfillmentNotes,
    fulfillmentProviderKind: input.session.fulfillmentProviderKind,
    fulfillmentStatus: input.session.fulfillmentStatus,
    priceLabel: input.session.publishedCollection.priceLabel,
    providerKind: input.session.providerKind,
    providerSessionId: input.session.providerSessionId,
    reservationStatus: input.session.reservation.status,
    status: input.session.status,
    storefrontStatus: input.session.publishedCollection.storefrontStatus,
    title: input.session.publishedCollection.title
  });
}

function serializeStudioCheckoutAction(input: {
  session: CheckoutSessionRecord;
}) {
  return studioCommerceCheckoutActionResponseSchema.parse({
    checkout: serializeStudioCheckoutSession(input)
  });
}

function isPendingReservationConflict(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("published_collection_reservations_item_pending_key")
  );
}

async function loadPublicationOrThrow(
  repositories: CommerceRepositorySet,
  input: { brandSlug: string; collectionSlug: string }
) {
  const publication =
    await repositories.publishedCollectionRepository.findDetailedByBrandSlugAndCollectionSlug(
      buildCollectionLookup(input)
    );

  if (!publication) {
    throw new CommerceServiceError(
      "COLLECTION_NOT_FOUND",
      "Published collection was not found.",
      404
    );
  }

  return publication;
}

async function refreshCheckoutSession(
  dependencies: CommerceServiceDependencies,
  publicId: string
) {
  const session =
    await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
      publicId
    );

  if (!session) {
    return null;
  }

  if (
    session.status !== "open" ||
    session.expiresAt.getTime() > dependencies.now().getTime()
  ) {
    return session;
  }

  await dependencies.runTransaction(async (repositories) => {
    const current =
      await repositories.commerceCheckoutSessionRepository.findByPublicId(
        publicId
      );

    if (!current || current.status !== "open") {
      return;
    }

    if (current.expiresAt.getTime() > dependencies.now().getTime()) {
      return;
    }

    await repositories.commerceCheckoutSessionRepository.updateStatusById({
      id: current.id,
      status: "expired"
    });
    await repositories.publishedCollectionReservationRepository.updateStatusById(
      {
        id: current.reservation.id,
        status: "expired"
      }
    );
  });

  return dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
    publicId
  );
}

async function scheduleFulfillmentAutomationIfNeeded(
  dependencies: CommerceServiceDependencies,
  input: {
    checkoutSessionId: string;
    source: "automatic" | "manual_retry";
  }
) {
  if (dependencies.fulfillmentAutomation.providerMode !== "webhook") {
    return dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
      input.checkoutSessionId
    );
  }

  const queuedSession = await dependencies.runTransaction(
    async (repositories) => {
      const session =
        await repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      if (!session) {
        return null;
      }

      if (
        session.status !== "completed" ||
        session.fulfillmentStatus === "fulfilled"
      ) {
        return session;
      }

      if (input.source === "manual_retry") {
        if (!["failed", "idle"].includes(session.fulfillmentAutomationStatus)) {
          throw new CommerceServiceError(
            "FULFILLMENT_NOT_ALLOWED",
            "This checkout is not eligible for fulfillment retry.",
            409
          );
        }
      } else if (
        ["queued", "processing", "submitted", "completed"].includes(
          session.fulfillmentAutomationStatus
        )
      ) {
        return session;
      }

      await repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
        {
          fulfillmentAutomationErrorCode: null,
          fulfillmentAutomationErrorMessage: null,
          fulfillmentAutomationNextRetryAt: null,
          fulfillmentAutomationQueuedAt: dependencies.now(),
          fulfillmentAutomationStatus: "queued",
          fulfillmentProviderKind: "webhook",
          id: session.id
        }
      );

      return repositories.commerceCheckoutSessionRepository.findByPublicId(
        input.checkoutSessionId
      );
    }
  );

  if (!queuedSession) {
    return null;
  }

  if (
    queuedSession.status !== "completed" ||
    queuedSession.fulfillmentStatus === "fulfilled" ||
    queuedSession.fulfillmentAutomationStatus !== "queued"
  ) {
    return queuedSession;
  }

  try {
    await dependencies.fulfillmentAutomation.enqueue({
      checkoutSessionId: input.checkoutSessionId,
      source: input.source
    });
  } catch (error) {
    const failureMessage = normalizeAutomationErrorMessage(error);

    await dependencies.repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
      {
        fulfillmentAutomationErrorCode: "ENQUEUE_FAILED",
        fulfillmentAutomationErrorMessage: failureMessage,
        fulfillmentAutomationNextRetryAt: null,
        fulfillmentAutomationStatus: "failed",
        id: queuedSession.id
      }
    );
  }

  return dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
    input.checkoutSessionId
  );
}

function assertSessionCollectionMatch(
  session: CheckoutSessionRecord,
  input: {
    brandSlug: string;
    collectionSlug: string;
  }
) {
  if (
    session.publishedCollection.brandSlug !== input.brandSlug ||
    session.publishedCollection.slug !== input.collectionSlug
  ) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      404
    );
  }
}

function assertProviderKind(
  session: CheckoutSessionRecord,
  providerKind: CommerceCheckoutProviderKind
) {
  if (session.providerKind !== providerKind) {
    throw new CommerceServiceError(
      "UNSUPPORTED_CHECKOUT_PROVIDER",
      "This checkout session cannot be updated from this provider path.",
      409
    );
  }
}

function assertSessionOwner(
  session: CheckoutSessionRecord,
  ownerUserId: string
) {
  if (session.publishedCollection.ownerUserId !== ownerUserId) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      404
    );
  }
}

async function completeCheckoutSessionRecord(input: {
  checkoutSessionId: string;
  now: Date;
  repositories: CommerceRepositorySet;
}) {
  const session =
    await input.repositories.commerceCheckoutSessionRepository.findByPublicId(
      input.checkoutSessionId
    );

  if (!session) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      404
    );
  }

  if (session.status === "completed") {
    return serializeCheckoutSession({ session });
  }

  if (session.status !== "open") {
    return serializeCheckoutSession({ session });
  }

  const publication = await loadPublicationOrThrow(input.repositories, {
    brandSlug: session.publishedCollection.brandSlug,
    collectionSlug: session.publishedCollection.slug
  });
  const reservations =
    await input.repositories.publishedCollectionReservationRepository.listByPublishedCollectionIdAndStatuses(
      {
        publishedCollectionId: publication.id,
        statuses: ["completed"]
      }
    );
  const completedItemIds = new Set(
    reservations.map((reservation) => reservation.publishedCollectionItemId)
  );
  const mintedItemIds = new Set(
    publication.mints.map((mint) => mint.publishedCollectionItemId)
  );

  if (
    completedItemIds.has(session.reservation.publishedCollectionItem.id) ||
    mintedItemIds.has(session.reservation.publishedCollectionItem.id)
  ) {
    await input.repositories.commerceCheckoutSessionRepository.updateStatusById(
      {
        canceledAt: input.now,
        id: session.id,
        status: "canceled"
      }
    );
    await input.repositories.publishedCollectionReservationRepository.updateStatusById(
      {
        canceledAt: input.now,
        id: session.reservation.id,
        status: "canceled"
      }
    );

    throw new CommerceServiceError(
      "RESERVATION_NOT_AVAILABLE",
      "That edition is no longer available.",
      409
    );
  }

  await input.repositories.commerceCheckoutSessionRepository.updateStatusById({
    completedAt: input.now,
    id: session.id,
    status: "completed"
  });
  await input.repositories.publishedCollectionReservationRepository.updateStatusById(
    {
      completedAt: input.now,
      id: session.reservation.id,
      status: "completed"
    }
  );

  const nextSoldCount = publication.soldCount + 1;
  const nextStorefrontStatus =
    publication.totalSupply !== null &&
    nextSoldCount >= publication.totalSupply &&
    publication.storefrontStatus === "live"
      ? "sold_out"
      : undefined;
  const nextCommerceUpdate: {
    id: string;
    soldCount: number;
    storefrontStatus?: CollectionStorefrontStatus;
  } = {
    id: publication.id,
    soldCount: nextSoldCount
  };

  if (nextStorefrontStatus !== undefined) {
    nextCommerceUpdate.storefrontStatus = nextStorefrontStatus;
  }

  await input.repositories.publishedCollectionRepository.updateCommerceById(
    nextCommerceUpdate
  );

  const refreshed =
    await input.repositories.commerceCheckoutSessionRepository.findByPublicId(
      input.checkoutSessionId
    );

  if (!refreshed) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      500
    );
  }

  return serializeCheckoutSession({ session: refreshed });
}

async function transitionCheckoutSessionRecord(input: {
  canceledAt?: Date | null;
  checkoutSessionId: string;
  nextStatus: "expired" | "canceled";
  repositories: CommerceRepositorySet;
}) {
  const session =
    await input.repositories.commerceCheckoutSessionRepository.findByPublicId(
      input.checkoutSessionId
    );

  if (!session) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      404
    );
  }

  if (session.status === "completed") {
    return serializeCheckoutSession({ session });
  }

  if (session.status === input.nextStatus) {
    return serializeCheckoutSession({ session });
  }

  if (session.status !== "open") {
    return serializeCheckoutSession({ session });
  }

  const nextCheckoutStatusUpdate: {
    canceledAt?: Date | null;
    id: string;
    status: "expired" | "canceled";
  } = {
    id: session.id,
    status: input.nextStatus
  };
  const nextReservationStatusUpdate: {
    canceledAt?: Date | null;
    id: string;
    status: "expired" | "canceled";
  } = {
    id: session.reservation.id,
    status: input.nextStatus
  };

  if (input.canceledAt !== undefined) {
    nextCheckoutStatusUpdate.canceledAt = input.canceledAt;
    nextReservationStatusUpdate.canceledAt = input.canceledAt;
  }

  await input.repositories.commerceCheckoutSessionRepository.updateStatusById(
    nextCheckoutStatusUpdate
  );
  await input.repositories.publishedCollectionReservationRepository.updateStatusById(
    nextReservationStatusUpdate
  );

  const refreshed =
    await input.repositories.commerceCheckoutSessionRepository.findByPublicId(
      input.checkoutSessionId
    );

  if (!refreshed) {
    throw new CommerceServiceError(
      "CHECKOUT_SESSION_NOT_FOUND",
      "Checkout session was not found.",
      500
    );
  }

  return serializeCheckoutSession({ session: refreshed });
}

export function createCollectionCommerceService(
  dependencies: CommerceServiceDependencies
) {
  type SerializedCheckout = ReturnType<typeof serializeStudioCheckoutSession>;

  function buildDashboardSummary(checkouts: SerializedCheckout[]) {
    return {
      automationFailedCheckoutCount: checkouts.filter(
        (checkout) => checkout.fulfillmentAutomationStatus === "failed"
      ).length,
      automationQueuedCheckoutCount: checkouts.filter(
        (checkout) =>
          checkout.fulfillmentAutomationStatus === "queued" ||
          checkout.fulfillmentAutomationStatus === "processing"
      ).length,
      automationSubmittedCheckoutCount: checkouts.filter(
        (checkout) =>
          checkout.fulfillmentAutomationStatus === "submitted" ||
          checkout.fulfillmentAutomationStatus === "completed"
      ).length,
      canceledCheckoutCount: checkouts.filter(
        (checkout) => checkout.status === "canceled"
      ).length,
      completedCheckoutCount: checkouts.filter(
        (checkout) => checkout.status === "completed"
      ).length,
      expiredCheckoutCount: checkouts.filter(
        (checkout) => checkout.status === "expired"
      ).length,
      fulfilledCheckoutCount: checkouts.filter(
        (checkout) =>
          checkout.status === "completed" &&
          checkout.fulfillmentStatus === "fulfilled"
      ).length,
      manualCheckoutCount: checkouts.filter(
        (checkout) => checkout.providerKind === "manual"
      ).length,
      openCheckoutCount: checkouts.filter(
        (checkout) => checkout.status === "open"
      ).length,
      stripeCheckoutCount: checkouts.filter(
        (checkout) => checkout.providerKind === "stripe"
      ).length,
      totalCheckoutCount: checkouts.length,
      unfulfilledCheckoutCount: checkouts.filter(
        (checkout) =>
          checkout.status === "completed" &&
          checkout.fulfillmentStatus === "unfulfilled"
      ).length
    };
  }

  function buildReportMetrics(checkouts: SerializedCheckout[]) {
    const completedCheckouts = checkouts.filter(
      (checkout) => checkout.status === "completed"
    );
    const fulfilledCheckouts = completedCheckouts.filter(
      (checkout) => checkout.fulfillmentStatus === "fulfilled"
    );
    const latestCreatedAt = checkouts.reduce<string | null>(
      (latest, checkout) =>
        latest === null || checkout.createdAt > latest
          ? checkout.createdAt
          : latest,
      null
    );
    const latestCompletedAt = completedCheckouts.reduce<string | null>(
      (latest, checkout) =>
        checkout.completedAt !== null &&
        (latest === null || checkout.completedAt > latest)
          ? checkout.completedAt
          : latest,
      null
    );
    const latestFulfilledAt = fulfilledCheckouts.reduce<string | null>(
      (latest, checkout) =>
        checkout.fulfilledAt !== null &&
        (latest === null || checkout.fulfilledAt > latest)
          ? checkout.fulfilledAt
          : latest,
      null
    );

    return {
      checkoutCompletionRatePercent:
        checkouts.length === 0
          ? 0
          : Number(
              ((completedCheckouts.length / checkouts.length) * 100).toFixed(1)
            ),
      fulfillmentCompletionRatePercent:
        completedCheckouts.length === 0
          ? 0
          : Number(
              (
                (fulfilledCheckouts.length / completedCheckouts.length) *
                100
              ).toFixed(1)
            ),
      latestCheckoutCompletedAt: latestCompletedAt,
      latestCheckoutCreatedAt: latestCreatedAt,
      latestCheckoutFulfilledAt: latestFulfilledAt
    };
  }

  function buildReportScopeLabel(input: {
    activeBrandSlug: string | null;
    brands: Array<{
      brandName: string;
      brandSlug: string;
    }>;
  }) {
    if (!input.activeBrandSlug) {
      return "All brands";
    }

    const activeBrand =
      input.brands.find((brand) => brand.brandSlug === input.activeBrandSlug) ??
      null;

    return activeBrand
      ? `${activeBrand.brandName} (${activeBrand.brandSlug})`
      : input.activeBrandSlug;
  }

  function buildCommerceReportCsv(input: { checkouts: SerializedCheckout[] }) {
    const header = [
      "created_at",
      "completed_at",
      "fulfilled_at",
      "brand_name",
      "brand_slug",
      "collection_title",
      "collection_slug",
      "collection_public_path",
      "checkout_session_id",
      "checkout_url",
      "edition_number",
      "buyer_display_name",
      "buyer_email",
      "buyer_wallet_address",
      "status",
      "reservation_status",
      "provider_kind",
      "provider_session_id",
      "price_label",
      "storefront_status",
      "fulfillment_status",
      "fulfillment_provider_kind",
      "fulfillment_notes",
      "automation_status",
      "automation_attempt_count",
      "automation_error_code",
      "automation_error_message",
      "automation_external_reference",
      "automation_last_attempted_at",
      "automation_last_succeeded_at",
      "automation_next_retry_at",
      "automation_queued_at",
      "expires_at"
    ].join(",");
    const rows = input.checkouts.map((checkout) =>
      [
        checkout.createdAt,
        checkout.completedAt,
        checkout.fulfilledAt,
        checkout.brandName,
        checkout.brandSlug,
        checkout.title,
        checkout.collectionSlug,
        checkout.collectionPublicPath,
        checkout.checkoutSessionId,
        checkout.checkoutUrl,
        checkout.editionNumber,
        checkout.buyerDisplayName,
        checkout.buyerEmail,
        checkout.buyerWalletAddress,
        checkout.status,
        checkout.reservationStatus,
        checkout.providerKind,
        checkout.providerSessionId,
        checkout.priceLabel,
        checkout.storefrontStatus,
        checkout.fulfillmentStatus,
        checkout.fulfillmentProviderKind,
        checkout.fulfillmentNotes,
        checkout.fulfillmentAutomationStatus,
        checkout.fulfillmentAutomationAttemptCount,
        checkout.fulfillmentAutomationErrorCode,
        checkout.fulfillmentAutomationErrorMessage,
        checkout.fulfillmentAutomationExternalReference,
        checkout.fulfillmentAutomationLastAttemptedAt,
        checkout.fulfillmentAutomationLastSucceededAt,
        checkout.fulfillmentAutomationNextRetryAt,
        checkout.fulfillmentAutomationQueuedAt,
        checkout.expiresAt
      ]
        .map((value) => escapeCsvValue(value))
        .join(",")
    );

    return [header, ...rows].join("\n");
  }

  async function loadOwnerCommerceSnapshot(input: {
    brandSlug?: string | null;
    ownerUserId: string;
  }) {
    const parsedQuery = studioCommerceDashboardQuerySchema.parse({
      brandSlug: input.brandSlug ?? undefined
    });
    const brands =
      await dependencies.repositories.brandRepository.listByOwnerUserId(
        input.ownerUserId
      );
    const activeBrandSlug = parsedQuery.brandSlug ?? null;

    if (
      activeBrandSlug &&
      !brands.some((brand) => brand.slug === activeBrandSlug)
    ) {
      throw new CommerceServiceError(
        "BRAND_NOT_FOUND",
        "The requested commerce brand was not found.",
        404
      );
    }

    const sessions =
      await dependencies.repositories.commerceCheckoutSessionRepository.listDetailedByOwnerUserId(
        input.ownerUserId
      );
    const refreshedSessions = await Promise.all(
      sessions.map(async (session) => {
        if (
          session.status === "open" &&
          session.expiresAt.getTime() <= dependencies.now().getTime()
        ) {
          return refreshCheckoutSession(dependencies, session.publicId);
        }

        return session;
      })
    );
    const visibleSessions = refreshedSessions.filter(
      (session): session is CheckoutSessionRecord => session !== null
    );
    const allCheckouts = visibleSessions.map((session) =>
      serializeStudioCheckoutSession({ session })
    );
    const brandMap = new Map<
      string,
      {
        brandName: string;
        brandSlug: string;
        completedCheckoutCount: number;
        fulfilledCheckoutCount: number;
        openCheckoutCount: number;
        totalCheckoutCount: number;
        unfulfilledCheckoutCount: number;
      }
    >(
      brands.map((brand) => [
        brand.slug,
        {
          brandName: brand.name,
          brandSlug: brand.slug,
          completedCheckoutCount: 0,
          fulfilledCheckoutCount: 0,
          openCheckoutCount: 0,
          totalCheckoutCount: 0,
          unfulfilledCheckoutCount: 0
        }
      ])
    );

    for (const checkout of allCheckouts) {
      const current = brandMap.get(checkout.brandSlug) ?? {
        brandName: checkout.brandName,
        brandSlug: checkout.brandSlug,
        completedCheckoutCount: 0,
        fulfilledCheckoutCount: 0,
        openCheckoutCount: 0,
        totalCheckoutCount: 0,
        unfulfilledCheckoutCount: 0
      };

      current.totalCheckoutCount += 1;

      if (checkout.status === "open") {
        current.openCheckoutCount += 1;
      }

      if (checkout.status === "completed") {
        current.completedCheckoutCount += 1;

        if (checkout.fulfillmentStatus === "fulfilled") {
          current.fulfilledCheckoutCount += 1;
        } else {
          current.unfulfilledCheckoutCount += 1;
        }
      }

      brandMap.set(checkout.brandSlug, current);
    }

    const checkouts = activeBrandSlug
      ? allCheckouts.filter(
          (checkout) => checkout.brandSlug === activeBrandSlug
        )
      : allCheckouts;
    const collectionMap = new Map<
      string,
      {
        brandName: string;
        brandSlug: string;
        collectionPublicPath: string;
        collectionSlug: string;
        completedCheckoutCount: number;
        fulfilledCheckoutCount: number;
        openCheckoutCount: number;
        storefrontStatus: CollectionStorefrontStatus;
        title: string;
        totalCheckoutCount: number;
        unfulfilledCheckoutCount: number;
      }
    >();

    for (const checkout of checkouts) {
      const collectionKey = `${checkout.brandSlug}:${checkout.collectionSlug}`;
      const current = collectionMap.get(collectionKey) ?? {
        brandName: checkout.brandName,
        brandSlug: checkout.brandSlug,
        collectionPublicPath: checkout.collectionPublicPath,
        collectionSlug: checkout.collectionSlug,
        completedCheckoutCount: 0,
        fulfilledCheckoutCount: 0,
        openCheckoutCount: 0,
        storefrontStatus: checkout.storefrontStatus,
        title: checkout.title,
        totalCheckoutCount: 0,
        unfulfilledCheckoutCount: 0
      };

      current.totalCheckoutCount += 1;

      if (checkout.status === "open") {
        current.openCheckoutCount += 1;
      }

      if (checkout.status === "completed") {
        current.completedCheckoutCount += 1;

        if (checkout.fulfillmentStatus === "fulfilled") {
          current.fulfilledCheckoutCount += 1;
        } else {
          current.unfulfilledCheckoutCount += 1;
        }
      }

      collectionMap.set(collectionKey, current);
    }

    return {
      activeBrandSlug,
      brands: [...brandMap.values()].sort((left, right) => {
        if (left.totalCheckoutCount !== right.totalCheckoutCount) {
          return right.totalCheckoutCount - left.totalCheckoutCount;
        }

        return left.brandName.localeCompare(right.brandName);
      }),
      checkouts,
      collections: [...collectionMap.values()].sort((left, right) => {
        if (left.openCheckoutCount !== right.openCheckoutCount) {
          return right.openCheckoutCount - left.openCheckoutCount;
        }

        if (left.unfulfilledCheckoutCount !== right.unfulfilledCheckoutCount) {
          return right.unfulfilledCheckoutCount - left.unfulfilledCheckoutCount;
        }

        return left.title.localeCompare(right.title);
      }),
      summary: buildDashboardSummary(checkouts)
    };
  }

  return {
    async createCheckoutSession(input: {
      body: unknown;
      brandSlug: string;
      collectionSlug: string;
      origin: string;
    }) {
      if (dependencies.payment.providerMode === "disabled") {
        throw new CommerceServiceError(
          "CHECKOUT_DISABLED",
          "Checkout is disabled for this deployment.",
          409
        );
      }

      const parsedInput = collectionCheckoutCreateRequestSchema.safeParse(
        input.body
      );

      if (!parsedInput.success) {
        throw new CommerceServiceError(
          "INVALID_REQUEST",
          "Checkout request payload is invalid.",
          400
        );
      }

      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const publication = await loadPublicationOrThrow(repositories, input);

        await repositories.commerceCheckoutSessionRepository.expireOpenByPublishedCollectionId(
          {
            now,
            publishedCollectionId: publication.id
          }
        );
        await repositories.publishedCollectionReservationRepository.expirePendingByPublishedCollectionId(
          {
            now,
            publishedCollectionId: publication.id
          }
        );

        const refreshedPublication = await loadPublicationOrThrow(
          repositories,
          input
        );

        assertLiveCollection(refreshedPublication);

        const reservations =
          await repositories.publishedCollectionReservationRepository.listByPublishedCollectionIdAndStatuses(
            {
              publishedCollectionId: refreshedPublication.id,
              statuses: ["pending", "completed"]
            }
          );
        const availability = createCollectionCommerceAvailability({
          items: refreshedPublication.items,
          mints: refreshedPublication.mints,
          pricingReady:
            dependencies.payment.providerMode !== "stripe" ||
            (refreshedPublication.priceAmountMinor !== null &&
              refreshedPublication.priceCurrency !== null),
          providerMode: dependencies.payment.providerMode,
          reservations,
          reservationTtlSeconds: dependencies.reservationTtlSeconds,
          storefrontStatus: refreshedPublication.storefrontStatus
        });
        const nextAvailableItem = availability.availableItems[0] ?? null;

        if (
          availability.availability.checkoutAvailabilityReason ===
          "pricing_incomplete"
        ) {
          throw new CommerceServiceError(
            "CHECKOUT_CONFIGURATION_REQUIRED",
            "Checkout pricing is not configured for this release.",
            409
          );
        }

        if (!availability.availability.checkoutEnabled || !nextAvailableItem) {
          throw new CommerceServiceError(
            "RESERVATION_NOT_AVAILABLE",
            "No edition is currently available for checkout.",
            409
          );
        }

        const reservationPublicId = createPublicId("rsv");
        const checkoutSessionPublicId = createPublicId("chk");
        const expiresAt = new Date(
          now.getTime() + dependencies.reservationTtlSeconds * 1000
        );

        let reservation;

        try {
          reservation =
            await repositories.publishedCollectionReservationRepository.create({
              buyerDisplayName: parsedInput.data.buyerDisplayName ?? null,
              buyerEmail: parsedInput.data.buyerEmail,
              buyerWalletAddress: parsedInput.data.buyerWalletAddress ?? null,
              expiresAt,
              ownerUserId: refreshedPublication.ownerUserId,
              publicId: reservationPublicId,
              publishedCollectionId: refreshedPublication.id,
              publishedCollectionItemId: nextAvailableItem.id
            });
        } catch (error) {
          if (isPendingReservationConflict(error)) {
            throw new CommerceServiceError(
              "RESERVATION_NOT_AVAILABLE",
              "That edition was just reserved. Try again.",
              409
            );
          }

          throw error;
        }

        if (
          dependencies.payment.providerMode === "stripe" &&
          (refreshedPublication.priceAmountMinor === null ||
            refreshedPublication.priceCurrency === null)
        ) {
          throw new CommerceServiceError(
            "CHECKOUT_CONFIGURATION_REQUIRED",
            "Checkout pricing is not configured for this release.",
            409
          );
        }

        const checkout = await dependencies.payment.createCheckoutSession({
          brandSlug: refreshedPublication.brandSlug,
          buyerEmail: parsedInput.data.buyerEmail,
          checkoutSessionId: checkoutSessionPublicId,
          collectionSlug: refreshedPublication.slug,
          editionNumber: nextAvailableItem.position,
          expiresAt,
          origin: input.origin,
          priceAmountMinor: refreshedPublication.priceAmountMinor ?? 0,
          priceCurrency: refreshedPublication.priceCurrency ?? "usd",
          priceLabel: refreshedPublication.priceLabel,
          title: refreshedPublication.title
        });

        await repositories.commerceCheckoutSessionRepository.create({
          checkoutUrl: checkout.checkoutUrl,
          expiresAt,
          ownerUserId: refreshedPublication.ownerUserId,
          providerKind: checkout.providerKind,
          providerSessionId: checkout.providerSessionId,
          publicId: checkoutSessionPublicId,
          publishedCollectionId: refreshedPublication.id,
          reservationId: reservation.id
        });

        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            checkoutSessionPublicId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session could not be loaded.",
            500
          );
        }

        return serializeCheckoutSession({ session });
      });
    },

    async getCheckoutSession(input: {
      brandSlug: string;
      checkoutSessionId: string;
      collectionSlug: string;
    }) {
      const session = await refreshCheckoutSession(
        dependencies,
        input.checkoutSessionId
      );

      if (!session) {
        return null;
      }

      if (
        session.publishedCollection.brandSlug !== input.brandSlug ||
        session.publishedCollection.slug !== input.collectionSlug
      ) {
        return null;
      }

      return serializeCheckoutSession({ session });
    },

    async completeManualCheckout(input: {
      brandSlug: string;
      checkoutSessionId: string;
      collectionSlug: string;
    }) {
      const now = dependencies.now();

      const result = await dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        assertSessionCollectionMatch(session, input);
        assertProviderKind(session, "manual");

        if (session.status === "completed") {
          return serializeCheckoutSession({ session });
        }

        if (session.status !== "open") {
          throw new CommerceServiceError(
            session.status === "expired"
              ? "CHECKOUT_SESSION_EXPIRED"
              : "CHECKOUT_SESSION_NOT_OPEN",
            session.status === "expired"
              ? "This reservation expired before checkout completed."
              : "This checkout session is no longer open.",
            409
          );
        }

        if (session.expiresAt.getTime() <= now.getTime()) {
          await transitionCheckoutSessionRecord({
            checkoutSessionId: input.checkoutSessionId,
            nextStatus: "expired",
            repositories
          });

          throw new CommerceServiceError(
            "CHECKOUT_SESSION_EXPIRED",
            "This reservation expired before checkout completed.",
            409
          );
        }

        return completeCheckoutSessionRecord({
          checkoutSessionId: input.checkoutSessionId,
          now,
          repositories
        });
      });

      await scheduleFulfillmentAutomationIfNeeded(dependencies, {
        checkoutSessionId: input.checkoutSessionId,
        source: "automatic"
      });

      const refreshed =
        await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      return refreshed
        ? serializeCheckoutSession({ session: refreshed })
        : result;
    },

    async cancelCheckoutSession(input: {
      brandSlug: string;
      checkoutSessionId: string;
      collectionSlug: string;
    }) {
      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        assertSessionCollectionMatch(session, input);
        assertProviderKind(session, "manual");

        if (session.status === "completed") {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_OPEN",
            "Completed checkout sessions cannot be canceled.",
            409
          );
        }

        if (session.status === "canceled") {
          return serializeCheckoutSession({ session });
        }

        const nextStatus =
          session.status === "expired" ||
          session.expiresAt.getTime() <= now.getTime()
            ? "expired"
            : "canceled";

        if (nextStatus === "canceled") {
          return transitionCheckoutSessionRecord({
            canceledAt: now,
            checkoutSessionId: input.checkoutSessionId,
            nextStatus,
            repositories
          });
        }

        return transitionCheckoutSessionRecord({
          checkoutSessionId: input.checkoutSessionId,
          nextStatus,
          repositories
        });
      });
    },

    async completeProviderCheckoutSession(input: {
      checkoutSessionId: string;
      providerKind: CommerceCheckoutProviderKind;
    }) {
      const now = dependencies.now();

      const result = await dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          return null;
        }

        assertProviderKind(session, input.providerKind);

        return completeCheckoutSessionRecord({
          checkoutSessionId: input.checkoutSessionId,
          now,
          repositories
        });
      });

      if (result === null) {
        return null;
      }

      await scheduleFulfillmentAutomationIfNeeded(dependencies, {
        checkoutSessionId: input.checkoutSessionId,
        source: "automatic"
      });

      const refreshed =
        await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      return refreshed
        ? serializeCheckoutSession({ session: refreshed })
        : result;
    },

    async expireProviderCheckoutSession(input: {
      checkoutSessionId: string;
      providerKind: CommerceCheckoutProviderKind;
    }) {
      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          return null;
        }

        assertProviderKind(session, input.providerKind);

        return transitionCheckoutSessionRecord({
          checkoutSessionId: input.checkoutSessionId,
          nextStatus: "expired",
          repositories
        });
      });
    },

    async cancelProviderCheckoutSession(input: {
      checkoutSessionId: string;
      providerKind: CommerceCheckoutProviderKind;
    }) {
      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          return null;
        }

        assertProviderKind(session, input.providerKind);

        return transitionCheckoutSessionRecord({
          canceledAt: now,
          checkoutSessionId: input.checkoutSessionId,
          nextStatus: "canceled",
          repositories
        });
      });
    },

    async getOwnerCommerceDashboard(input: {
      brandSlug?: string | null;
      ownerUserId: string;
    }) {
      const snapshot = await loadOwnerCommerceSnapshot(input);

      return studioCommerceDashboardResponseSchema.parse({
        dashboard: {
          activeBrandSlug: snapshot.activeBrandSlug,
          brands: snapshot.brands,
          checkouts: snapshot.checkouts,
          collections: snapshot.collections,
          summary: snapshot.summary
        }
      });
    },

    async getOwnerCommerceReport(input: {
      brandSlug?: string | null;
      ownerUserId: string;
    }) {
      const parsedQuery = studioCommerceReportQuerySchema.parse({
        brandSlug: input.brandSlug ?? undefined
      });
      const snapshot = await loadOwnerCommerceSnapshot({
        ...(parsedQuery.brandSlug
          ? {
              brandSlug: parsedQuery.brandSlug
            }
          : {}),
        ownerUserId: input.ownerUserId
      });

      return studioCommerceReportResponseSchema.parse({
        report: {
          activeBrandSlug: snapshot.activeBrandSlug,
          brands: snapshot.brands,
          collections: snapshot.collections,
          generatedAt: dependencies.now().toISOString(),
          metrics: buildReportMetrics(snapshot.checkouts),
          scopeLabel: buildReportScopeLabel({
            activeBrandSlug: snapshot.activeBrandSlug,
            brands: snapshot.brands
          }),
          summary: snapshot.summary
        }
      });
    },

    async exportOwnerCommerceReportCsv(input: {
      brandSlug?: string | null;
      ownerUserId: string;
    }) {
      const parsedQuery = studioCommerceReportQuerySchema.parse({
        brandSlug: input.brandSlug ?? undefined
      });
      const snapshot = await loadOwnerCommerceSnapshot({
        ...(parsedQuery.brandSlug
          ? {
              brandSlug: parsedQuery.brandSlug
            }
          : {}),
        ownerUserId: input.ownerUserId
      });

      return {
        csv: buildCommerceReportCsv({
          checkouts: snapshot.checkouts
        }),
        filename: `commerce-report-${snapshot.activeBrandSlug ?? "all-brands"}.csv`
      };
    },

    async completeOwnerManualCheckout(input: {
      checkoutSessionId: string;
      ownerUserId: string;
    }) {
      const now = dependencies.now();

      await dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        assertSessionOwner(session, input.ownerUserId);
        assertProviderKind(session, "manual");

        if (session.status === "completed") {
          return;
        }

        if (session.status !== "open") {
          throw new CommerceServiceError(
            session.status === "expired"
              ? "CHECKOUT_SESSION_EXPIRED"
              : "CHECKOUT_SESSION_NOT_OPEN",
            session.status === "expired"
              ? "This reservation expired before checkout completed."
              : "This checkout session is no longer open.",
            409
          );
        }

        if (session.expiresAt.getTime() <= now.getTime()) {
          await transitionCheckoutSessionRecord({
            checkoutSessionId: input.checkoutSessionId,
            nextStatus: "expired",
            repositories
          });

          throw new CommerceServiceError(
            "CHECKOUT_SESSION_EXPIRED",
            "This reservation expired before checkout completed.",
            409
          );
        }

        await completeCheckoutSessionRecord({
          checkoutSessionId: input.checkoutSessionId,
          now,
          repositories
        });
      });

      await scheduleFulfillmentAutomationIfNeeded(dependencies, {
        checkoutSessionId: input.checkoutSessionId,
        source: "automatic"
      });

      const refreshed =
        await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      if (!refreshed) {
        throw new CommerceServiceError(
          "CHECKOUT_SESSION_NOT_FOUND",
          "Checkout session was not found.",
          500
        );
      }

      return serializeStudioCheckoutAction({ session: refreshed });
    },

    async cancelOwnerCheckoutSession(input: {
      checkoutSessionId: string;
      ownerUserId: string;
    }) {
      const session =
        await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      if (!session) {
        throw new CommerceServiceError(
          "CHECKOUT_SESSION_NOT_FOUND",
          "Checkout session was not found.",
          404
        );
      }

      assertSessionOwner(session, input.ownerUserId);

      if (session.status === "completed") {
        throw new CommerceServiceError(
          "CHECKOUT_SESSION_NOT_OPEN",
          "Completed checkout sessions cannot be canceled.",
          409
        );
      }

      if (
        session.providerKind === "stripe" &&
        session.status === "open" &&
        session.expiresAt.getTime() > dependencies.now().getTime()
      ) {
        if (dependencies.payment.providerMode !== "stripe") {
          throw new CommerceServiceError(
            "CHECKOUT_CONFIGURATION_REQUIRED",
            "Stripe checkout mode is required to cancel an open Stripe session.",
            409
          );
        }

        if (!session.providerSessionId) {
          throw new CommerceServiceError(
            "CHECKOUT_CONFIGURATION_REQUIRED",
            "Stripe checkout session metadata is incomplete.",
            409
          );
        }

        await dependencies.payment.expireCheckoutSession({
          providerKind: session.providerKind,
          providerSessionId: session.providerSessionId
        });
      }

      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const current =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!current) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        assertSessionOwner(current, input.ownerUserId);

        if (current.status === "canceled") {
          return serializeStudioCheckoutAction({ session: current });
        }

        const nextStatus =
          current.status === "expired" ||
          current.expiresAt.getTime() <= now.getTime()
            ? "expired"
            : "canceled";

        await transitionCheckoutSessionRecord(
          nextStatus === "canceled"
            ? {
                canceledAt: now,
                checkoutSessionId: input.checkoutSessionId,
                nextStatus,
                repositories
              }
            : {
                checkoutSessionId: input.checkoutSessionId,
                nextStatus,
                repositories
              }
        );

        const refreshed =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!refreshed) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            500
          );
        }

        return serializeStudioCheckoutAction({ session: refreshed });
      });
    },

    async updateOwnerCheckoutFulfillment(input: {
      body: unknown;
      checkoutSessionId: string;
      ownerUserId: string;
    }) {
      const parsedInput =
        studioCommerceFulfillmentUpdateRequestSchema.safeParse(input.body);

      if (!parsedInput.success) {
        throw new CommerceServiceError(
          "INVALID_REQUEST",
          "Fulfillment update payload is invalid.",
          400
        );
      }

      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        assertSessionOwner(session, input.ownerUserId);

        if (session.status !== "completed") {
          throw new CommerceServiceError(
            "FULFILLMENT_NOT_ALLOWED",
            "Only completed checkout sessions can be marked fulfilled.",
            409
          );
        }

        await repositories.commerceCheckoutSessionRepository.updateFulfillmentById(
          {
            fulfillmentNotes: normalizeFulfillmentNotes(
              parsedInput.data.fulfillmentNotes
            ),
            fulfillmentStatus: parsedInput.data.fulfillmentStatus,
            fulfilledAt:
              parsedInput.data.fulfillmentStatus === "fulfilled" ? now : null,
            id: session.id
          }
        );

        if (
          session.fulfillmentProviderKind === "webhook" &&
          parsedInput.data.fulfillmentStatus === "fulfilled"
        ) {
          await repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
            {
              fulfillmentAutomationErrorCode: null,
              fulfillmentAutomationErrorMessage: null,
              fulfillmentAutomationNextRetryAt: null,
              fulfillmentAutomationStatus: "completed",
              id: session.id
            }
          );
        }

        const refreshed =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            input.checkoutSessionId
          );

        if (!refreshed) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            500
          );
        }

        return serializeStudioCheckoutAction({ session: refreshed });
      });
    },

    async retryOwnerCheckoutFulfillment(input: {
      body: unknown;
      checkoutSessionId: string;
      ownerUserId: string;
    }) {
      const parsedInput = studioCommerceFulfillmentRetryRequestSchema.safeParse(
        input.body
      );

      if (!parsedInput.success) {
        throw new CommerceServiceError(
          "INVALID_REQUEST",
          "Fulfillment retry payload is invalid.",
          400
        );
      }

      if (dependencies.fulfillmentAutomation.providerMode !== "webhook") {
        throw new CommerceServiceError(
          "FULFILLMENT_NOT_ALLOWED",
          "Webhook fulfillment automation is not enabled.",
          409
        );
      }

      const session =
        await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
          input.checkoutSessionId
        );

      if (!session) {
        throw new CommerceServiceError(
          "CHECKOUT_SESSION_NOT_FOUND",
          "Checkout session was not found.",
          404
        );
      }

      assertSessionOwner(session, input.ownerUserId);

      const refreshed = await scheduleFulfillmentAutomationIfNeeded(
        dependencies,
        {
          checkoutSessionId: input.checkoutSessionId,
          source: "manual_retry"
        }
      );

      if (!refreshed) {
        throw new CommerceServiceError(
          "CHECKOUT_SESSION_NOT_FOUND",
          "Checkout session was not found.",
          404
        );
      }

      return serializeStudioCheckoutAction({ session: refreshed });
    },

    async recordFulfillmentAutomationCallback(input: { body: unknown }) {
      const parsedInput = commerceFulfillmentCallbackRequestSchema.safeParse(
        input.body
      );

      if (!parsedInput.success) {
        throw new CommerceServiceError(
          "INVALID_REQUEST",
          "Fulfillment callback payload is invalid.",
          400
        );
      }

      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const session =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            parsedInput.data.checkoutSessionId
          );

        if (!session) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            404
          );
        }

        if (session.fulfillmentProviderKind !== "webhook") {
          throw new CommerceServiceError(
            "FULFILLMENT_NOT_ALLOWED",
            "This checkout is not configured for webhook fulfillment callbacks.",
            409
          );
        }

        if (session.status !== "completed") {
          throw new CommerceServiceError(
            "FULFILLMENT_NOT_ALLOWED",
            "Only completed checkout sessions can accept fulfillment callbacks.",
            409
          );
        }

        if (parsedInput.data.status === "fulfilled") {
          await repositories.commerceCheckoutSessionRepository.updateFulfillmentById(
            {
              fulfillmentNotes:
                normalizeFulfillmentNotes(parsedInput.data.fulfillmentNotes) ??
                session.fulfillmentNotes,
              fulfillmentStatus: "fulfilled",
              fulfilledAt: now,
              id: session.id
            }
          );
          await repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
            {
              fulfillmentAutomationErrorCode: null,
              fulfillmentAutomationErrorMessage: null,
              fulfillmentAutomationExternalReference:
                parsedInput.data.externalReference ??
                session.fulfillmentAutomationExternalReference,
              fulfillmentAutomationLastSucceededAt: now,
              fulfillmentAutomationNextRetryAt: null,
              fulfillmentAutomationStatus: "completed",
              id: session.id
            }
          );
        } else {
          if (session.fulfillmentStatus === "fulfilled") {
            const current =
              await repositories.commerceCheckoutSessionRepository.findByPublicId(
                parsedInput.data.checkoutSessionId
              );

            if (!current) {
              throw new CommerceServiceError(
                "CHECKOUT_SESSION_NOT_FOUND",
                "Checkout session was not found.",
                500
              );
            }

            return serializeStudioCheckoutAction({ session: current });
          }

          await repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
            {
              fulfillmentAutomationErrorCode:
                parsedInput.data.failureCode ?? "CALLBACK_FAILED",
              fulfillmentAutomationErrorMessage:
                parsedInput.data.failureMessage ??
                "The external fulfillment system reported a failure.",
              fulfillmentAutomationExternalReference:
                parsedInput.data.externalReference ??
                session.fulfillmentAutomationExternalReference,
              fulfillmentAutomationNextRetryAt: null,
              fulfillmentAutomationStatus: "failed",
              id: session.id
            }
          );
          await repositories.commerceCheckoutSessionRepository.updateFulfillmentById(
            {
              fulfillmentNotes:
                normalizeFulfillmentNotes(parsedInput.data.fulfillmentNotes) ??
                session.fulfillmentNotes,
              fulfillmentStatus: "unfulfilled",
              fulfilledAt: null,
              id: session.id
            }
          );
        }

        const refreshed =
          await repositories.commerceCheckoutSessionRepository.findByPublicId(
            parsedInput.data.checkoutSessionId
          );

        if (!refreshed) {
          throw new CommerceServiceError(
            "CHECKOUT_SESSION_NOT_FOUND",
            "Checkout session was not found.",
            500
          );
        }

        return serializeStudioCheckoutAction({ session: refreshed });
      });
    }
  };
}
