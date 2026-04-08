CREATE TABLE "ops_alert_schedule_policies" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "active_days_mask" INTEGER NOT NULL,
    "start_minute_of_day" INTEGER NOT NULL,
    "end_minute_of_day" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_alert_schedule_policies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ops_alert_schedule_policies_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ops_alert_schedule_policies_active_days_mask_check" CHECK ("active_days_mask" >= 1 AND "active_days_mask" <= 127),
    CONSTRAINT "ops_alert_schedule_policies_start_minute_of_day_check" CHECK ("start_minute_of_day" >= 0 AND "start_minute_of_day" <= 1439),
    CONSTRAINT "ops_alert_schedule_policies_end_minute_of_day_check" CHECK ("end_minute_of_day" >= 1 AND "end_minute_of_day" <= 1440),
    CONSTRAINT "ops_alert_schedule_policies_non_empty_window_check" CHECK ("start_minute_of_day" <> "end_minute_of_day")
);

CREATE UNIQUE INDEX "ops_alert_schedule_policies_owner_user_id_key" ON "ops_alert_schedule_policies"("owner_user_id");
