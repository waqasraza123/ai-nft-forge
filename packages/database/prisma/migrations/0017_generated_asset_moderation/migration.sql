-- CreateEnum
CREATE TYPE "GeneratedAssetModerationStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "generated_assets"
ADD COLUMN "moderated_at" TIMESTAMP(3),
ADD COLUMN "moderation_status" "GeneratedAssetModerationStatus" NOT NULL DEFAULT 'pending_review';

-- Backfill legacy generated assets so existing curation and publication flows remain valid.
UPDATE "generated_assets"
SET
    "moderation_status" = 'approved',
    "moderated_at" = COALESCE("updated_at", "created_at");

-- CreateIndex
CREATE INDEX "generated_assets_owner_user_id_moderation_status_created_at_idx"
ON "generated_assets"("owner_user_id", "moderation_status", "created_at");
