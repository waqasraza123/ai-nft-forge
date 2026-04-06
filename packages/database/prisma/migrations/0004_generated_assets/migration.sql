-- CreateTable
CREATE TABLE "generated_assets" (
    "id" TEXT NOT NULL,
    "generation_request_id" TEXT NOT NULL,
    "source_asset_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "variant_index" INTEGER NOT NULL,
    "content_type" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_object_key" TEXT NOT NULL,
    "byte_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_assets_storage_object_key_key" ON "generated_assets"("storage_object_key");

-- CreateIndex
CREATE UNIQUE INDEX "generated_assets_generation_request_id_variant_index_key" ON "generated_assets"("generation_request_id", "variant_index");

-- CreateIndex
CREATE INDEX "generated_assets_owner_user_id_created_at_idx" ON "generated_assets"("owner_user_id", "created_at");

-- CreateIndex
CREATE INDEX "generated_assets_source_asset_id_created_at_idx" ON "generated_assets"("source_asset_id", "created_at");

-- CreateIndex
CREATE INDEX "generated_assets_generation_request_id_created_at_idx" ON "generated_assets"("generation_request_id", "created_at");

-- AddForeignKey
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_generation_request_id_fkey" FOREIGN KEY ("generation_request_id") REFERENCES "generation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_source_asset_id_fkey" FOREIGN KEY ("source_asset_id") REFERENCES "source_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
