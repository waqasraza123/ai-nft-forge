-- CreateEnum
CREATE TYPE "OpsQueueStatus" AS ENUM ('ok', 'unreachable');

-- CreateEnum
CREATE TYPE "OpsBackendReadinessStatus" AS ENUM ('ready', 'not_ready', 'unconfigured', 'unreachable');

-- CreateEnum
CREATE TYPE "OpsObservabilityStatus" AS ENUM ('ok', 'warning', 'critical', 'unreachable');

-- CreateEnum
CREATE TYPE "OpsAlertSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "OpsAlertStateStatus" AS ENUM ('active', 'resolved');

-- CreateEnum
CREATE TYPE "OpsAlertDeliveryChannel" AS ENUM ('audit_log');

-- CreateEnum
CREATE TYPE "OpsAlertDeliveryState" AS ENUM ('delivered', 'failed');

-- CreateTable
CREATE TABLE "ops_observability_captures" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "queue_status" "OpsQueueStatus" NOT NULL,
    "queue_waiting_count" INTEGER,
    "queue_active_count" INTEGER,
    "queue_delayed_count" INTEGER,
    "queue_failed_count" INTEGER,
    "queue_completed_count" INTEGER,
    "queue_paused_count" INTEGER,
    "queue_concurrency" INTEGER,
    "worker_adapter" TEXT,
    "backend_readiness_status" "OpsBackendReadinessStatus" NOT NULL,
    "backend_readiness_message" TEXT NOT NULL,
    "observability_status" "OpsObservabilityStatus" NOT NULL,
    "observability_message" TEXT NOT NULL,
    "oldest_queued_age_seconds" INTEGER,
    "oldest_running_age_seconds" INTEGER,
    "critical_alert_count" INTEGER NOT NULL DEFAULT 0,
    "warning_alert_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_observability_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_generation_window_snapshots" (
    "id" TEXT NOT NULL,
    "capture_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "window_key" TEXT NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "queued_count" INTEGER NOT NULL,
    "running_count" INTEGER NOT NULL,
    "succeeded_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL,
    "stored_asset_count" INTEGER NOT NULL,
    "success_rate_percent" DOUBLE PRECISION,
    "average_completion_seconds" INTEGER,
    "max_completion_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_generation_window_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_alert_states" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" "OpsAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "OpsAlertStateStatus" NOT NULL DEFAULT 'active',
    "first_observed_at" TIMESTAMP(3) NOT NULL,
    "last_observed_at" TIMESTAMP(3) NOT NULL,
    "last_delivered_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_alert_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_alert_deliveries" (
    "id" TEXT NOT NULL,
    "capture_id" TEXT NOT NULL,
    "alert_state_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" "OpsAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivery_channel" "OpsAlertDeliveryChannel" NOT NULL,
    "delivery_state" "OpsAlertDeliveryState" NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "failure_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_alert_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ops_observability_captures_owner_user_id_captured_at_idx" ON "ops_observability_captures"("owner_user_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "ops_generation_window_snapshots_capture_id_window_key_key" ON "ops_generation_window_snapshots"("capture_id", "window_key");

-- CreateIndex
CREATE INDEX "ops_generation_window_snapshots_owner_user_id_captured_at_idx" ON "ops_generation_window_snapshots"("owner_user_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "ops_alert_states_owner_user_id_code_key" ON "ops_alert_states"("owner_user_id", "code");

-- CreateIndex
CREATE INDEX "ops_alert_states_owner_user_id_status_idx" ON "ops_alert_states"("owner_user_id", "status");

-- CreateIndex
CREATE INDEX "ops_alert_deliveries_owner_user_id_created_at_idx" ON "ops_alert_deliveries"("owner_user_id", "created_at");

-- CreateIndex
CREATE INDEX "ops_alert_deliveries_alert_state_id_created_at_idx" ON "ops_alert_deliveries"("alert_state_id", "created_at");

-- AddForeignKey
ALTER TABLE "ops_observability_captures" ADD CONSTRAINT "ops_observability_captures_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_generation_window_snapshots" ADD CONSTRAINT "ops_generation_window_snapshots_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "ops_observability_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_generation_window_snapshots" ADD CONSTRAINT "ops_generation_window_snapshots_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_alert_states" ADD CONSTRAINT "ops_alert_states_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_alert_deliveries" ADD CONSTRAINT "ops_alert_deliveries_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "ops_observability_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_alert_deliveries" ADD CONSTRAINT "ops_alert_deliveries_alert_state_id_fkey" FOREIGN KEY ("alert_state_id") REFERENCES "ops_alert_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_alert_deliveries" ADD CONSTRAINT "ops_alert_deliveries_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
