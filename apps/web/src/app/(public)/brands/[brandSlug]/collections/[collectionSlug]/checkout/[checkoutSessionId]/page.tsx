import { notFound } from "next/navigation";

import { createRuntimeCollectionCommerceService } from "../../../../../../../../server/commerce/runtime";
import { createRuntimePublicCollectionService } from "../../../../../../../../server/collections/runtime";
import {
  createStorefrontThemeStyle,
  resolveStorefrontThemeClasses
} from "../../../../../../../../lib/ui/storefront-theme";
import {
  CollectibleEditorialBand,
  CollectiblePreviewCard
} from "../../../../../../../../components/collectible-visuals";
import { ActionLink, ActionRow, Pill, cn } from "@ai-nft-forge/ui";

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
type CheckoutStatusTone = "success" | "warning" | "danger";
type CheckoutStatusVisual = {
  tone: CheckoutStatusTone;
  label: string;
};

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
    actionSubtext:
      "Press forward to finish the checkout flow and mint this edition.",
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

function statusToneClass(status: CheckoutStatus): CheckoutStatusVisual {
  if (status === "open") {
    return {
      tone: "success",
      label: "Checkout open"
    };
  }

  if (status === "completed") {
    return {
      tone: "success",
      label: "Completed"
    };
  }

  if (status === "expired") {
    return {
      tone: "warning",
      label: "Expired"
    };
  }

  return {
    tone: "danger",
    label: "Canceled"
  };
}

const storefrontAccentPillClass =
  "border-[color:var(--storefront-accent)]/45 bg-[color:var(--storefront-accent)]/15 text-[color:var(--storefront-accent)]";
const storefrontNeutralPillClass =
  "border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] text-[color:var(--storefront-muted)]";

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
  const statusProviderCopy = providerModeCopy[checkout.checkout.providerKind];
  const statusVisual = statusToneClass(checkout.checkout.status);
  const actionCopy = buildActionCopy({
    isStripeOpen,
    providerMode: checkout.checkout.providerKind,
    status: checkout.checkout.status
  });
  const checkoutLead = statusCopy.heroLead;

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]",
        resolveStorefrontThemeClasses(collection.collection.brandTheme)
      )}
      style={createStorefrontThemeStyle(collection.collection.brandTheme)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-[-14rem] mx-auto h-[22rem] w-[64rem] rounded-full bg-[color:var(--storefront-accent)]/10 blur-[120px]" />
      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <CollectibleEditorialBand
            accentVar="--storefront-accent"
            className="rounded-[2rem] border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-6 shadow-[0_24px_65px_rgba(15,23,42,0.22)]"
          >
            <ActionRow compact className="mb-3">
              <Pill tone={statusVisual.tone}>{statusVisual.label}</Pill>
              <Pill className={storefrontAccentPillClass}>
                {statusProviderCopy.shortTitle}
              </Pill>
              <Pill className={storefrontNeutralPillClass}>
                Live storefront
              </Pill>
            </ActionRow>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--storefront-accent)]">
                  Hosted checkout session
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight font-[var(--font-display)]">
                  {checkout.checkout.title}
                </h1>
                <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
                  {editionIdentity}
                </p>
                <p className="text-sm leading-7 text-[color:var(--storefront-muted)]">
                  {checkoutLead}
                </p>
                <ActionRow compact>
                  {checkout.checkout.priceLabel ? (
                    <Pill className={storefrontAccentPillClass}>
                      {checkout.checkout.priceLabel}
                    </Pill>
                  ) : null}
                  <Pill className={storefrontNeutralPillClass}>
                    {statusProviderCopy.title}
                  </Pill>
                </ActionRow>
              </div>
              <CollectiblePreviewCard
                accentVar="--storefront-accent"
                badge={statusVisual.label}
                imageAlt={`${checkout.checkout.title} ${editionIdentity}`}
                imageUrl={reservedItem?.imageUrl}
                meta={`${statusVisual.label} · ${statusProviderCopy.shortTitle}`}
                subtitle={editionIdentity}
                title={checkout.checkout.title}
              />
            </div>
          </CollectibleEditorialBand>
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
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Checkout status
                  </span>
                  <strong>
                    {formatCheckoutStatus(checkout.checkout.status)}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Reserved edition
                  </span>
                  <strong>
                    {reservedItem?.sourceAssetOriginalFilename
                      ? `${reservedItem.sourceAssetOriginalFilename} · v${reservedItem.variantIndex}`
                      : editionIdentity}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Buyer email
                  </span>
                  <strong>{checkout.checkout.reservation.buyerEmail}</strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Wallet
                  </span>
                  <strong>
                    {formatWalletAddress(
                      checkout.checkout.reservation.buyerWalletAddress
                    )}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Reservation expires
                  </span>
                  <strong>
                    {formatTimestamp(checkout.checkout.expiresAt)}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Completed at
                  </span>
                  <strong>
                    {formatTimestamp(checkout.checkout.completedAt)}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Provider session
                  </span>
                  <strong>
                    {checkout.checkout.providerSessionId ?? "N/A"}
                  </strong>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-[color:var(--storefront-muted)]">
                    Reservation status
                  </span>
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
              <ActionRow className="mt-4">
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
                    <ActionLink
                      className={storefrontAccentPillClass}
                      href={checkout.checkout.checkoutUrl}
                    >
                      {actionCopy.buttonLabel}
                    </ActionLink>
                    <ActionLink
                      className="border border-[color:var(--storefront-border)] bg-transparent px-4 py-2 text-sm font-semibold text-[color:var(--storefront-text)]"
                      href={`/brands/${brandSlug}/collections/${collectionSlug}/checkout/${checkoutSessionId}`}
                    >
                      {actionCopy.secondaryLabel}
                    </ActionLink>
                  </>
                ) : (
                  <ActionLink
                    className="border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-4 py-2 text-sm font-semibold text-[color:var(--storefront-text)]"
                    href={releasePath}
                  >
                    Start a fresh checkout
                  </ActionLink>
                )}
              </ActionRow>
            </article>
            <article className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
                Release continuity
              </p>
              <h2 className="text-xl font-semibold">Claim context</h2>
              <p className="text-sm leading-7 text-[color:var(--storefront-muted)]">
                This checkpoint is part of the active collectible launch flow
                for <strong>{checkout.checkout.title}</strong> and remains tied
                to that release context.
              </p>
              <p className="text-sm text-[color:var(--storefront-muted)]">
                Use the links below to review release details and related
                campaigns.
              </p>
              <ActionRow compact>
                <ActionLink
                  className={storefrontAccentPillClass}
                  href={releasePath}
                >
                  Back to release page
                </ActionLink>
                <ActionLink
                  className="border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-4 py-2 text-sm font-semibold text-[color:var(--storefront-text)]"
                  href={`/brands/${brandSlug}`}
                >
                  Back to brand landing
                </ActionLink>
              </ActionRow>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
