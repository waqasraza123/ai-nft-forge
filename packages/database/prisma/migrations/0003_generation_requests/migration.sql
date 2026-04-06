-- CreateEnum
CREATE TYPE "GenerationRequestStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "generation_requests" (
    "id" TEXT NOT NULL,
    "source_asset_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "pipeline_key" TEXT NOT NULL,
    "requested_variant_count" INTEGER NOT NULL,
    "status" "GenerationRequestStatus" NOT NULL DEFAULT 'queued',
    "queue_job_id" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_requests_owner_user_id_status_idx" ON "generation_requests"("owner_user_id", "status");

-- CreateIndex
CREATE INDEX "generation_requests_source_asset_id_created_at_idx" ON "generation_requests"("source_asset_id", "created_at");

-- CreateIndex
CREATE INDEX "generation_requests_queue_job_id_idx" ON "generation_requests"("queue_job_id");

-- AddForeignKey
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_source_asset_id_fkey" FOREIGN KEY ("source_asset_id") REFERENCES "source_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
