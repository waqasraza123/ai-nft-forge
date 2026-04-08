CREATE TABLE "ops_alert_routing_policies" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "webhook_enabled" BOOLEAN NOT NULL DEFAULT true,
    "webhook_minimum_severity" "OpsAlertSeverity" NOT NULL DEFAULT 'warning',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_alert_routing_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ops_alert_routing_policies_owner_user_id_key"
ON "ops_alert_routing_policies"("owner_user_id");

ALTER TABLE "ops_alert_routing_policies"
ADD CONSTRAINT "ops_alert_routing_policies_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
