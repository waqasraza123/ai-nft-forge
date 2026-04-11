CREATE TYPE "CommerceFulfillmentProviderKind" AS ENUM ('manual', 'webhook');
CREATE TYPE "CommerceFulfillmentAutomationStatus" AS ENUM (
  'idle',
  'queued',
  'processing',
  'submitted',
  'completed',
  'failed'
);

ALTER TABLE "commerce_checkout_sessions"
ADD COLUMN "fulfillment_provider_kind" "CommerceFulfillmentProviderKind" NOT NULL DEFAULT 'manual',
ADD COLUMN "fulfillment_automation_status" "CommerceFulfillmentAutomationStatus" NOT NULL DEFAULT 'idle',
ADD COLUMN "fulfillment_automation_attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "fulfillment_automation_queued_at" TIMESTAMP(3),
ADD COLUMN "fulfillment_automation_last_attempted_at" TIMESTAMP(3),
ADD COLUMN "fulfillment_automation_last_succeeded_at" TIMESTAMP(3),
ADD COLUMN "fulfillment_automation_next_retry_at" TIMESTAMP(3),
ADD COLUMN "fulfillment_automation_external_reference" TEXT,
ADD COLUMN "fulfillment_automation_error_code" TEXT,
ADD COLUMN "fulfillment_automation_error_message" TEXT;

CREATE INDEX "commerce_checkout_owner_fulfill_auto_status_updated_idx"
ON "commerce_checkout_sessions"(
  "owner_user_id",
  "fulfillment_automation_status",
  "updated_at"
);
