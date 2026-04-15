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

type CheckoutActionMode = "manual" | "stripe";

type CheckoutStatus = "open" | "completed" | "expired" | "canceled";

type CheckoutStatusCopy = {
  heroLead: string;
  actionTitle: string;
  actionSubtext: string;
  stateTone: "open" | "positive" | "expired" | "canceled";
};

const checkoutStatusCopy: Record<CheckoutStatus, CheckoutStatusCopy> = {
  open: {
    heroLead:
      "This item is reserved and awaiting finalization. Reserve ownership is active and can still be claimed.",
    actionTitle: "Complete your claim now",
    actionSubtext: "Press forward to finish the checkout flow and mint this edition.",
    stateTone: "open"
  },
  completed: {
    heroLead:
      "This reservation is complete. Your claim has been finalized and the edition is marked as fulfilled in the hosted reservation flow.",
    actionTitle: "Checkout completed",
    actionSubtext:
      "This checkout has already been completed. No additional action is required.",
    stateTone: "positive"
  },
  expired: {
    heroLead:
      "This reservation window has elapsed. Availability moved on and this slot is no longer held.",
    actionTitle: "Reservation expired",
    actionSubtext:
      "This slot can no longer be completed. Start a new reservation from the collection page if still available.",
    stateTone: "expired"
  },
  canceled: {
    heroLead:
      "This reservation was canceled and release of control has been recorded in the checkout session.",
    actionTitle: "Reservation canceled",
    actionSubtext:
      "This session is no longer active and can be closed from here only by historical review.",
    stateTone: "canceled"
  }
};

const providerModeCopy: Record<
  CheckoutActionMode,
  {
    title: string;
    shortTitle: string;
  }
> = {
  manual: {
    title: "Manual settlement",
    shortTitle: "Manual"
  },
  stripe: {
    title: "Stripe settlement",
    shortTitle: "Stripe"
  }
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

function formatCheckoutStatus(status: CheckoutStatus) {
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

function formatWalletAddress(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  return value;
}

function buildActionCopy(input: {
  status: CheckoutStatus;
  isStripeOpen: boolean;
  providerMode: CheckoutActionMode;
}) {
  if (input.providerMode === "manual") {
    return {
      providerLead:
        input.status === "completed"
          ? "Manual settlement was recorded for this reservation."
          : "Use the manual controls to claim or release this reservation.",
      buttonLabel: "Continue manual settlement",
      secondaryLabel: "Back to collection"
    };
  }

  if (input.isStripeOpen) {
    return {
      providerLead:
        "Stripe is handling this payment step. Continue to the hosted checkout to finalize.",
      buttonLabel: "Continue to secure payment",
      secondaryLabel: "Refresh payment status"
    };
  }

  return {
    providerLead: "Stripe checkout is no longer active for this reservation.",
    buttonLabel: "Payment complete",
    secondaryLabel: "Back to collection"
  };
}

function buildCheckoutStatusClass(status: CheckoutStatus) {
  return checkoutStatusCopy[status].stateTone;
}

function buildStatusChip(status: CheckoutStatus) {
  return {
    label: formatCheckoutStatus(status),
    className: `storefront-checkout-status-pill storefront-checkout-status-pill--${buildCheckoutStatusClass(
      status
    )}`
  };
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
  const editionIdentity = `Edition #${checkout.checkout.reservation.editionNumber.toString()}`;
  const releasePath = `/brands/${brandSlug}/collections/${collectionSlug}`;
  const canComplete =
    checkout.checkout.providerKind === "manual" &&
    checkout.checkout.status === "open";
  const canCancel =
    checkout.checkout.providerKind === "manual" &&
    (checkout.checkout.status === "open" ||
      checkout.checkout.status === "expired");
  const isStripeOpen =
    checkout.checkout.providerKind === "stripe" &&
    checkout.checkout.status === "open";
  const statusCopy = checkoutStatusCopy[checkout.checkout.status];
  const statusChip = buildStatusChip(checkout.checkout.status);
  const statusProviderCopy = providerModeCopy[checkout.checkout.providerKind];
  const actionCopy = buildActionCopy({
    isStripeOpen,
    providerMode: checkout.checkout.providerKind,
    status: checkout.checkout.status
  });
  const checkoutLead =
    statusCopy.heroLead;

  return (
    <div
      className={`storefront-shell storefront-shell--${collection.collection.brandTheme.themePreset}`}
      style={createStorefrontThemeStyle(collection.collection.brandTheme)}
    >
      <section className="storefront-checkout-layout">
        <article className="storefront-panel storefront-checkout-hero">
          <div className="storefront-checkout-status-row">
            <span className={statusChip.className}>{statusChip.label}</span>
            <span className="storefront-checkout-provider-pill">
              {statusProviderCopy.title}
            </span>
          </div>
          <span className="storefront-section-kicker">Hosted checkout</span>
          <h1 className="storefront-checkout-hero__title">
            {checkout.checkout.title}
          </h1>
          <p className="storefront-checkout-hero__edition">{editionIdentity}</p>
          <div className="storefront-checkout-hero__media">
            {reservedItem ? (
              <img
                alt={`${checkout.checkout.title} ${editionIdentity}`}
                className="storefront-checkout-artwork-image"
                src={reservedItem.imageUrl}
              />
            ) : (
              <div className="storefront-checkout-artwork-placeholder">
                Reserved artwork preview is unavailable.
              </div>
            )}
          </div>
          <p className="storefront-hero__lead">{checkoutLead}</p>
          <div className="storefront-checkout-hero__meta">
            {checkout.checkout.priceLabel ? (
              <span className="storefront-chip storefront-chip--accent">
                {checkout.checkout.priceLabel}
              </span>
            ) : null}
            <span>{statusProviderCopy.shortTitle} provider</span>
            <span>Launch checkpoint in public storefront</span>
          </div>
        </article>

        <article className="storefront-panel storefront-checkout-summary">
          <span className="storefront-section-kicker">Reservation summary</span>
          <h2>Collector checkpoint</h2>
          <div className="storefront-checkout-summary-grid">
            <div className="storefront-stat">
              <span>Checkout status</span>
              <strong>{formatCheckoutStatus(checkout.checkout.status)}</strong>
            </div>
            <div className="storefront-stat">
              <span>Reserved edition</span>
              <strong>
                {reservedItem?.sourceAssetOriginalFilename
                  ? `${reservedItem.sourceAssetOriginalFilename} · v${reservedItem.variantIndex}`
                  : editionIdentity}
              </strong>
            </div>
            <div className="storefront-stat">
              <span>Buyer email</span>
              <strong>{checkout.checkout.reservation.buyerEmail}</strong>
            </div>
            <div className="storefront-stat">
              <span>Wallet</span>
              <strong>{formatWalletAddress(checkout.checkout.reservation.buyerWalletAddress)}</strong>
            </div>
            <div className="storefront-stat">
              <span>Reservation expires</span>
              <strong>{formatTimestamp(checkout.checkout.expiresAt)}</strong>
            </div>
            <div className="storefront-stat">
              <span>Completed at</span>
              <strong>{formatTimestamp(checkout.checkout.completedAt)}</strong>
            </div>
            <div className="storefront-stat">
              <span>Provider session</span>
              <strong>{checkout.checkout.providerSessionId ?? "N/A"}</strong>
            </div>
            <div className="storefront-stat">
              <span>Reservation status</span>
              <strong>{checkout.checkout.reservation.status}</strong>
            </div>
          </div>
        </article>

        <article className="storefront-panel storefront-checkout-trust">
          <span className="storefront-section-kicker">Release continuity</span>
          <h2>Claim context</h2>
          <p className="storefront-hero__lead">
            This checkpoint is part of the active collectible launch flow for{" "}
            <strong>{checkout.checkout.title}</strong> and remains tied to that release
            context.
          </p>
          <p className="storefront-checkout-trust-list">
            Use the route below to review the release details, remaining inventory,
            and related campaign information.
          </p>
          <Link
            className="storefront-button storefront-button--secondary"
            href={releasePath}
          >
            Back to release page
          </Link>
          <Link
            className="storefront-button storefront-button--ghost"
            href={`/brands/${brandSlug}`}
          >
            Back to brand landing
          </Link>
        </article>

        <article className="storefront-panel storefront-checkout-actions-panel">
          <span className="storefront-section-kicker">Collector action</span>
          <h2>{statusCopy.actionTitle}</h2>
          <p className="storefront-hero__lead">{statusCopy.actionSubtext}</p>
          <p className="storefront-checkout-action-copy">{actionCopy.providerLead}</p>
          {checkout.checkout.providerKind === "manual" ? (
            <CheckoutClient
              brandSlug={brandSlug}
              canCancel={canCancel}
              canComplete={canComplete}
              checkoutSessionId={checkoutSessionId}
              collectionSlug={collectionSlug}
            />
          ) : isStripeOpen ? (
            <div className="storefront-checkout-actions">
              <Link
                className="storefront-button storefront-button--primary"
                href={checkout.checkout.checkoutUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {actionCopy.buttonLabel}
              </Link>
              <Link
                className="storefront-button storefront-button--ghost"
                href={`/brands/${brandSlug}/collections/${collectionSlug}/checkout/${checkoutSessionId}`}
              >
                {actionCopy.secondaryLabel}
              </Link>
            </div>
          ) : (
            <Link
              className="storefront-button storefront-button--secondary"
              href={releasePath}
            >
              Start a fresh checkout
            </Link>
          )}
        </article>
      </section>
    </div>
  );
}
