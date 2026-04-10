CREATE TYPE "PublishedCollectionReservationStatus" AS ENUM (
  'pending',
  'completed',
  'expired',
  'canceled'
);

CREATE TYPE "CommerceCheckoutSessionStatus" AS ENUM (
  'open',
  'completed',
  'expired',
  'canceled'
);

CREATE TYPE "CommerceCheckoutProviderKind" AS ENUM (
  'manual'
);

CREATE TABLE "published_collection_reservations" (
  "id" TEXT NOT NULL,
  "public_id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "published_collection_id" TEXT NOT NULL,
  "published_collection_item_id" TEXT NOT NULL,
  "status" "PublishedCollectionReservationStatus" NOT NULL DEFAULT 'pending',
  "buyer_display_name" TEXT,
  "buyer_email" TEXT NOT NULL,
  "buyer_wallet_address" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "canceled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "published_collection_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commerce_checkout_sessions" (
  "id" TEXT NOT NULL,
  "public_id" TEXT NOT NULL,
  "reservation_id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "published_collection_id" TEXT NOT NULL,
  "provider_kind" "CommerceCheckoutProviderKind" NOT NULL,
  "status" "CommerceCheckoutSessionStatus" NOT NULL DEFAULT 'open',
  "checkout_url" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  "canceled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commerce_checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "published_collection_reservations_public_id_key"
ON "published_collection_reservations"("public_id");

CREATE UNIQUE INDEX "published_collection_reservations_item_pending_key"
ON "published_collection_reservations"("published_collection_item_id")
WHERE "status" = 'pending';

CREATE INDEX "pub_coll_res_owner_created_idx"
ON "published_collection_reservations"("owner_user_id", "created_at");

CREATE INDEX "pub_coll_res_collection_status_exp_idx"
ON "published_collection_reservations"("published_collection_id", "status", "expires_at");

CREATE INDEX "pub_coll_res_item_status_exp_idx"
ON "published_collection_reservations"("published_collection_item_id", "status", "expires_at");

CREATE UNIQUE INDEX "commerce_checkout_sessions_public_id_key"
ON "commerce_checkout_sessions"("public_id");

CREATE UNIQUE INDEX "commerce_checkout_sessions_reservation_id_key"
ON "commerce_checkout_sessions"("reservation_id");

CREATE INDEX "commerce_checkout_owner_created_idx"
ON "commerce_checkout_sessions"("owner_user_id", "created_at");

CREATE INDEX "commerce_checkout_collection_status_exp_idx"
ON "commerce_checkout_sessions"("published_collection_id", "status", "expires_at");

ALTER TABLE "published_collection_reservations"
ADD CONSTRAINT "published_collection_reservations_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_reservations"
ADD CONSTRAINT "published_collection_reservations_published_collection_id_fkey"
FOREIGN KEY ("published_collection_id") REFERENCES "published_collections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_reservations"
ADD CONSTRAINT "published_collection_reservations_published_collection_item_id_fkey"
FOREIGN KEY ("published_collection_item_id") REFERENCES "published_collection_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commerce_checkout_sessions"
ADD CONSTRAINT "commerce_checkout_sessions_reservation_id_fkey"
FOREIGN KEY ("reservation_id") REFERENCES "published_collection_reservations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commerce_checkout_sessions"
ADD CONSTRAINT "commerce_checkout_sessions_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commerce_checkout_sessions"
ADD CONSTRAINT "commerce_checkout_sessions_published_collection_id_fkey"
FOREIGN KEY ("published_collection_id") REFERENCES "published_collections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
