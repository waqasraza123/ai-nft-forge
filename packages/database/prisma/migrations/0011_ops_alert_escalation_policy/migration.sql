ALTER TABLE "ops_alert_states"
ADD COLUMN "last_audit_log_delivered_at" TIMESTAMP(3),
ADD COLUMN "first_webhook_delivered_at" TIMESTAMP(3),
ADD COLUMN "last_webhook_delivered_at" TIMESTAMP(3);

CREATE TABLE "ops_alert_escalation_policies" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "first_reminder_delay_minutes" INTEGER NOT NULL,
  "repeat_reminder_interval_minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ops_alert_escalation_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ops_alert_escalation_policies_owner_user_id_key"
ON "ops_alert_escalation_policies"("owner_user_id");

ALTER TABLE "ops_alert_escalation_policies"
ADD CONSTRAINT "ops_alert_escalation_policies_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
