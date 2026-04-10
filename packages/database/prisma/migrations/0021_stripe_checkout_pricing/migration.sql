ALTER TYPE "CommerceCheckoutProviderKind" ADD VALUE 'stripe';

ALTER TABLE "published_collections"
ADD COLUMN "price_amount_minor" INTEGER,
ADD COLUMN "price_currency" TEXT;

ALTER TABLE "commerce_checkout_sessions"
ADD COLUMN "provider_session_id" TEXT;
