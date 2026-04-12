ALTER TABLE "source_assets"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "generation_requests"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "generated_assets"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "collection_drafts"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "published_collections"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_observability_captures"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_reconciliation_runs"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_reconciliation_issues"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_generation_window_snapshots"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_states"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_mutes"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_routing_policies"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_schedule_policies"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_escalation_policies"
  ADD COLUMN "workspace_id" TEXT;

ALTER TABLE "ops_alert_deliveries"
  ADD COLUMN "workspace_id" TEXT;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "source_assets" AS "source_assets"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "source_assets"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "source_assets"."workspace_id" IS NULL;

UPDATE "generation_requests" AS "generation_requests"
SET "workspace_id" = "source_assets"."workspace_id"
FROM "source_assets"
WHERE "generation_requests"."source_asset_id" = "source_assets"."id"
  AND "generation_requests"."workspace_id" IS NULL;

UPDATE "generated_assets" AS "generated_assets"
SET "workspace_id" = "generation_requests"."workspace_id"
FROM "generation_requests"
WHERE "generated_assets"."generation_request_id" = "generation_requests"."id"
  AND "generated_assets"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "collection_drafts" AS "collection_drafts"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "collection_drafts"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "collection_drafts"."workspace_id" IS NULL;

UPDATE "published_collections" AS "published_collections"
SET "workspace_id" = "collection_drafts"."workspace_id"
FROM "collection_drafts"
WHERE "published_collections"."source_collection_draft_id" = "collection_drafts"."id"
  AND "published_collections"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_observability_captures" AS "ops_observability_captures"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_observability_captures"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_observability_captures"."workspace_id" IS NULL;

UPDATE "ops_generation_window_snapshots" AS "ops_generation_window_snapshots"
SET "workspace_id" = "ops_observability_captures"."workspace_id"
FROM "ops_observability_captures"
WHERE "ops_generation_window_snapshots"."capture_id" = "ops_observability_captures"."id"
  AND "ops_generation_window_snapshots"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_reconciliation_runs" AS "ops_reconciliation_runs"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_reconciliation_runs"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_reconciliation_runs"."workspace_id" IS NULL;

UPDATE "ops_reconciliation_issues" AS "ops_reconciliation_issues"
SET "workspace_id" = "ops_reconciliation_runs"."workspace_id"
FROM "ops_reconciliation_runs"
WHERE "ops_reconciliation_issues"."latest_run_id" = "ops_reconciliation_runs"."id"
  AND "ops_reconciliation_issues"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_alert_states" AS "ops_alert_states"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_alert_states"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_alert_states"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_alert_mutes" AS "ops_alert_mutes"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_alert_mutes"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_alert_mutes"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_alert_routing_policies" AS "ops_alert_routing_policies"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_alert_routing_policies"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_alert_routing_policies"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_alert_schedule_policies" AS "ops_alert_schedule_policies"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_alert_schedule_policies"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_alert_schedule_policies"."workspace_id" IS NULL;

WITH owner_workspace_map AS (
  SELECT DISTINCT ON ("owner_user_id")
    "owner_user_id",
    "id" AS "workspace_id"
  FROM "workspaces"
  ORDER BY "owner_user_id", "created_at" ASC, "id" ASC
)
UPDATE "ops_alert_escalation_policies" AS "ops_alert_escalation_policies"
SET "workspace_id" = owner_workspace_map."workspace_id"
FROM owner_workspace_map
WHERE "ops_alert_escalation_policies"."owner_user_id" = owner_workspace_map."owner_user_id"
  AND "ops_alert_escalation_policies"."workspace_id" IS NULL;

UPDATE "ops_alert_deliveries" AS "ops_alert_deliveries"
SET "workspace_id" = "ops_alert_states"."workspace_id"
FROM "ops_alert_states"
WHERE "ops_alert_deliveries"."alert_state_id" = "ops_alert_states"."id"
  AND "ops_alert_deliveries"."workspace_id" IS NULL;

ALTER TABLE "source_assets"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "generation_requests"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "generated_assets"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "collection_drafts"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "published_collections"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_observability_captures"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_reconciliation_runs"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_reconciliation_issues"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_generation_window_snapshots"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_states"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_mutes"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_routing_policies"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_schedule_policies"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_escalation_policies"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "ops_alert_deliveries"
  ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "source_assets"
  ADD CONSTRAINT "source_assets_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generation_requests"
  ADD CONSTRAINT "generation_requests_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generated_assets"
  ADD CONSTRAINT "generated_assets_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_drafts"
  ADD CONSTRAINT "collection_drafts_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "published_collections"
  ADD CONSTRAINT "published_collections_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_observability_captures"
  ADD CONSTRAINT "ops_observability_captures_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_reconciliation_runs"
  ADD CONSTRAINT "ops_reconciliation_runs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_reconciliation_issues"
  ADD CONSTRAINT "ops_reconciliation_issues_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_generation_window_snapshots"
  ADD CONSTRAINT "ops_generation_window_snapshots_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_states"
  ADD CONSTRAINT "ops_alert_states_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_mutes"
  ADD CONSTRAINT "ops_alert_mutes_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_routing_policies"
  ADD CONSTRAINT "ops_alert_routing_policies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_schedule_policies"
  ADD CONSTRAINT "ops_alert_schedule_policies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_escalation_policies"
  ADD CONSTRAINT "ops_alert_escalation_policies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ops_alert_deliveries"
  ADD CONSTRAINT "ops_alert_deliveries_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "collection_drafts_owner_user_id_slug_key";
DROP INDEX "ops_reconciliation_issues_owner_user_id_fingerprint_key";
DROP INDEX "ops_alert_states_owner_user_id_code_key";
DROP INDEX "ops_alert_mutes_owner_user_id_code_key";
DROP INDEX "ops_alert_routing_policies_owner_user_id_key";
DROP INDEX "ops_alert_schedule_policies_owner_user_id_key";
DROP INDEX "ops_alert_escalation_policies_owner_user_id_key";

CREATE INDEX "source_assets_workspace_id_status_idx"
  ON "source_assets"("workspace_id", "status");

CREATE INDEX "generation_requests_workspace_id_status_idx"
  ON "generation_requests"("workspace_id", "status");

CREATE INDEX "generated_assets_workspace_id_created_at_idx"
  ON "generated_assets"("workspace_id", "created_at");

CREATE INDEX "generated_assets_workspace_id_moderation_status_created_at_idx"
  ON "generated_assets"("workspace_id", "moderation_status", "created_at");

CREATE UNIQUE INDEX "collection_drafts_workspace_id_slug_key"
  ON "collection_drafts"("workspace_id", "slug");

CREATE INDEX "collection_drafts_workspace_id_updated_at_idx"
  ON "collection_drafts"("workspace_id", "updated_at");

CREATE INDEX "published_collections_workspace_id_updated_at_idx"
  ON "published_collections"("workspace_id", "updated_at");

CREATE INDEX "ops_observability_captures_workspace_id_captured_at_idx"
  ON "ops_observability_captures"("workspace_id", "captured_at");

CREATE INDEX "ops_generation_window_snapshots_workspace_id_captured_at_idx"
  ON "ops_generation_window_snapshots"("workspace_id", "captured_at");

CREATE INDEX "ops_reconciliation_runs_workspace_id_completed_at_idx"
  ON "ops_reconciliation_runs"("workspace_id", "completed_at");

CREATE UNIQUE INDEX "ops_reconciliation_issues_workspace_id_fingerprint_key"
  ON "ops_reconciliation_issues"("workspace_id", "fingerprint");

CREATE INDEX "ops_recon_issues_ws_status_severity_detected_idx"
  ON "ops_reconciliation_issues"("workspace_id", "status", "severity", "last_detected_at");

CREATE INDEX "ops_reconciliation_issues_workspace_latest_run_id_idx"
  ON "ops_reconciliation_issues"("workspace_id", "latest_run_id");

CREATE UNIQUE INDEX "ops_alert_states_workspace_id_code_key"
  ON "ops_alert_states"("workspace_id", "code");

CREATE INDEX "ops_alert_states_workspace_id_status_idx"
  ON "ops_alert_states"("workspace_id", "status");

CREATE UNIQUE INDEX "ops_alert_mutes_workspace_id_code_key"
  ON "ops_alert_mutes"("workspace_id", "code");

CREATE INDEX "ops_alert_mutes_workspace_id_muted_until_idx"
  ON "ops_alert_mutes"("workspace_id", "muted_until");

CREATE UNIQUE INDEX "ops_alert_routing_policies_workspace_id_key"
  ON "ops_alert_routing_policies"("workspace_id");

CREATE UNIQUE INDEX "ops_alert_schedule_policies_workspace_id_key"
  ON "ops_alert_schedule_policies"("workspace_id");

CREATE UNIQUE INDEX "ops_alert_escalation_policies_workspace_id_key"
  ON "ops_alert_escalation_policies"("workspace_id");

CREATE INDEX "ops_alert_deliveries_workspace_id_created_at_idx"
  ON "ops_alert_deliveries"("workspace_id", "created_at");
