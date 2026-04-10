ALTER TABLE "published_collections"
ADD COLUMN "contract_chain_key" TEXT,
ADD COLUMN "contract_address" TEXT,
ADD COLUMN "contract_deploy_tx_hash" TEXT,
ADD COLUMN "contract_deployed_at" TIMESTAMP(3);

CREATE TABLE "published_collection_mints" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "published_collection_id" TEXT NOT NULL,
    "published_collection_item_id" TEXT NOT NULL,
    "token_id" INTEGER NOT NULL,
    "recipient_wallet_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "minted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_collection_mints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "published_collections_contract_address_key"
ON "published_collections"("contract_address");

CREATE UNIQUE INDEX "published_collections_contract_deploy_tx_hash_key"
ON "published_collections"("contract_deploy_tx_hash");

CREATE UNIQUE INDEX "published_collection_mints_tx_hash_key"
ON "published_collection_mints"("tx_hash");

CREATE UNIQUE INDEX "published_collection_mints_collection_token_id_key"
ON "published_collection_mints"("published_collection_id", "token_id");

CREATE INDEX "published_collection_mints_owner_user_id_minted_at_idx"
ON "published_collection_mints"("owner_user_id", "minted_at");

CREATE INDEX "published_collection_mints_collection_id_minted_at_idx"
ON "published_collection_mints"("published_collection_id", "minted_at");

CREATE INDEX "published_collection_mints_item_id_idx"
ON "published_collection_mints"("published_collection_item_id");

ALTER TABLE "published_collection_mints"
ADD CONSTRAINT "published_collection_mints_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_mints"
ADD CONSTRAINT "published_collection_mints_published_collection_id_fkey"
FOREIGN KEY ("published_collection_id") REFERENCES "published_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collection_mints"
ADD CONSTRAINT "published_collection_mints_published_collection_item_id_fkey"
FOREIGN KEY ("published_collection_item_id") REFERENCES "published_collection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
