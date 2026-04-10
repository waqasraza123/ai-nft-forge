-- CreateEnum
CREATE TYPE "OpsReconciliationRunStatus" AS ENUM ('succeeded', 'failed');

-- CreateEnum
CREATE TYPE "OpsReconciliationIssueStatus" AS ENUM ('open', 'repaired', 'ignored');

-- CreateEnum
CREATE TYPE "OpsReconciliationIssueSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "OpsReconciliationIssueKind" AS ENUM (
    'source_asset_object_missing',
    'generated_asset_object_missing',
    'published_public_asset_missing',
    'draft_contains_unapproved_asset',
    'review_ready_draft_invalid',
    'published_hero_asset_missing_from_snapshot'
);

-- CreateTable
CREATE TABLE "ops_reconciliation_runs" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "status" "OpsReconciliationRunStatus" NOT NULL,
    "message" TEXT,
    "issue_count" INTEGER NOT NULL DEFAULT 0,
    "warning_issue_count" INTEGER NOT NULL DEFAULT 0,
    "critical_issue_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_reconciliation_issues" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "latest_run_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "kind" "OpsReconciliationIssueKind" NOT NULL,
    "severity" "OpsReconciliationIssueSeverity" NOT NULL,
    "status" "OpsReconciliationIssueStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail_json" JSONB NOT NULL,
    "first_detected_at" TIMESTAMP(3) NOT NULL,
    "last_detected_at" TIMESTAMP(3) NOT NULL,
    "repaired_at" TIMESTAMP(3),
    "ignored_at" TIMESTAMP(3),
    "repair_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_reconciliation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ops_reconciliation_runs_owner_user_id_completed_at_idx"
ON "ops_reconciliation_runs"("owner_user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "ops_reconciliation_issues_owner_user_id_fingerprint_key"
ON "ops_reconciliation_issues"("owner_user_id", "fingerprint");

-- CreateIndex
CREATE INDEX "ops_reconciliation_issues_owner_status_severity_detected_idx"
ON "ops_reconciliation_issues"("owner_user_id", "status", "severity", "last_detected_at");

-- CreateIndex
CREATE INDEX "ops_reconciliation_issues_owner_latest_run_id_idx"
ON "ops_reconciliation_issues"("owner_user_id", "latest_run_id");

-- AddForeignKey
ALTER TABLE "ops_reconciliation_runs"
ADD CONSTRAINT "ops_reconciliation_runs_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_reconciliation_issues"
ADD CONSTRAINT "ops_reconciliation_issues_owner_user_id_fkey"
FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_reconciliation_issues"
ADD CONSTRAINT "ops_reconciliation_issues_latest_run_id_fkey"
FOREIGN KEY ("latest_run_id") REFERENCES "ops_reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
