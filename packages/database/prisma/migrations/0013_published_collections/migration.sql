CREATE TABLE "published_collections" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "source_collection_draft_id" TEXT NOT NULL,
  "brand_name" TEXT NOT NULL,
  "brand_slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "published_collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "published_collection_items" (
  "id" TEXT NOT NULL,
  "published_collection_id" TEXT NOT NULL,
  "generated_asset_id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "published_collection_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "published_collections_source_collection_draft_id_key"
ON "published_collections"("source_collection_draft_id");

CREATE UNIQUE INDEX "published_collections_brand_slug_slug_key"
ON "published_collections"("brand_slug", "slug");

CREATE INDEX "published_collections_owner_user_id_updated_at_idx"
ON "published_collections"("owner_user_id", "updated_at");

CREATE UNIQUE INDEX "pub_collection_items_pub_asset_key"
ON "published_collection_items"("published_collection_id", "generated_asset_id");

CREATE UNIQUE INDEX "pub_collection_items_pub_position_key"
ON "published_collection_items"("published_collection_id", "position");

CREATE INDEX "published_collection_items_generated_asset_id_idx"
ON "published_collection_items"("generated_asset_id");

ALTER TABLE "published_collections"
ADD CONSTRAINT "published_collections_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collections"
ADD CONSTRAINT "published_collections_source_collection_draft_id_fkey"
FOREIGN KEY ("source_collection_draft_id") REFERENCES "collection_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_items"
ADD CONSTRAINT "published_collection_items_published_collection_id_fkey"
FOREIGN KEY ("published_collection_id") REFERENCES "published_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_items"
ADD CONSTRAINT "published_collection_items_generated_asset_id_fkey"
FOREIGN KEY ("generated_asset_id") REFERENCES "generated_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
