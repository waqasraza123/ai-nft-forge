ALTER TABLE "workspaces"
ADD COLUMN "decommission_retention_days_default" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "decommission_retention_days_minimum" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN "require_decommission_reason" BOOLEAN NOT NULL DEFAULT false;
