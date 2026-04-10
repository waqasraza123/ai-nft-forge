CREATE TYPE "CommerceCheckoutFulfillmentStatus" AS ENUM ('unfulfilled', 'fulfilled');

ALTER TABLE "commerce_checkout_sessions"
ADD COLUMN "fulfillment_status" "CommerceCheckoutFulfillmentStatus" NOT NULL DEFAULT 'unfulfilled',
ADD COLUMN "fulfillment_notes" TEXT,
ADD COLUMN "fulfilled_at" TIMESTAMP(3);
