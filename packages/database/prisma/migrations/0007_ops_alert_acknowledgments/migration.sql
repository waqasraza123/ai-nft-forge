ALTER TABLE "ops_alert_states"
ADD COLUMN "acknowledged_at" TIMESTAMP(3),
ADD COLUMN "acknowledged_by_user_id" TEXT;

CREATE INDEX "ops_alert_states_acknowledged_by_user_id_idx"
ON "ops_alert_states"("acknowledged_by_user_id");

ALTER TABLE "ops_alert_states"
ADD CONSTRAINT "ops_alert_states_acknowledged_by_user_id_fkey"
FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
