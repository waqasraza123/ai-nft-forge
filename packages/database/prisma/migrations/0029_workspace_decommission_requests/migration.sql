CREATE TYPE "WorkspaceDecommissionRequestStatus" AS ENUM (
  'scheduled',
  'canceled',
  'executed'
);

CREATE TABLE "workspace_decommission_requests" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "requested_by_user_id" TEXT NOT NULL,
  "retention_days" INTEGER NOT NULL,
  "export_confirmed_at" TIMESTAMP(3) NOT NULL,
  "execute_after" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "status" "WorkspaceDecommissionRequestStatus" NOT NULL DEFAULT 'scheduled',
  "canceled_by_user_id" TEXT,
  "canceled_at" TIMESTAMP(3),
  "executed_by_user_id" TEXT,
  "executed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_decommission_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "workspace_decommission_requests"
  ADD CONSTRAINT "workspace_decommission_requests_workspace_id_fkey"
  FOREIGN KEY ("workspace_id")
  REFERENCES "workspaces"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "workspace_decommission_requests"
  ADD CONSTRAINT "workspace_decommission_requests_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "workspace_decommission_requests"
  ADD CONSTRAINT "workspace_decommission_requests_canceled_by_user_id_fkey"
  FOREIGN KEY ("canceled_by_user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "workspace_decommission_requests"
  ADD CONSTRAINT "workspace_decommission_requests_executed_by_user_id_fkey"
  FOREIGN KEY ("executed_by_user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "workspace_decommission_requests_ws_status_execute_idx"
  ON "workspace_decommission_requests"("workspace_id", "status", "execute_after");

CREATE INDEX "workspace_decommission_requests_requested_status_idx"
  ON "workspace_decommission_requests"("requested_by_user_id", "status");
