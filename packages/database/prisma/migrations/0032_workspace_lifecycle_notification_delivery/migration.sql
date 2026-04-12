CREATE TYPE "WorkspaceLifecycleNotificationDeliveryKind" AS ENUM (
    'invitation_reminder',
    'decommission_notice'
);

CREATE TYPE "WorkspaceLifecycleNotificationDeliveryChannel" AS ENUM (
    'webhook'
);

CREATE TYPE "WorkspaceLifecycleNotificationDeliveryState" AS ENUM (
    'queued',
    'processing',
    'delivered',
    'failed',
    'skipped'
);

ALTER TABLE "workspaces"
    ADD COLUMN "lifecycle_webhook_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "lifecycle_webhook_deliver_invitation_reminders" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "lifecycle_webhook_deliver_decommission_notifications" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "workspace_lifecycle_notification_deliveries" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "invitation_id" TEXT,
    "decommission_notification_id" TEXT,
    "event_kind" "WorkspaceLifecycleNotificationDeliveryKind" NOT NULL,
    "delivery_channel" "WorkspaceLifecycleNotificationDeliveryChannel" NOT NULL DEFAULT 'webhook',
    "delivery_state" "WorkspaceLifecycleNotificationDeliveryState" NOT NULL,
    "event_occurred_at" TIMESTAMP(3) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "queued_at" TIMESTAMP(3),
    "last_attempted_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_lifecycle_notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ws_lifecycle_deliveries_decommission_notification_id_key"
    ON "workspace_lifecycle_notification_deliveries"("decommission_notification_id");

CREATE INDEX "ws_lifecycle_deliveries_workspace_created_at_idx"
    ON "workspace_lifecycle_notification_deliveries"("workspace_id", "created_at");

CREATE INDEX "ws_lifecycle_deliveries_workspace_state_created_at_idx"
    ON "workspace_lifecycle_notification_deliveries"("workspace_id", "delivery_state", "created_at");

CREATE INDEX "ws_lifecycle_deliveries_owner_created_at_idx"
    ON "workspace_lifecycle_notification_deliveries"("owner_user_id", "created_at");

CREATE INDEX "ws_lifecycle_deliveries_kind_state_created_at_idx"
    ON "workspace_lifecycle_notification_deliveries"("event_kind", "delivery_state", "created_at");

ALTER TABLE "workspace_lifecycle_notification_deliveries"
    ADD CONSTRAINT "workspace_lifecycle_notification_deliveries_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_lifecycle_notification_deliveries"
    ADD CONSTRAINT "workspace_lifecycle_notification_deliveries_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_lifecycle_notification_deliveries"
    ADD CONSTRAINT "workspace_lifecycle_notification_deliveries_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "workspace_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_lifecycle_notification_deliveries"
    ADD CONSTRAINT "workspace_lifecycle_notification_deliveries_decommission_notification_id_fkey"
    FOREIGN KEY ("decommission_notification_id") REFERENCES "workspace_decommission_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
