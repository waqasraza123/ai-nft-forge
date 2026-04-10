import { randomBytes } from "node:crypto";

import {
  collectionCheckoutSessionResponseSchema,
  collectionCheckoutCreateRequestSchema,
  type CollectionStorefrontStatus,
  type CommerceCheckoutProviderKind,
  type CommerceCheckoutProviderMode
} from "@ai-nft-forge/shared";

import { createCollectionCommerceAvailability } from "./availability";
import { CommerceServiceError } from "./error";

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
  priceLabel: string | null;
  slug: string;
  soldCount: number;
  storefrontStatus: CollectionStorefrontStatus;
  title: string;
  totalSupply: number | null;
};

type CheckoutSessionRecord = {
  checkoutUrl: string;
  completedAt: Date | null;
  expiresAt: Date;
  id: string;
  providerKind: CommerceCheckoutProviderKind;
  publicId: string;
  publishedCollection: {
    brandName: string;
    brandSlug: string;
    id: string;
    ownerUserId: string;
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

type CommerceRepositorySet = {
  commerceCheckoutSessionRepository: {
    create(input: {
      checkoutUrl: string;
      expiresAt: Date;
      ownerUserId: string;
      providerKind: CommerceCheckoutProviderKind;
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
      publicId: string;
      status: "open" | "completed" | "expired" | "canceled";
    }>;
    expireOpenByPublishedCollectionId(input: {
      now: Date;
      publishedCollectionId: string;
    }): Promise<{ count: number }>;
    findByPublicId(publicId: string): Promise<CheckoutSessionRecord | null>;
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

type CommercePaymentBoundary = {
  createCheckoutSession(input: {
    brandSlug: string;
    checkoutSessionId: string;
    collectionSlug: string;
  }): {
    checkoutUrl: string;
    providerKind: CommerceCheckoutProviderKind;
  };
  providerMode: CommerceCheckoutProviderMode;
};

type CommerceServiceDependencies = {
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
      priceLabel: input.session.publishedCollection.priceLabel,
      providerKind: input.session.providerKind,
      reservation: {
        buyerDisplayName: input.session.reservation.buyerDisplayName,
        buyerEmail: input.session.reservation.buyerEmail,
        buyerWalletAddress: input.session.reservation.buyerWalletAddress,
        completedAt: input.session.reservation.completedAt?.toISOString() ?? null,
        editionNumber: input.session.reservation.publishedCollectionItem.position,
        expiresAt: input.session.reservation.expiresAt.toISOString(),
        reservationId: input.session.reservation.id,
        status: input.session.reservation.status
      },
      status: input.session.status,
      title: input.session.publishedCollection.title
    }
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

  if (session.status !== "open" || session.expiresAt.getTime() > dependencies.now().getTime()) {
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
    await repositories.publishedCollectionReservationRepository.updateStatusById({
      id: current.reservation.id,
      status: "expired"
    });
  });

  return dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
    publicId
  );
}

export function createCollectionCommerceService(
  dependencies: CommerceServiceDependencies
) {
  return {
    async createCheckoutSession(input: {
      body: unknown;
      brandSlug: string;
      collectionSlug: string;
    }) {
      if (dependencies.payment.providerMode === "disabled") {
        throw new CommerceServiceError(
          "CHECKOUT_DISABLED",
          "Checkout is disabled for this deployment.",
          409
        );
      }

      const parsedInput =
        collectionCheckoutCreateRequestSchema.safeParse(input.body);

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
          providerMode: dependencies.payment.providerMode,
          reservations,
          reservationTtlSeconds: dependencies.reservationTtlSeconds,
          storefrontStatus: refreshedPublication.storefrontStatus
        });
        const nextAvailableItem = availability.availableItems[0] ?? null;

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

        const checkout = dependencies.payment.createCheckoutSession({
          brandSlug: refreshedPublication.brandSlug,
          checkoutSessionId: checkoutSessionPublicId,
          collectionSlug: refreshedPublication.slug
        });

        await repositories.commerceCheckoutSessionRepository.create({
          checkoutUrl: checkout.checkoutUrl,
          expiresAt,
          ownerUserId: refreshedPublication.ownerUserId,
          providerKind: checkout.providerKind,
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

        if (session.providerKind !== "manual") {
          throw new CommerceServiceError(
            "UNSUPPORTED_CHECKOUT_PROVIDER",
            "This checkout session cannot be completed from the storefront.",
            409
          );
        }

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
          await repositories.commerceCheckoutSessionRepository.updateStatusById({
            id: session.id,
            status: "expired"
          });
          await repositories.publishedCollectionReservationRepository.updateStatusById({
            id: session.reservation.id,
            status: "expired"
          });

          throw new CommerceServiceError(
            "CHECKOUT_SESSION_EXPIRED",
            "This reservation expired before checkout completed.",
            409
          );
        }

        const publication = await loadPublicationOrThrow(repositories, {
          brandSlug: input.brandSlug,
          collectionSlug: input.collectionSlug
        });
        const reservations =
          await repositories.publishedCollectionReservationRepository.listByPublishedCollectionIdAndStatuses(
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
          await repositories.commerceCheckoutSessionRepository.updateStatusById({
            canceledAt: now,
            id: session.id,
            status: "canceled"
          });
          await repositories.publishedCollectionReservationRepository.updateStatusById({
            canceledAt: now,
            id: session.reservation.id,
            status: "canceled"
          });

          throw new CommerceServiceError(
            "RESERVATION_NOT_AVAILABLE",
            "That edition is no longer available.",
            409
          );
        }

        await repositories.commerceCheckoutSessionRepository.updateStatusById({
          completedAt: now,
          id: session.id,
          status: "completed"
        });
        await repositories.publishedCollectionReservationRepository.updateStatusById({
          completedAt: now,
          id: session.reservation.id,
          status: "completed"
        });

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

        await repositories.publishedCollectionRepository.updateCommerceById(
          nextCommerceUpdate
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

        return serializeCheckoutSession({ session: refreshed });
      });
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
          session.status === "expired" || session.expiresAt.getTime() <= now.getTime()
            ? "expired"
            : "canceled";

        const nextSessionStatusUpdate: {
          canceledAt?: Date | null;
          id: string;
          status: "expired" | "canceled";
        } = {
          id: session.id,
          status: nextStatus
        };
        const nextReservationStatusUpdate: {
          canceledAt?: Date | null;
          id: string;
          status: "expired" | "canceled";
        } = {
          id: session.reservation.id,
          status: nextStatus
        };

        if (nextStatus === "canceled") {
          nextSessionStatusUpdate.canceledAt = now;
          nextReservationStatusUpdate.canceledAt = now;
        }

        await repositories.commerceCheckoutSessionRepository.updateStatusById(
          nextSessionStatusUpdate
        );
        await repositories.publishedCollectionReservationRepository.updateStatusById(
          nextReservationStatusUpdate
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

        return serializeCheckoutSession({ session: refreshed });
      });
    }
  };
}
