CREATE TYPE "WorkspaceDecommissionNotificationKind" AS ENUM (
  'scheduled',
  'upcoming',
  'ready'
);

ALTER TABLE "workspace_invitations"
ADD COLUMN "last_reminded_at" TIMESTAMP(3),
ADD COLUMN "reminder_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "workspace_decommission_notifications" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "kind" "WorkspaceDecommissionNotificationKind" NOT NULL,
  "sent_by_user_id" TEXT NOT NULL,
  "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_decommission_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_decommission_notifications_request_kind_key"
ON "workspace_decommission_notifications"("request_id", "kind");

CREATE INDEX "workspace_decommission_notifications_request_sent_at_idx"
ON "workspace_decommission_notifications"("request_id", "sent_at");

CREATE INDEX "workspace_decommission_notifications_sent_by_sent_at_idx"
ON "workspace_decommission_notifications"("sent_by_user_id", "sent_at");

ALTER TABLE "workspace_decommission_notifications"
ADD CONSTRAINT "workspace_decommission_notifications_request_id_fkey"
FOREIGN KEY ("request_id") REFERENCES "workspace_decommission_requests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_decommission_notifications"
ADD CONSTRAINT "workspace_decommission_notifications_sent_by_user_id_fkey"
FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
