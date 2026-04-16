import Link from "next/link";
import { notFound } from "next/navigation";

import { createRuntimeCollectionCommerceService } from "../../../../../../../../server/commerce/runtime";
import { createRuntimePublicCollectionService } from "../../../../../../../../server/collections/runtime";
import { createStorefrontThemeStyle } from "../../../../../../../../lib/ui/storefront-theme";

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
    actionSubtext: "This checkout has already been completed. No additional action is required.",
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
        "Stripe is handling this payment step. Continue to hosted checkout to finalize.",
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

function statusToneClass(status: CheckoutStatus) {
  if (status === "open") {
    return "border-emerald-400/45 bg-emerald-400/12 text-emerald-100";
  }

  if (status === "completed") {
    return "border-emerald-400/45 bg-emerald-400/12 text-emerald-100";
  }

  if (status === "expired") {
    return "border-amber-400/45 bg-amber-400/12 text-amber-100";
  }

  return "border-rose-400/45 bg-rose-400/12 text-rose-100";
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
    (checkout.checkout.status === "open" || checkout.checkout.status === "expired");
  const isStripeOpen =
    checkout.checkout.providerKind === "stripe" &&
    checkout.checkout.status === "open";
  const statusCopy = checkoutStatusCopy[checkout.checkout.status];
  const statusProviderCopy = providerModeCopy[checkout.checkout.providerKind];
  const actionCopy = buildActionCopy({
    isStripeOpen,
    providerMode: checkout.checkout.providerKind,
    status: checkout.checkout.status
  });
  const checkoutLead = statusCopy.heroLead;

  return (
    <div
      className="min-h-screen bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]"
      style={createStorefrontThemeStyle(collection.collection.brandTheme)}
    >
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusToneClass(checkout.checkout.status)} uppercase`}
              >
                {formatCheckoutStatus(checkout.checkout.status)}
              </span>
              <span className="rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-3 py-1 text-xs text-[color:var(--storefront-muted)]">
                {statusProviderCopy.shortTitle}
              </span>
              <span className="rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-3 py-1 text-xs text-[color:var(--storefront-muted)]">
                Live storefront
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--storefront-accent)]">
              Hosted checkout session
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight font-[var(--font-display)]">
              {checkout.checkout.title}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
              {editionIdentity}
            </p>
            {reservedItem ? (
              <img
                alt={`${checkout.checkout.title} ${editionIdentity}`}
                className="mt-5 h-auto w-full rounded-2xl border border-[color:var(--storefront-border)] object-cover"
                src={reservedItem.imageUrl}
              />
            ) : (
              <div className="mt-5 flex h-64 items-center justify-center rounded-2xl border border-dashed border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-4 text-sm text-[color:var(--storefront-muted)]">
                Reserved artwork preview is unavailable.
              </div>
            )}
            <p className="mt-5 text-sm leading-7 text-[color:var(--storefront-muted)]">
              {checkoutLead}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {checkout.checkout.priceLabel ? (
                <span className="inline-flex items-center rounded-full border border-[color:var(--storefront-accent)]/45 bg-[color:var(--storefront-accent)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--storefront-accent)]">
                  {checkout.checkout.priceLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-3 py-1 text-xs text-[color:var(--storefront-muted)]">
                {statusProviderCopy.title}
              </span>
            </div>
          </article>

          <div className="grid gap-4 self-start">
            <article className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
                Reservation summary
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Collector checkpoint
              </h2>
              <div className="mt-3 space-y-3 text-sm">
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Checkout status</span>
                  <strong>{formatCheckoutStatus(checkout.checkout.status)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Reserved edition</span>
                  <strong>
                    {reservedItem?.sourceAssetOriginalFilename
                      ? `${reservedItem.sourceAssetOriginalFilename} · v${reservedItem.variantIndex}`
                      : editionIdentity}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Buyer email</span>
                  <strong>{checkout.checkout.reservation.buyerEmail}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Wallet</span>
                  <strong>{formatWalletAddress(checkout.checkout.reservation.buyerWalletAddress)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Reservation expires</span>
                  <strong>{formatTimestamp(checkout.checkout.expiresAt)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Completed at</span>
                  <strong>{formatTimestamp(checkout.checkout.completedAt)}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Provider session</span>
                  <strong>{checkout.checkout.providerSessionId ?? "N/A"}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">Reservation status</span>
                  <strong>{checkout.checkout.reservation.status}</strong>
                </div>
              </div>
            </article>
            <article className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
                Collector action
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {statusCopy.actionTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--storefront-muted)]">
                {statusCopy.actionSubtext}
              </p>
              <p className="mt-2 text-sm text-[color:var(--storefront-text)]">
                {actionCopy.providerLead}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {checkout.checkout.providerKind === "manual" ? (
                  <CheckoutClient
                    brandSlug={brandSlug}
                    canCancel={canCancel}
                    canComplete={canComplete}
                    checkoutSessionId={checkoutSessionId}
                    collectionSlug={collectionSlug}
                  />
                ) : isStripeOpen ? (
                  <>
                    <Link
                      className="inline-flex items-center rounded-full border border-[color:var(--storefront-accent)] bg-[color:var(--storefront-accent)]/15 px-4 py-2 text-sm font-semibold text-[color:var(--storefront-accent)]"
                      href={checkout.checkout.checkoutUrl}
                    >
                      {actionCopy.buttonLabel}
                    </Link>
                    <Link
                      className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-transparent px-4 py-2 text-sm font-semibold"
                      href={`/brands/${brandSlug}/collections/${collectionSlug}/checkout/${checkoutSessionId}`}
                    >
                      {actionCopy.secondaryLabel}
                    </Link>
                  </>
                ) : (
                  <Link
                    className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-4 py-2 text-sm font-semibold"
                    href={releasePath}
                  >
                    Start a fresh checkout
                  </Link>
                )}
              </div>
            </article>
            <article className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
                Release continuity
              </p>
              <h2 className="text-xl font-semibold">
                Claim context
              </h2>
              <p className="text-sm leading-7 text-[color:var(--storefront-muted)]">
                This checkpoint is part of the active collectible launch flow for{" "}
                <strong>{checkout.checkout.title}</strong> and remains tied to that
                release context.
              </p>
              <p className="text-sm text-[color:var(--storefront-muted)]">
                Use the links below to review release details and related campaigns.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex items-center rounded-full border border-[color:var(--storefront-accent)]/45 bg-[color:var(--storefront-accent)]/15 px-4 py-2 text-sm font-semibold text-[color:var(--storefront-accent)]"
                  href={releasePath}
                >
                  Back to release page
                </Link>
                <Link
                  className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-4 py-2 text-sm font-semibold"
                  href={`/brands/${brandSlug}`}
                >
                  Back to brand landing
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
