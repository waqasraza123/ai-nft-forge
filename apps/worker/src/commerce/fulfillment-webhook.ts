import type { CommerceCheckoutProviderKind } from "@ai-nft-forge/shared";

export type CheckoutFulfillmentWebhookSession = {
  checkoutSessionId: string;
  completedAt: string | null;
  priceLabel: string | null;
  providerKind: CommerceCheckoutProviderKind;
  title: string;
  brandName: string;
  brandSlug: string;
  collectionSlug: string;
  editionNumber: number;
  buyerDisplayName: string | null;
  buyerEmail: string;
  buyerWalletAddress: string | null;
};

export type CheckoutFulfillmentWebhookBoundary = {
  dispatch(input: { session: CheckoutFulfillmentWebhookSession }): Promise<{
    externalReference: string | null;
  }>;
};

export function createCheckoutFulfillmentWebhookBoundary(input: {
  callbackBaseUrl: string;
  callbackBearerToken: string;
  timeoutMs: number;
  webhookBearerToken?: string;
  webhookUrl: string;
}): CheckoutFulfillmentWebhookBoundary {
  return {
    async dispatch({ session }) {
      const callbackUrl = new URL(
        "/api/commerce/fulfillment/callback",
        input.callbackBaseUrl
      ).toString();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

      try {
        const response = await fetch(input.webhookUrl, {
          body: JSON.stringify({
            buyer: {
              displayName: session.buyerDisplayName,
              email: session.buyerEmail,
              walletAddress: session.buyerWalletAddress
            },
            callback: {
              authorization: `Bearer ${input.callbackBearerToken}`,
              url: callbackUrl
            },
            checkout: {
              checkoutSessionId: session.checkoutSessionId,
              completedAt: session.completedAt,
              editionNumber: session.editionNumber,
              priceLabel: session.priceLabel,
              providerKind: session.providerKind
            },
            collection: {
              brandName: session.brandName,
              brandSlug: session.brandSlug,
              collectionSlug: session.collectionSlug,
              title: session.title
            },
            event: "checkout.fulfillment.requested"
          }),
          headers: {
            ...(input.webhookBearerToken
              ? {
                  Authorization: `Bearer ${input.webhookBearerToken}`
                }
              : {}),
            "Content-Type": "application/json"
          },
          method: "POST",
          signal: controller.signal
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            `Fulfillment webhook returned HTTP ${response.status.toString()}.`
          );
        }

        let externalReference: string | null = null;

        if (
          typeof payload === "object" &&
          payload !== null &&
          "externalReference" in payload &&
          typeof payload.externalReference === "string" &&
          payload.externalReference.trim().length > 0
        ) {
          externalReference = payload.externalReference.trim();
        }

        return {
          externalReference
        };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
