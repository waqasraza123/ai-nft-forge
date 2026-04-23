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
import {
  ActionRow,
  Pill,
  StorefrontActionLink,
  StorefrontMetaGrid,
  StorefrontMetaItem,
  StorefrontPanel,
  StorefrontPill,
  StorefrontSectionHeading,
  cn
} from "@ai-nft-forge/ui";

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
              <StorefrontPill tone="accent">
                {statusProviderCopy.shortTitle}
              </StorefrontPill>
              <StorefrontPill>Live storefront</StorefrontPill>
            </ActionRow>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div className="space-y-4">
                <StorefrontSectionHeading
                  eyebrow="Hosted checkout session"
                  title={checkout.checkout.title}
                />
                <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
                  {editionIdentity}
                </p>
                <p className="text-sm leading-7 text-[color:var(--storefront-muted)]">
                  {checkoutLead}
                </p>
                <ActionRow compact>
                  {checkout.checkout.priceLabel ? (
                    <StorefrontPill tone="accent">
                      {checkout.checkout.priceLabel}
                    </StorefrontPill>
                  ) : null}
                  <StorefrontPill>{statusProviderCopy.title}</StorefrontPill>
                </ActionRow>
              </div>
              <CollectiblePreviewCard
                accentVar="--storefront-accent"
                badge={statusVisual.label}
                fallbackIndex={5}
                imageAlt={`${checkout.checkout.title} ${editionIdentity}`}
                imageUrl={reservedItem?.imageUrl}
                meta={`${statusVisual.label} · ${statusProviderCopy.shortTitle}`}
                subtitle={editionIdentity}
                title={checkout.checkout.title}
              />
            </div>
          </CollectibleEditorialBand>
          <div className="grid gap-4 self-start">
            <StorefrontPanel
              as="article"
              className="bg-[color:var(--storefront-panel)]/70"
            >
              <StorefrontSectionHeading
                eyebrow="Reservation summary"
                title="Collector checkpoint"
              />
              <StorefrontMetaGrid className="mt-3">
                <StorefrontMetaItem
                  label="Checkout status"
                  value={formatCheckoutStatus(checkout.checkout.status)}
                />
                <StorefrontMetaItem
                  label="Reserved edition"
                  value={
                    reservedItem?.sourceAssetOriginalFilename
                      ? `${reservedItem.sourceAssetOriginalFilename} · v${reservedItem.variantIndex}`
                      : editionIdentity
                  }
                />
                <StorefrontMetaItem
                  label="Buyer email"
                  value={checkout.checkout.reservation.buyerEmail}
                />
                <StorefrontMetaItem
                  label="Wallet"
                  value={formatWalletAddress(
                    checkout.checkout.reservation.buyerWalletAddress
                  )}
                />
                <StorefrontMetaItem
                  label="Reservation expires"
                  value={formatTimestamp(checkout.checkout.expiresAt)}
                />
                <StorefrontMetaItem
                  label="Completed at"
                  value={formatTimestamp(checkout.checkout.completedAt)}
                />
                <StorefrontMetaItem
                  label="Provider session"
                  value={checkout.checkout.providerSessionId ?? "N/A"}
                />
                <StorefrontMetaItem
                  label="Reservation status"
                  value={checkout.checkout.reservation.status}
                />
              </StorefrontMetaGrid>
            </StorefrontPanel>
            <StorefrontPanel
              as="article"
              className="bg-[color:var(--storefront-panel)]/70"
            >
              <StorefrontSectionHeading
                eyebrow="Collector action"
                lead={statusCopy.actionSubtext}
                title={statusCopy.actionTitle}
              />
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
                    <StorefrontActionLink href={checkout.checkout.checkoutUrl}>
                      {actionCopy.buttonLabel}
                    </StorefrontActionLink>
                    <StorefrontActionLink
                      tone="secondary"
                      href={`/brands/${brandSlug}/collections/${collectionSlug}/checkout/${checkoutSessionId}`}
                    >
                      {actionCopy.secondaryLabel}
                    </StorefrontActionLink>
                  </>
                ) : (
                  <StorefrontActionLink tone="secondary" href={releasePath}>
                    Start a fresh checkout
                  </StorefrontActionLink>
                )}
              </ActionRow>
            </StorefrontPanel>
            <StorefrontPanel
              as="article"
              className="space-y-2 bg-[color:var(--storefront-panel)]/70"
            >
              <StorefrontSectionHeading
                eyebrow="Release continuity"
                title="Claim context"
              />
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
                <StorefrontActionLink href={releasePath}>
                  Back to release page
                </StorefrontActionLink>
                <StorefrontActionLink
                  tone="secondary"
                  href={`/brands/${brandSlug}`}
                >
                  Back to brand landing
                </StorefrontActionLink>
              </ActionRow>
            </StorefrontPanel>
          </div>
        </section>
      </main>
    </div>
  );
}
