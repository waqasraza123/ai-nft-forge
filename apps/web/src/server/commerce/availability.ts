import {
  collectionCommerceAvailabilitySchema,
  type CollectionStorefrontStatus,
  type CommerceCheckoutAvailabilityReason,
  type CommerceCheckoutProviderMode
} from "@ai-nft-forge/shared";

type CommerceAvailabilityItem = {
  id: string;
  position: number;
};

type CommerceAvailabilityMint = {
  publishedCollectionItemId: string;
};

type CommerceAvailabilityReservation = {
  publishedCollectionItemId: string;
  status: "pending" | "completed" | "expired" | "canceled";
};

export function createCollectionCommerceAvailability(input: {
  items: CommerceAvailabilityItem[];
  mints: CommerceAvailabilityMint[];
  pricingReady: boolean;
  providerMode: CommerceCheckoutProviderMode;
  reservations: CommerceAvailabilityReservation[];
  reservationTtlSeconds: number;
  storefrontStatus: CollectionStorefrontStatus;
}) {
  const pendingReservationItemIds = new Set(
    input.reservations
      .filter((reservation) => reservation.status === "pending")
      .map((reservation) => reservation.publishedCollectionItemId)
  );
  const completedReservationItemIds = new Set(
    input.reservations
      .filter((reservation) => reservation.status === "completed")
      .map((reservation) => reservation.publishedCollectionItemId)
  );
  const mintedItemIds = new Set(
    input.mints.map((mint) => mint.publishedCollectionItemId)
  );
  const availableItems = input.items.filter(
    (item) =>
      !pendingReservationItemIds.has(item.id) &&
      !completedReservationItemIds.has(item.id) &&
      !mintedItemIds.has(item.id)
  );
  let checkoutAvailabilityReason: CommerceCheckoutAvailabilityReason | null =
    null;

  if (input.providerMode === "disabled") {
    checkoutAvailabilityReason = "provider_disabled";
  } else if (input.storefrontStatus !== "live") {
    checkoutAvailabilityReason = "collection_not_live";
  } else if (!input.pricingReady) {
    checkoutAvailabilityReason = "pricing_incomplete";
  } else if (availableItems.length === 0) {
    checkoutAvailabilityReason = "no_available_editions";
  }

  return {
    availability: collectionCommerceAvailabilitySchema.parse({
      activeReservationCount: pendingReservationItemIds.size,
      availableEditionCount: availableItems.length,
      checkoutAvailabilityReason,
      checkoutEnabled: checkoutAvailabilityReason === null,
      nextAvailableEditionNumber: availableItems[0]?.position ?? null,
      providerMode: input.providerMode,
      reservationTtlSeconds: input.reservationTtlSeconds
    }),
    availableItems
  };
}
