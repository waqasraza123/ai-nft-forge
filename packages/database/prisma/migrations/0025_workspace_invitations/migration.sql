CREATE TABLE "workspace_invitations" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "invited_by_user_id" TEXT NOT NULL,
  "wallet_address" TEXT NOT NULL,
  "role" "WorkspaceMembershipRole" NOT NULL DEFAULT 'operator',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_invitations_workspace_id_wallet_address_key"
ON "workspace_invitations"("workspace_id", "wallet_address");

CREATE INDEX "workspace_invitations_wallet_address_idx"
ON "workspace_invitations"("wallet_address");

CREATE INDEX "workspace_invitations_workspace_id_idx"
ON "workspace_invitations"("workspace_id");

CREATE INDEX "workspace_invitations_expires_at_idx"
ON "workspace_invitations"("expires_at");

ALTER TABLE "workspace_invitations"
ADD CONSTRAINT "workspace_invitations_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_invitations"
ADD CONSTRAINT "workspace_invitations_invited_by_user_id_fkey"
FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
