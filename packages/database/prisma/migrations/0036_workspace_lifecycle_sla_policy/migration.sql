ALTER TABLE "workspaces"
ADD COLUMN "lifecycle_sla_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lifecycle_sla_webhook_failure_threshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "lifecycle_sla_automation_max_age_minutes" INTEGER NOT NULL DEFAULT 180;
