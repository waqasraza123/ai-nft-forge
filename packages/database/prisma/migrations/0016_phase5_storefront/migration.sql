CREATE TYPE "PublishedCollectionStorefrontStatus" AS ENUM (
  'upcoming',
  'live',
  'sold_out',
  'ended'
);

ALTER TABLE "published_collections"
ADD COLUMN "storefront_status" "PublishedCollectionStorefrontStatus" NOT NULL DEFAULT 'ended',
ADD COLUMN "launch_at" TIMESTAMP(3),
ADD COLUMN "end_at" TIMESTAMP(3),
ADD COLUMN "total_supply" INTEGER,
ADD COLUMN "sold_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "price_label" TEXT,
ADD COLUMN "hero_generated_asset_id" TEXT,
ADD COLUMN "storefront_headline" TEXT,
ADD COLUMN "storefront_body" TEXT,
ADD COLUMN "primary_cta_label" TEXT,
ADD COLUMN "primary_cta_href" TEXT,
ADD COLUMN "secondary_cta_label" TEXT,
ADD COLUMN "secondary_cta_href" TEXT;

ALTER TABLE "published_collections"
ADD CONSTRAINT "published_collections_hero_generated_asset_id_fkey"
FOREIGN KEY ("hero_generated_asset_id")
REFERENCES "generated_assets"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "published_collections_brand_status_order_updated_at_idx"
ON "published_collections"(
  "brand_slug",
  "storefront_status",
  "display_order",
  "updated_at"
);
