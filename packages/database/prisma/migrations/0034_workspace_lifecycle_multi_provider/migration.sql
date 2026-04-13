CREATE TYPE "WorkspaceLifecycleNotificationProviderKey" AS ENUM (
  'primary',
  'secondary'
);

ALTER TABLE "workspace_lifecycle_notification_deliveries"
ADD COLUMN "provider_key" "WorkspaceLifecycleNotificationProviderKey";

UPDATE "workspace_lifecycle_notification_deliveries"
SET "provider_key" = 'primary'
WHERE "delivery_channel" = 'webhook';

DROP INDEX "ws_lifecycle_deliveries_notification_channel_key";
CREATE UNIQUE INDEX "ws_lifecycle_deliveries_notification_channel_provider_key"
ON "workspace_lifecycle_notification_deliveries" (
  "decommission_notification_id",
  "delivery_channel",
  "provider_key"
);

DROP INDEX "ws_lifecycle_deliveries_workspace_channel_created_at_idx";
CREATE INDEX "ws_lifecycle_deliveries_ws_chan_provider_created_idx"
ON "workspace_lifecycle_notification_deliveries" (
  "workspace_id",
  "delivery_channel",
  "provider_key",
  "created_at"
);
