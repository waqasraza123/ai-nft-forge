CREATE TYPE "WorkspaceRoleEscalationRequestStatus" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'canceled'
);

CREATE TABLE "workspace_role_escalation_requests" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "requested_by_user_id" TEXT NOT NULL,
  "target_user_id" TEXT NOT NULL,
  "requested_role" "WorkspaceMembershipRole" NOT NULL DEFAULT 'owner',
  "justification" TEXT,
  "status" "WorkspaceRoleEscalationRequestStatus" NOT NULL DEFAULT 'pending',
  "resolved_by_user_id" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_role_escalation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_role_escalation_requests_ws_status_created_idx"
  ON "workspace_role_escalation_requests"("workspace_id", "status", "created_at");

CREATE INDEX "workspace_role_escalation_requests_requested_status_idx"
  ON "workspace_role_escalation_requests"("requested_by_user_id", "status");

CREATE INDEX "workspace_role_escalation_requests_target_status_idx"
  ON "workspace_role_escalation_requests"("target_user_id", "status");

CREATE UNIQUE INDEX "workspace_role_escalation_requests_pending_owner_workspace_id_key"
  ON "workspace_role_escalation_requests"("workspace_id")
  WHERE "status" = 'pending' AND "requested_role" = 'owner';

ALTER TABLE "workspace_role_escalation_requests"
  ADD CONSTRAINT "workspace_role_escalation_requests_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_role_escalation_requests"
  ADD CONSTRAINT "workspace_role_escalation_requests_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_role_escalation_requests"
  ADD CONSTRAINT "workspace_role_escalation_requests_target_user_id_fkey"
  FOREIGN KEY ("target_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_role_escalation_requests"
  ADD CONSTRAINT "workspace_role_escalation_requests_resolved_by_user_id_fkey"
  FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
