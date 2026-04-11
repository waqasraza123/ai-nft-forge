import { describe, expect, it } from "vitest";

import { createCollectionCommerceService } from "./service";

type HarnessPublication = {
  brandName: string;
  brandSlug: string;
  id: string;
  items: Array<{
    id: string;
    position: number;
  }>;
  mints: Array<never>;
  ownerUserId: string;
  priceAmountMinor: number | null;
  priceCurrency: string | null;
  priceLabel: string;
  slug: string;
  soldCount: number;
  storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
  title: string;
  totalSupply: number;
};

function createPublicationRecord() {
  return {
    brandName: "Demo Studio",
    brandSlug: "demo-studio",
    id: "publication_1",
    items: [
      {
        id: "published_item_1",
        position: 1
      },
      {
        id: "published_item_2",
        position: 2
      }
    ],
    mints: [],
    ownerUserId: "user_1",
    priceAmountMinor: 1800,
    priceCurrency: "usd",
    priceLabel: "0.18 ETH",
    slug: "genesis-portrait-set",
    soldCount: 0,
    storefrontStatus: "live" as const,
    title: "Genesis Portrait Set",
    totalSupply: 2
  };
}

function createCommerceHarness(input?: {
  fulfillmentProviderMode?: "manual" | "webhook";
  providerMode?: "disabled" | "manual" | "stripe";
  publicationOverrides?: Partial<HarnessPublication>;
  reservationStatuses?: Array<"pending" | "completed" | "expired" | "canceled">;
}) {
  const publication = {
    ...createPublicationRecord(),
    ...input?.publicationOverrides
  };
  const reservations = (input?.reservationStatuses ?? []).map(
    (status, index) => ({
      id: `reservation_${index + 1}`,
      publishedCollectionItemId:
        index === 0 ? "published_item_1" : "published_item_2",
      status
    })
  );
  const checkoutSessions = new Map<
    string,
    {
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
      fulfillmentAutomationStatus:
        | "idle"
        | "queued"
        | "processing"
        | "submitted"
        | "completed"
        | "failed";
      fulfilledAt: Date | null;
      fulfillmentNotes: string | null;
      fulfillmentProviderKind: "manual" | "webhook";
      fulfillmentStatus: "unfulfilled" | "fulfilled";
      id: string;
      providerKind: "manual" | "stripe";
      providerSessionId: string | null;
      publicId: string;
      publishedCollection: HarnessPublication;
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
    }
  >();
  const enqueuedFulfillmentJobs: Array<{
    checkoutSessionId: string;
    source: "automatic" | "manual_retry";
  }> = [];
  const expiredProviderSessionIds: string[] = [];
  let soldCount = publication.soldCount;
  let storefrontStatus: "upcoming" | "live" | "sold_out" | "ended" =
    publication.storefrontStatus;
  const repositories = {
    commerceCheckoutSessionRepository: {
      async create(createInput: {
        checkoutUrl: string;
        expiresAt: Date;
        ownerUserId: string;
        providerKind: "manual" | "stripe";
        providerSessionId?: string | null;
        publicId: string;
        publishedCollectionId: string;
        reservationId: string;
        status?: "open" | "completed" | "expired" | "canceled";
      }) {
        const reservation = reservations.find(
          (candidate) => candidate.id === createInput.reservationId
        );

        if (!reservation) {
          throw new Error("Reservation was not found.");
        }

        const item =
          publication.items.find(
            (candidate) => candidate.id === reservation.publishedCollectionItemId
          ) ?? publication.items[0]!;

        const record = {
          canceledAt: null,
          createdAt: new Date("2026-04-10T09:55:00.000Z"),
          checkoutUrl: createInput.checkoutUrl,
          completedAt: null,
          expiresAt: createInput.expiresAt,
          fulfillmentAutomationAttemptCount: 0,
          fulfillmentAutomationErrorCode: null,
          fulfillmentAutomationErrorMessage: null,
          fulfillmentAutomationExternalReference: null,
          fulfillmentAutomationLastAttemptedAt: null,
          fulfillmentAutomationLastSucceededAt: null,
          fulfillmentAutomationNextRetryAt: null,
          fulfillmentAutomationQueuedAt: null,
          fulfillmentAutomationStatus: "idle" as const,
          fulfilledAt: null,
          fulfillmentNotes: null,
          fulfillmentProviderKind: "manual" as const,
          fulfillmentStatus: "unfulfilled" as const,
          id: `checkout_record_${checkoutSessions.size + 1}`,
          providerKind: createInput.providerKind,
          providerSessionId: createInput.providerSessionId ?? null,
          publicId: createInput.publicId,
          publishedCollection: {
            ...publication,
            soldCount,
            storefrontStatus
          },
          reservation: {
            buyerDisplayName: "Demo Collector",
            buyerEmail: "collector@example.com",
            buyerWalletAddress: null,
            completedAt: null,
            expiresAt: createInput.expiresAt,
            id: reservation.id,
            publishedCollectionItem: item,
            status: reservation.status
          },
          status: "open" as const
        };

        checkoutSessions.set(createInput.publicId, record);

        return record;
      },
      async expireOpenByPublishedCollectionId() {
        return { count: 0 };
      },
      async findByPublicId(publicId: string) {
        return checkoutSessions.get(publicId) ?? null;
      },
      async listDetailedByOwnerUserId() {
        return [...checkoutSessions.values()];
      },
      async updateFulfillmentById(updateInput: {
        fulfillmentNotes?: string | null;
        fulfillmentStatus: "unfulfilled" | "fulfilled";
        fulfilledAt?: Date | null;
        id: string;
      }) {
        const record = [...checkoutSessions.values()].find(
          (candidate) => candidate.id === updateInput.id
        );

        if (!record) {
          throw new Error("Checkout session was not found.");
        }

        record.fulfillmentStatus = updateInput.fulfillmentStatus;
        record.fulfillmentNotes =
          updateInput.fulfillmentNotes === undefined
            ? record.fulfillmentNotes
            : updateInput.fulfillmentNotes;
        record.fulfilledAt =
          updateInput.fulfilledAt === undefined
            ? record.fulfilledAt
            : updateInput.fulfilledAt;

        return record;
      },
      async updateFulfillmentAutomationById(updateInput: {
        fulfillmentAutomationAttemptCount?: number;
        fulfillmentAutomationErrorCode?: string | null;
        fulfillmentAutomationErrorMessage?: string | null;
        fulfillmentAutomationExternalReference?: string | null;
        fulfillmentAutomationLastAttemptedAt?: Date | null;
        fulfillmentAutomationLastSucceededAt?: Date | null;
        fulfillmentAutomationNextRetryAt?: Date | null;
        fulfillmentAutomationQueuedAt?: Date | null;
        fulfillmentAutomationStatus?:
          | "idle"
          | "queued"
          | "processing"
          | "submitted"
          | "completed"
          | "failed";
        fulfillmentProviderKind?: "manual" | "webhook";
        id: string;
      }) {
        const record = [...checkoutSessions.values()].find(
          (candidate) => candidate.id === updateInput.id
        );

        if (!record) {
          throw new Error("Checkout session was not found.");
        }

        if (updateInput.fulfillmentAutomationAttemptCount !== undefined) {
          record.fulfillmentAutomationAttemptCount =
            updateInput.fulfillmentAutomationAttemptCount;
        }

        if (updateInput.fulfillmentAutomationErrorCode !== undefined) {
          record.fulfillmentAutomationErrorCode =
            updateInput.fulfillmentAutomationErrorCode;
        }

        if (updateInput.fulfillmentAutomationErrorMessage !== undefined) {
          record.fulfillmentAutomationErrorMessage =
            updateInput.fulfillmentAutomationErrorMessage;
        }

        if (updateInput.fulfillmentAutomationExternalReference !== undefined) {
          record.fulfillmentAutomationExternalReference =
            updateInput.fulfillmentAutomationExternalReference;
        }

        if (updateInput.fulfillmentAutomationLastAttemptedAt !== undefined) {
          record.fulfillmentAutomationLastAttemptedAt =
            updateInput.fulfillmentAutomationLastAttemptedAt;
        }

        if (updateInput.fulfillmentAutomationLastSucceededAt !== undefined) {
          record.fulfillmentAutomationLastSucceededAt =
            updateInput.fulfillmentAutomationLastSucceededAt;
        }

        if (updateInput.fulfillmentAutomationNextRetryAt !== undefined) {
          record.fulfillmentAutomationNextRetryAt =
            updateInput.fulfillmentAutomationNextRetryAt;
        }

        if (updateInput.fulfillmentAutomationQueuedAt !== undefined) {
          record.fulfillmentAutomationQueuedAt =
            updateInput.fulfillmentAutomationQueuedAt;
        }

        if (updateInput.fulfillmentAutomationStatus !== undefined) {
          record.fulfillmentAutomationStatus =
            updateInput.fulfillmentAutomationStatus;
        }

        if (updateInput.fulfillmentProviderKind !== undefined) {
          record.fulfillmentProviderKind = updateInput.fulfillmentProviderKind;
        }

        return record;
      },
      async updateStatusById(updateInput: {
        canceledAt?: Date | null;
        completedAt?: Date | null;
        id: string;
        status: "open" | "completed" | "expired" | "canceled";
      }) {
        const record = [...checkoutSessions.values()].find(
          (candidate) => candidate.id === updateInput.id
        );

        if (!record) {
          throw new Error("Checkout session was not found.");
        }

        record.status = updateInput.status;
        record.canceledAt =
          updateInput.canceledAt === undefined
            ? record.canceledAt
            : updateInput.canceledAt;
        record.completedAt =
          updateInput.completedAt === undefined
            ? record.completedAt
            : updateInput.completedAt;

        return record;
      }
    },
    publishedCollectionRepository: {
      async findDetailedByBrandSlugAndCollectionSlug() {
        return {
          ...publication,
          soldCount,
          storefrontStatus
        };
      },
      async updateCommerceById(updateInput: {
        id: string;
        soldCount: number;
        storefrontStatus?: "upcoming" | "live" | "sold_out" | "ended";
      }) {
        soldCount = updateInput.soldCount;
        storefrontStatus = updateInput.storefrontStatus ?? storefrontStatus;
        return {
          ...publication,
          soldCount,
          storefrontStatus
        };
      }
    },
    publishedCollectionReservationRepository: {
      async create(createInput: {
        buyerDisplayName: string | null;
        buyerEmail: string;
        buyerWalletAddress: string | null;
        expiresAt: Date;
        ownerUserId: string;
        publicId: string;
        publishedCollectionId: string;
        publishedCollectionItemId: string;
        status?: "pending" | "completed" | "expired" | "canceled";
      }) {
        const record = {
          buyerDisplayName: createInput.buyerDisplayName,
          buyerEmail: createInput.buyerEmail,
          buyerWalletAddress: createInput.buyerWalletAddress,
          completedAt: null,
          expiresAt: createInput.expiresAt,
          id: `reservation_${reservations.length + 1}`,
          status: "pending" as const
        };

        reservations.push({
          id: record.id,
          publishedCollectionItemId: createInput.publishedCollectionItemId,
          status: "pending"
        });

        return record;
      },
      async expirePendingByPublishedCollectionId() {
        return { count: 0 };
      },
      async listByPublishedCollectionIdAndStatuses(listInput: {
        publishedCollectionId: string;
        statuses: Array<"pending" | "completed" | "expired" | "canceled">;
      }) {
        return reservations.filter((reservation) =>
          listInput.statuses.includes(reservation.status)
        );
      },
      async updateStatusById(updateInput: {
        canceledAt?: Date | null;
        completedAt?: Date | null;
        id: string;
        status: "pending" | "completed" | "expired" | "canceled";
      }) {
        const record = reservations.find(
          (candidate) => candidate.id === updateInput.id
        );

        if (!record) {
          throw new Error("Reservation was not found.");
        }

        record.status = updateInput.status;
        const checkoutSession = [...checkoutSessions.values()].find(
          (candidate) => candidate.reservation.id === updateInput.id
        );

        if (checkoutSession) {
          checkoutSession.reservation.status = updateInput.status;
          checkoutSession.reservation.completedAt =
            updateInput.completedAt === undefined
              ? checkoutSession.reservation.completedAt
              : updateInput.completedAt;
        }

        return {
          id: record.id
        };
      }
    }
  };

  const service = createCollectionCommerceService({
    fulfillmentAutomation: {
      async enqueue(enqueueInput) {
        enqueuedFulfillmentJobs.push(enqueueInput);
      },
      providerMode: input?.fulfillmentProviderMode ?? "manual"
    },
    now: () => new Date("2026-04-10T10:00:00.000Z"),
    payment: {
      async createCheckoutSession({ checkoutSessionId }) {
        return {
          checkoutUrl: `/checkout/${checkoutSessionId}`,
          providerKind: input?.providerMode === "stripe" ? "stripe" : "manual",
          providerSessionId:
            input?.providerMode === "stripe" ? `cs_test_${checkoutSessionId}` : null
        };
      },
      async expireCheckoutSession({ providerSessionId }) {
        if (providerSessionId) {
          expiredProviderSessionIds.push(providerSessionId);
        }
      },
      providerMode: input?.providerMode ?? "manual"
    },
    repositories,
    reservationTtlSeconds: 900,
    async runTransaction(operation) {
      return operation(repositories);
    }
  });

  return {
    checkoutSessions,
    enqueuedFulfillmentJobs,
    expiredProviderSessionIds,
    getSoldCount() {
      return soldCount;
    },
    getStorefrontStatus() {
      return storefrontStatus;
    },
    reservations,
    service
  };
}

describe("createCollectionCommerceService", () => {
  it("creates a checkout session for the next available edition", async () => {
    const harness = createCommerceHarness();

    const result = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    expect(result.checkout.status).toBe("open");
    expect(result.checkout.reservation.editionNumber).toBe(1);
    expect(result.checkout.checkoutUrl).toContain("/checkout/chk_");
  });

  it("completes manual checkout and increments sold count", async () => {
    const harness = createCommerceHarness();
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    const result = await harness.service.completeManualCheckout({
      brandSlug: "demo-studio",
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      collectionSlug: "genesis-portrait-set"
    });

    expect(result.checkout.status).toBe("completed");
    expect(result.checkout.completedAt).not.toBeNull();
    expect(harness.getSoldCount()).toBe(1);
  });

  it("queues webhook fulfillment automation after checkout completion", async () => {
    const harness = createCommerceHarness({
      fulfillmentProviderMode: "webhook"
    });
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    const result = await harness.service.completeOwnerManualCheckout({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    expect(result.checkout.fulfillmentProviderKind).toBe("webhook");
    expect(result.checkout.fulfillmentAutomationStatus).toBe("queued");
    expect(harness.enqueuedFulfillmentJobs).toEqual([
      {
        checkoutSessionId: checkout.checkout.checkoutSessionId,
        source: "automatic"
      }
    ]);
  });

  it("disables checkout when the deployment provider is disabled", async () => {
    const harness = createCommerceHarness({
      providerMode: "disabled"
    });

    await expect(
      harness.service.createCheckoutSession({
        body: {
          buyerEmail: "collector@example.com"
        },
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://demo.example"
      })
    ).rejects.toMatchObject({
      code: "CHECKOUT_DISABLED"
    });
  });

  it("requires machine pricing when stripe checkout is enabled", async () => {
    const harness = createCommerceHarness({
      providerMode: "stripe",
      publicationOverrides: {
        priceAmountMinor: null,
        priceCurrency: null
      }
    });

    await expect(
      harness.service.createCheckoutSession({
        body: {
          buyerEmail: "collector@example.com"
        },
        brandSlug: "demo-studio",
        collectionSlug: "genesis-portrait-set",
        origin: "https://demo.example"
      })
    ).rejects.toMatchObject({
      code: "CHECKOUT_CONFIGURATION_REQUIRED"
    });
  });

  it("returns owner dashboard summary counts across payment and fulfillment states", async () => {
    const harness = createCommerceHarness();
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    await harness.service.completeOwnerManualCheckout({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });
    await harness.service.updateOwnerCheckoutFulfillment({
      body: {
        fulfillmentNotes: " Delivered to collector wallet ",
        fulfillmentStatus: "fulfilled"
      },
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    const result = await harness.service.getOwnerCommerceDashboard({
      ownerUserId: "user_1"
    });

    expect(result.dashboard.summary.totalCheckoutCount).toBe(1);
    expect(result.dashboard.summary.completedCheckoutCount).toBe(1);
    expect(result.dashboard.summary.fulfilledCheckoutCount).toBe(1);
    expect(result.dashboard.summary.unfulfilledCheckoutCount).toBe(0);
    expect(result.dashboard.summary.automationSubmittedCheckoutCount).toBe(0);
    expect(result.dashboard.collections).toHaveLength(1);
    expect(result.dashboard.collections[0]?.fulfilledCheckoutCount).toBe(1);
    expect(result.dashboard.checkouts[0]?.fulfillmentNotes).toBe(
      "Delivered to collector wallet"
    );
  });

  it("cancels open stripe checkout sessions and expires the provider session", async () => {
    const harness = createCommerceHarness({
      providerMode: "stripe"
    });
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    const result = await harness.service.cancelOwnerCheckoutSession({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    expect(result.checkout.status).toBe("canceled");
    expect(harness.expiredProviderSessionIds).toEqual([
      `cs_test_${checkout.checkout.checkoutSessionId}`
    ]);
  });

  it("records fulfillment state only for completed checkout sessions", async () => {
    const harness = createCommerceHarness();
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    await expect(
      harness.service.updateOwnerCheckoutFulfillment({
        body: {
          fulfillmentNotes: "Packed",
          fulfillmentStatus: "fulfilled"
        },
        checkoutSessionId: checkout.checkout.checkoutSessionId,
        ownerUserId: "user_1"
      })
    ).rejects.toMatchObject({
      code: "FULFILLMENT_NOT_ALLOWED"
    });

    await harness.service.completeOwnerManualCheckout({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    const result = await harness.service.updateOwnerCheckoutFulfillment({
      body: {
        fulfillmentNotes: " Packed and delivered ",
        fulfillmentStatus: "fulfilled"
      },
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    expect(result.checkout.fulfillmentStatus).toBe("fulfilled");
    expect(result.checkout.fulfilledAt).not.toBeNull();
    expect(result.checkout.fulfillmentNotes).toBe("Packed and delivered");
  });

  it("requeues failed webhook fulfillment automation for the owner", async () => {
    const harness = createCommerceHarness({
      fulfillmentProviderMode: "webhook"
    });
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    await harness.service.completeOwnerManualCheckout({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    const record = harness.checkoutSessions.get(
      checkout.checkout.checkoutSessionId
    );

    if (!record) {
      throw new Error("Expected checkout record.");
    }

    record.fulfillmentAutomationStatus = "failed";
    record.fulfillmentAutomationErrorCode = "WEBHOOK_DELIVERY_FAILED";
    record.fulfillmentAutomationErrorMessage = "Remote endpoint failed.";

    const result = await harness.service.retryOwnerCheckoutFulfillment({
      body: {},
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    expect(result.checkout.fulfillmentAutomationStatus).toBe("queued");
    expect(result.checkout.fulfillmentAutomationErrorMessage).toBeNull();
    expect(harness.enqueuedFulfillmentJobs).toHaveLength(2);
    expect(harness.enqueuedFulfillmentJobs[1]).toEqual({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      source: "manual_retry"
    });
  });

  it("records fulfillment callback completion from the webhook provider", async () => {
    const harness = createCommerceHarness({
      fulfillmentProviderMode: "webhook"
    });
    const checkout = await harness.service.createCheckoutSession({
      body: {
        buyerEmail: "collector@example.com"
      },
      brandSlug: "demo-studio",
      collectionSlug: "genesis-portrait-set",
      origin: "https://demo.example"
    });

    await harness.service.completeOwnerManualCheckout({
      checkoutSessionId: checkout.checkout.checkoutSessionId,
      ownerUserId: "user_1"
    });

    const result = await harness.service.recordFulfillmentAutomationCallback({
      body: {
        checkoutSessionId: checkout.checkout.checkoutSessionId,
        externalReference: "ship_123",
        fulfillmentNotes: "Delivered by external system",
        status: "fulfilled"
      }
    });

    expect(result.checkout.fulfillmentStatus).toBe("fulfilled");
    expect(result.checkout.fulfillmentAutomationStatus).toBe("completed");
    expect(result.checkout.fulfillmentAutomationExternalReference).toBe(
      "ship_123"
    );
  });
});
