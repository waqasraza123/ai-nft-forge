CREATE TYPE "CollectionDraftStatus" AS ENUM ('draft', 'review_ready');

CREATE TABLE "collection_drafts" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "CollectionDraftStatus" NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "collection_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collection_draft_items" (
  "id" TEXT NOT NULL,
  "collection_draft_id" TEXT NOT NULL,
  "generated_asset_id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "collection_draft_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collection_drafts_owner_user_id_slug_key"
ON "collection_drafts"("owner_user_id", "slug");

CREATE INDEX "collection_drafts_owner_user_id_updated_at_idx"
ON "collection_drafts"("owner_user_id", "updated_at");

CREATE UNIQUE INDEX "collection_draft_items_draft_asset_key"
ON "collection_draft_items"("collection_draft_id", "generated_asset_id");

CREATE UNIQUE INDEX "collection_draft_items_draft_position_key"
ON "collection_draft_items"("collection_draft_id", "position");

CREATE INDEX "collection_draft_items_generated_asset_id_idx"
ON "collection_draft_items"("generated_asset_id");

ALTER TABLE "collection_drafts"
ADD CONSTRAINT "collection_drafts_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_draft_items"
ADD CONSTRAINT "collection_draft_items_collection_draft_id_fkey"
FOREIGN KEY ("collection_draft_id") REFERENCES "collection_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_draft_items"
ADD CONSTRAINT "collection_draft_items_generated_asset_id_fkey"
FOREIGN KEY ("generated_asset_id") REFERENCES "generated_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
