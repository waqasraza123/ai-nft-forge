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
    priceLabel: "0.18 ETH",
    slug: "genesis-portrait-set",
    soldCount: 0,
    storefrontStatus: "live" as const,
    title: "Genesis Portrait Set",
    totalSupply: 2
  };
}

function createCommerceHarness(input?: {
  providerMode?: "disabled" | "manual";
  reservationStatuses?: Array<"pending" | "completed" | "expired" | "canceled">;
}) {
  const publication = createPublicationRecord();
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
      checkoutUrl: string;
      completedAt: Date | null;
      expiresAt: Date;
      id: string;
      providerKind: "manual";
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
  let soldCount = publication.soldCount;
  let storefrontStatus: "upcoming" | "live" | "sold_out" | "ended" =
    publication.storefrontStatus;
  const repositories = {
    commerceCheckoutSessionRepository: {
      async create(createInput: {
        checkoutUrl: string;
        expiresAt: Date;
        ownerUserId: string;
        providerKind: "manual";
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
          checkoutUrl: createInput.checkoutUrl,
          completedAt: null,
          expiresAt: createInput.expiresAt,
          id: `checkout_record_${checkoutSessions.size + 1}`,
          providerKind: createInput.providerKind,
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
    now: () => new Date("2026-04-10T10:00:00.000Z"),
    payment: {
      createCheckoutSession({ checkoutSessionId }) {
        return {
          checkoutUrl: `/checkout/${checkoutSessionId}`,
          providerKind: "manual" as const
        };
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
      collectionSlug: "genesis-portrait-set"
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
      collectionSlug: "genesis-portrait-set"
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
        collectionSlug: "genesis-portrait-set"
      })
    ).rejects.toMatchObject({
      code: "CHECKOUT_DISABLED"
    });
  });
});
