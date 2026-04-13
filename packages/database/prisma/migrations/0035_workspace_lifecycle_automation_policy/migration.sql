ALTER TABLE "workspaces"
ADD COLUMN "lifecycle_automation_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lifecycle_automation_invitation_reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lifecycle_automation_decommission_notices_enabled" BOOLEAN NOT NULL DEFAULT true;
