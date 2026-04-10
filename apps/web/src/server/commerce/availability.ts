import {
  collectionCommerceAvailabilitySchema,
  type CollectionStorefrontStatus,
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

  return {
    availability: collectionCommerceAvailabilitySchema.parse({
      activeReservationCount: pendingReservationItemIds.size,
      availableEditionCount: availableItems.length,
      checkoutEnabled:
        input.providerMode !== "disabled" &&
        input.storefrontStatus === "live" &&
        availableItems.length > 0,
      nextAvailableEditionNumber: availableItems[0]?.position ?? null,
      providerMode: input.providerMode,
      reservationTtlSeconds: input.reservationTtlSeconds
    }),
    availableItems
  };
}
