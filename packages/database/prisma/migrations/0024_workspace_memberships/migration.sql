CREATE TYPE "WorkspaceMembershipRole" AS ENUM ('owner', 'operator');

CREATE TABLE "workspace_memberships" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceMembershipRole" NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key"
    ON "workspace_memberships"("workspace_id", "user_id");

CREATE INDEX "workspace_memberships_workspace_id_idx"
    ON "workspace_memberships"("workspace_id");

CREATE INDEX "workspace_memberships_user_id_idx"
    ON "workspace_memberships"("user_id");

ALTER TABLE "workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
