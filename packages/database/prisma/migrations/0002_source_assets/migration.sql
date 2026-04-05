-- CreateEnum
CREATE TYPE "SourceAssetStatus" AS ENUM ('pending_upload', 'uploaded', 'upload_failed');

-- CreateTable
CREATE TABLE "source_assets" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_object_key" TEXT NOT NULL,
    "byte_size" INTEGER,
    "status" "SourceAssetStatus" NOT NULL DEFAULT 'pending_upload',
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_assets_storage_object_key_key" ON "source_assets"("storage_object_key");

-- CreateIndex
CREATE INDEX "source_assets_owner_user_id_status_idx" ON "source_assets"("owner_user_id", "status");

-- AddForeignKey
ALTER TABLE "source_assets" ADD CONSTRAINT "source_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
