ALTER TABLE "published_collection_items"
ADD COLUMN "public_storage_bucket" TEXT,
ADD COLUMN "public_storage_object_key" TEXT;

CREATE UNIQUE INDEX "pub_collection_items_public_object_key"
ON "published_collection_items"("public_storage_object_key");
