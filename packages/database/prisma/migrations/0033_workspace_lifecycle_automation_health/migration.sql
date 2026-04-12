ALTER TYPE "WorkspaceLifecycleNotificationDeliveryChannel"
    ADD VALUE 'audit_log';

CREATE TYPE "WorkspaceLifecycleAutomationRunStatus" AS ENUM (
    'running',
    'succeeded',
    'failed'
);

CREATE TYPE "WorkspaceLifecycleAutomationRunTriggerSource" AS ENUM (
    'manual',
    'scheduled'
);

DROP INDEX "ws_lifecycle_deliveries_decommission_notification_id_key";

CREATE UNIQUE INDEX "ws_lifecycle_deliveries_notification_channel_key"
    ON "workspace_lifecycle_notification_deliveries"("decommission_notification_id", "delivery_channel");

CREATE INDEX "ws_lifecycle_deliveries_workspace_channel_created_at_idx"
    ON "workspace_lifecycle_notification_deliveries"("workspace_id", "delivery_channel", "created_at");

CREATE TABLE "workspace_lifecycle_automation_runs" (
    "id" TEXT NOT NULL,
    "trigger_source" "WorkspaceLifecycleAutomationRunTriggerSource" NOT NULL,
    "status" "WorkspaceLifecycleAutomationRunStatus" NOT NULL DEFAULT 'running',
    "workspace_count" INTEGER NOT NULL DEFAULT 0,
    "invitation_reminder_count" INTEGER NOT NULL DEFAULT 0,
    "decommission_notice_count" INTEGER NOT NULL DEFAULT 0,
    "audit_log_delivery_count" INTEGER NOT NULL DEFAULT 0,
    "webhook_queued_count" INTEGER NOT NULL DEFAULT 0,
    "failed_workspace_count" INTEGER NOT NULL DEFAULT 0,
    "failure_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_lifecycle_automation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ws_lifecycle_automation_runs_created_at_idx"
    ON "workspace_lifecycle_automation_runs"("created_at");

CREATE INDEX "ws_lifecycle_automation_runs_status_created_at_idx"
    ON "workspace_lifecycle_automation_runs"("status", "created_at");
