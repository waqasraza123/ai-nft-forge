import type { CommerceCheckoutProviderKind, CommerceCheckoutProviderMode } from "@ai-nft-forge/shared";
import Stripe from "stripe";

export const minimumStripeCheckoutTtlSeconds = 1800;

export type CommercePaymentSession = {
  checkoutUrl: string;
  providerKind: CommerceCheckoutProviderKind;
  providerSessionId: string | null;
};

export type CommercePaymentBoundary = {
  createCheckoutSession(input: {
    brandSlug: string;
    buyerEmail: string;
    collectionSlug: string;
    checkoutSessionId: string;
    editionNumber: number;
    expiresAt: Date;
    origin: string;
    priceAmountMinor: number;
    priceCurrency: string;
    priceLabel: string | null;
    title: string;
  }): Promise<CommercePaymentSession>;
  expireCheckoutSession(input: {
    providerKind: CommerceCheckoutProviderKind;
    providerSessionId: string | null;
  }): Promise<void>;
  providerMode: CommerceCheckoutProviderMode;
};

export function resolveCommerceReservationTtlSeconds(input: {
  configuredReservationTtlSeconds: number;
  providerMode: CommerceCheckoutProviderMode;
}) {
  if (input.providerMode !== "stripe") {
    return input.configuredReservationTtlSeconds;
  }

  return Math.max(
    input.configuredReservationTtlSeconds,
    minimumStripeCheckoutTtlSeconds
  );
}

export function createManualPaymentBoundary(input?: {
  providerMode?: "disabled" | "manual";
}): CommercePaymentBoundary {
  return {
    async createCheckoutSession(input) {
      return {
        checkoutUrl: `${input.origin}/brands/${input.brandSlug}/collections/${input.collectionSlug}/checkout/${input.checkoutSessionId}`,
        providerKind: "manual",
        providerSessionId: null
      };
    },
    async expireCheckoutSession() {},
    providerMode: input?.providerMode ?? "manual"
  };
}

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey);
}

export function createStripePaymentBoundary(input: { stripe: Stripe }) {
  return {
    async createCheckoutSession(sessionInput) {
      const hostedCheckoutUrl = new URL(
        `/brands/${sessionInput.brandSlug}/collections/${sessionInput.collectionSlug}/checkout/${sessionInput.checkoutSessionId}`,
        sessionInput.origin
      ).toString();
      const stripeSession = await input.stripe.checkout.sessions.create({
        cancel_url: hostedCheckoutUrl,
        client_reference_id: sessionInput.checkoutSessionId,
        customer_email: sessionInput.buyerEmail,
        expires_at: Math.floor(sessionInput.expiresAt.getTime() / 1000),
        line_items: [
          {
            price_data: {
              currency: sessionInput.priceCurrency,
              product_data: {
                description: sessionInput.priceLabel
                  ? `Edition ${sessionInput.editionNumber.toString()} · ${sessionInput.priceLabel}`
                  : `Edition ${sessionInput.editionNumber.toString()}`,
                name: `${sessionInput.title} #${sessionInput.editionNumber.toString()}`
              },
              unit_amount: sessionInput.priceAmountMinor
            },
            quantity: 1
          }
        ],
        metadata: {
          brand_slug: sessionInput.brandSlug,
          checkout_session_id: sessionInput.checkoutSessionId,
          collection_slug: sessionInput.collectionSlug,
          edition_number: sessionInput.editionNumber.toString()
        },
        mode: "payment",
        success_url: hostedCheckoutUrl
      });

      if (!stripeSession.url) {
        throw new Error("Stripe checkout session did not include a redirect URL.");
      }

      return {
        checkoutUrl: stripeSession.url,
        providerKind: "stripe" as const,
        providerSessionId: stripeSession.id
      };
    },
    async expireCheckoutSession(expireInput) {
      if (
        expireInput.providerKind !== "stripe" ||
        !expireInput.providerSessionId
      ) {
        return;
      }

      await input.stripe.checkout.sessions.expire(
        expireInput.providerSessionId
      );
    },
    providerMode: "stripe" as const
  } satisfies CommercePaymentBoundary;
}

export async function constructStripeWebhookEvent(input: {
  payload: string;
  signature: string;
  stripe: Stripe;
  webhookSecret: string;
}) {
  return input.stripe.webhooks.constructEventAsync(
    input.payload,
    input.signature,
    input.webhookSecret
  );
}
