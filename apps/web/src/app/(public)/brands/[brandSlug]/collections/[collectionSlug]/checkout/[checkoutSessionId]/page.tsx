import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { createRuntimeCollectionCommerceService } from "../../../../../../../../server/commerce/runtime";
import { createRuntimePublicCollectionService } from "../../../../../../../../server/collections/runtime";

import { CheckoutClient } from "./checkout-client";

type CheckoutPageProps = {
  params: Promise<{
    brandSlug: string;
    checkoutSessionId: string;
    collectionSlug: string;
  }>;
};

function createStorefrontThemeStyle(theme: {
  accentColor: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
}) {
  const presetTokens: Record<
    typeof theme.themePreset,
    Record<string, string>
  > = {
    editorial_warm: {
      "--storefront-bg":
        "linear-gradient(180deg, rgba(255, 249, 240, 0.98) 0%, rgba(245, 236, 219, 0.96) 100%)",
      "--storefront-panel": "rgba(255, 252, 247, 0.74)",
      "--storefront-panel-strong": "rgba(255, 249, 241, 0.9)",
      "--storefront-text": "#201711",
      "--storefront-muted": "#6f5e51",
      "--storefront-border": "rgba(80, 48, 26, 0.12)"
    },
    gallery_mono: {
      "--storefront-bg":
        "linear-gradient(180deg, rgba(244, 244, 241, 0.98) 0%, rgba(228, 229, 225, 0.94) 100%)",
      "--storefront-panel": "rgba(255, 255, 255, 0.7)",
      "--storefront-panel-strong": "rgba(255, 255, 255, 0.88)",
      "--storefront-text": "#111315",
      "--storefront-muted": "#565d63",
      "--storefront-border": "rgba(17, 19, 21, 0.1)"
    },
    midnight_launch: {
      "--storefront-bg":
        "radial-gradient(circle at top left, rgba(255, 143, 78, 0.16), transparent 34%), linear-gradient(180deg, rgba(13, 18, 28, 0.98) 0%, rgba(23, 31, 48, 0.95) 100%)",
      "--storefront-panel": "rgba(14, 20, 34, 0.7)",
      "--storefront-panel-strong": "rgba(22, 29, 47, 0.84)",
      "--storefront-text": "#f3f2ed",
      "--storefront-muted": "#b5bac7",
      "--storefront-border": "rgba(243, 242, 237, 0.12)"
    }
  };

  return {
    ...presetTokens[theme.themePreset],
    "--storefront-accent": theme.accentColor
  } as CSSProperties;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCheckoutStatus(status: "open" | "completed" | "expired" | "canceled") {
  switch (status) {
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    case "canceled":
      return "Canceled";
    case "open":
    default:
      return "Awaiting payment";
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { brandSlug, checkoutSessionId, collectionSlug } = await params;
  const checkout =
    await createRuntimeCollectionCommerceService().getCheckoutSession({
      brandSlug,
      checkoutSessionId,
      collectionSlug
    });

  if (!checkout) {
    notFound();
  }

  const collection =
    await createRuntimePublicCollectionService().getPublicCollectionBySlugs({
      brandSlug,
      collectionSlug
    });

  if (!collection) {
    notFound();
  }

  const reservedItem =
    collection.collection.items.find(
      (item) => item.position === checkout.checkout.reservation.editionNumber
    ) ?? null;
  const canComplete =
    checkout.checkout.providerKind === "manual" &&
    checkout.checkout.status === "open";
  const canCancel =
    checkout.checkout.providerKind === "manual" &&
    (checkout.checkout.status === "open" ||
      checkout.checkout.status === "expired");
  const stripeCheckoutOpen =
    checkout.checkout.providerKind === "stripe" &&
    checkout.checkout.status === "open";
  const checkoutLead =
    checkout.checkout.providerKind === "stripe"
      ? checkout.checkout.status === "completed"
        ? "Payment was confirmed through Stripe Checkout. This reservation has been converted into a completed sale."
        : checkout.checkout.status === "open"
          ? "Payment is being handled through Stripe Checkout. If the redirect already closed, reopen the Stripe session below or refresh this page after payment confirmation."
          : "This Stripe Checkout session is no longer open."
      : "This deployment is using the manual commerce provider. The reservation is real and time-bound, but payment completion is simulated from this hosted checkout page.";

  return (
    <div
      className={`storefront-shell storefront-shell--${collection.collection.brandTheme.themePreset}`}
      style={createStorefrontThemeStyle(collection.collection.brandTheme)}
    >
      <section className="storefront-collection-grid">
        <article className="storefront-panel storefront-checkout-panel">
          <span className="storefront-section-kicker">Hosted checkout</span>
          <h1>{checkout.checkout.title}</h1>
          <div className="storefront-commerce-meta">
            <span className="storefront-chip storefront-chip--accent">
              {formatCheckoutStatus(checkout.checkout.status)}
            </span>
            <span className="storefront-chip">
              Edition #{checkout.checkout.reservation.editionNumber}
            </span>
            {checkout.checkout.priceLabel ? (
              <span className="storefront-chip">{checkout.checkout.priceLabel}</span>
            ) : null}
          </div>
          <p className="storefront-hero__lead">
            {checkoutLead}
          </p>
          <div className="storefront-checkout-detail-grid">
            <div className="storefront-stat">
              <strong>{checkout.checkout.reservation.buyerEmail}</strong>
              <span>Buyer email</span>
            </div>
            <div className="storefront-stat">
              <strong>{formatTimestamp(checkout.checkout.expiresAt)}</strong>
              <span>Reservation expires</span>
            </div>
            <div className="storefront-stat">
              <strong>
                {checkout.checkout.reservation.buyerWalletAddress ?? "Not provided"}
              </strong>
              <span>Wallet</span>
            </div>
            <div className="storefront-stat">
              <strong>{formatTimestamp(checkout.checkout.completedAt)}</strong>
              <span>Completed at</span>
            </div>
          </div>
          {checkout.checkout.providerKind === "manual" ? (
            <CheckoutClient
              brandSlug={brandSlug}
              canCancel={canCancel}
              canComplete={canComplete}
              checkoutSessionId={checkoutSessionId}
              collectionSlug={collectionSlug}
            />
          ) : stripeCheckoutOpen ? (
            <div className="storefront-checkout-actions">
              <Link
                className="storefront-button storefront-button--primary"
                href={checkout.checkout.checkoutUrl}
              >
                Open Stripe Checkout
              </Link>
              <Link
                className="storefront-button storefront-button--ghost"
                href={`/brands/${brandSlug}/collections/${collectionSlug}/checkout/${checkoutSessionId}`}
              >
                Refresh payment status
              </Link>
            </div>
          ) : null}
          <Link
            className="storefront-button storefront-button--ghost"
            href={`/brands/${brandSlug}/collections/${collectionSlug}`}
          >
            Back to release page
          </Link>
        </article>

        <article className="storefront-panel storefront-checkout-artwork">
          <span className="storefront-section-kicker">Reserved artwork</span>
          {reservedItem ? (
            <>
              <img
                alt={`${checkout.checkout.title} edition ${reservedItem.position}`}
                className="storefront-gallery-card__image"
                src={reservedItem.imageUrl}
              />
              <div className="storefront-gallery-card__copy">
                <strong>
                  {reservedItem.sourceAssetOriginalFilename} · variant{" "}
                  {reservedItem.variantIndex}
                </strong>
                <span>{reservedItem.pipelineKey}</span>
                <span>Edition {reservedItem.position}</span>
              </div>
            </>
          ) : (
            <div className="storefront-empty-state">
              Reserved artwork preview is unavailable.
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
