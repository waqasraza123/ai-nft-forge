CREATE TABLE "ops_alert_mutes" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "muted_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_alert_mutes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ops_alert_mutes_owner_user_id_code_key"
ON "ops_alert_mutes"("owner_user_id", "code");

CREATE INDEX "ops_alert_mutes_owner_user_id_muted_until_idx"
ON "ops_alert_mutes"("owner_user_id", "muted_until");

ALTER TABLE "ops_alert_mutes"
ADD CONSTRAINT "ops_alert_mutes_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
