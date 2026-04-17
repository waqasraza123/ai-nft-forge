import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import { ActionLink } from "@ai-nft-forge/ui";
import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  FloatingCollectibleCluster
} from "../../../../../../components/collectible-visuals";
import { createRuntimePublicCollectionService } from "../../../../../../server/collections/runtime";
import { createStorefrontThemeStyle } from "../../../../../../lib/ui/storefront-theme";
import { PurchasePanel } from "./purchase-panel";

type CollectionPageProps = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

type CollectionDeployment = {
  chain: {
    label: string;
    key: string;
    chainId: number;
  };
  contractAddress: string;
  deployedAt: string;
  deployTxHash: string;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatAddressShort(input: string | null) {
  if (!input) {
    return "Unavailable";
  }

  if (input.length <= 18) {
    return input;
  }

  return `${input.slice(0, 8)}...${input.slice(-6)}`;
}

function formatStatusLabel(status: "upcoming" | "live" | "sold_out" | "ended") {
  switch (status) {
    case "live":
      return "Live release";
    case "upcoming":
      return "Upcoming launch";
    case "sold_out":
      return "Sold out";
    case "ended":
    default:
      return "Archived release";
  }
}

function describeSupply(input: {
  storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
  remainingSupply: number | null;
  soldCount: number;
  totalSupply: number | null;
  priceLabel: string | null;
}) {
  if (input.storefrontStatus === "upcoming") {
    return input.priceLabel
      ? `Opening at price ${input.priceLabel}`
      : "Opening on schedule";
  }

  if (input.storefrontStatus === "ended") {
    return input.totalSupply
      ? `${input.soldCount.toString()} of ${input.totalSupply.toString()} claimed`
      : "Historic release";
  }

  if (input.storefrontStatus === "sold_out") {
    return input.totalSupply
      ? `Sold out — ${input.soldCount.toString()} claimed`
      : "Sold out";
  }

  if (input.totalSupply === null) {
    return input.priceLabel
      ? `Open now · ${input.priceLabel}`
      : "Open now — open edition";
  }

  return `${input.remainingSupply ?? 0} of ${formatCount(input.totalSupply)} remaining`;
}

function computeProofStats(input: {
  storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
  launchAt: string | null;
  endAt: string | null;
  totalSupply: number | null;
  remainingSupply: number | null;
  soldCount: number;
  activeDeployment: CollectionDeployment | null;
  availableEditionCount: number;
  activeReservationCount: number;
}) {
  return [
    { label: "Launch", value: formatTimestamp(input.launchAt) },
    { label: "End", value: formatTimestamp(input.endAt) },
    {
      label: "Supply",
      value:
        input.totalSupply === null
          ? "Open edition"
          : `${formatCount(input.totalSupply)} total`
    },
    {
      label: "Remaining",
      value:
        input.remainingSupply === null
          ? "Flexible"
          : `${formatCount(input.remainingSupply)} editions`
    },
    { label: "Claimed", value: `${formatCount(input.soldCount)} minted` },
    {
      label: "Reserve queue",
      value: `${formatCount(input.activeReservationCount)} held · ${formatCount(input.availableEditionCount)} open`
    },
    {
      label: "Minting state",
      value:
        input.storefrontStatus === "ended"
          ? "Closed"
          : input.storefrontStatus === "sold_out"
            ? "Sold out"
            : input.storefrontStatus === "live"
              ? "Live"
              : "Not yet live"
    },
    {
      label: "Chain proof",
      value: input.activeDeployment
        ? `${input.activeDeployment.chain.label} · ${formatAddressShort(input.activeDeployment.contractAddress)}`
        : "Not deployed"
    }
  ];
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
        {kicker}
      </p>
      <h2 className="text-2xl font-semibold font-[var(--font-display)]">
        {title}
      </h2>
    </div>
  );
}

function StorefrontChip({
  accent,
  children
}: {
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        accent
          ? "inline-flex items-center rounded-full border border-[color:var(--storefront-accent)]/45 bg-[color:var(--storefront-accent)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--storefront-accent)]"
          : "inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-2.5 py-1 text-xs text-[color:var(--storefront-muted)]"
      }
    >
      {children}
    </span>
  );
}

function CollectionHeroSection(input: {
  availabilityLabel: string;
  brandPath: string;
  brandThemeWordmark: string;
  description: string;
  featuredMessage: string;
  heroImageUrl: string | null;
  launchAt: string | null;
  primaryCtaHref: string | null;
  primaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  claimedCount: number;
  storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
  title: string;
  totalSupply: number | null;
  priceLabel: string | null;
}) {
  const fallbackCta =
    input.primaryCtaLabel && input.primaryCtaHref
      ? {
          label: input.primaryCtaLabel,
          href: input.primaryCtaHref
        }
      : input.storefrontStatus === "live"
        ? {
            label: "Reserve now",
            href: "#reserve"
          }
        : null;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <StorefrontChip accent>{input.featuredMessage}</StorefrontChip>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--storefront-muted)]">
          {input.brandPath}
        </p>
        <h1 className="text-3xl font-semibold leading-tight font-[var(--font-display)] md:text-5xl">
          {input.title}
        </h1>
        <p className="text-sm leading-7 text-[color:var(--storefront-muted)] md:text-base">
          {input.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {fallbackCta ? (
            <ActionLink href={fallbackCta.href} tone="action">
              {fallbackCta.label}
            </ActionLink>
          ) : null}
          {input.secondaryCtaLabel && input.secondaryCtaHref ? (
            <ActionLink href={input.secondaryCtaHref} tone="inline">
              {input.secondaryCtaLabel}
            </ActionLink>
          ) : null}
          <ActionLink href={input.brandPath} tone="inline">
            Back to brand release floor
          </ActionLink>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <StorefrontChip accent>Launch mode</StorefrontChip>
          <StorefrontChip>
            {input.storefrontStatus === "live"
              ? "Open"
              : input.storefrontStatus === "upcoming"
                ? "Queued"
                : input.storefrontStatus === "ended"
                  ? "Closed"
                  : "Sold out"}
          </StorefrontChip>
          {input.totalSupply ? (
            <StorefrontChip>
              {formatCount(input.totalSupply)} artworks
            </StorefrontChip>
          ) : null}
          {input.priceLabel ? (
            <StorefrontChip>{input.priceLabel}</StorefrontChip>
          ) : null}
          <StorefrontChip>
            {formatCount(input.claimedCount)} claimed
          </StorefrontChip>
        </div>
      </div>
      <CollectibleHeroArtwork
        accentVar="--storefront-accent"
        badge={
          input.storefrontStatus === "live"
            ? "Live mint window"
            : formatStatusLabel(input.storefrontStatus)
        }
        className="border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]"
        imageAlt={`${input.title} hero artwork`}
        imageUrl={input.heroImageUrl}
        meta={`${input.availabilityLabel} · ${formatTimestamp(input.launchAt)}`}
        title={input.brandThemeWordmark || input.title}
      />
    </section>
  );
}

function CollectionLaunchStory(input: {
  headline: string;
  lead: string;
  availabilityLabel: string;
  status: "upcoming" | "live" | "sold_out" | "ended";
  mintedTokenCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_0.8fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            Launch story
          </p>
          <h2 className="mt-1 text-2xl font-semibold font-[var(--font-display)]">
            {input.headline}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--storefront-muted)]">
            {input.lead}
          </p>
        </div>
        <article className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            Collector proof
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {formatStatusLabel(input.status)} runway
          </h3>
          <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
            {input.availabilityLabel} · {formatCount(input.mintedTokenCount)}{" "}
            minted proofs
          </p>
        </article>
      </div>
    </section>
  );
}

function launchLabel(
  launchAt: string | null,
  status: "upcoming" | "live" | "sold_out" | "ended"
) {
  if (status === "upcoming") {
    return `Starts ${formatTimestamp(launchAt)}`;
  }

  if (status === "ended") {
    return "Window complete";
  }

  return `Launched ${formatTimestamp(launchAt)}`;
}

function CollectionProofPanel(input: {
  activeDeployment: CollectionDeployment | null;
  launchAt: string | null;
  endAt: string | null;
  storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
  totalSupply: number | null;
  remainingSupply: number | null;
  soldCount: number;
  priceLabel: string | null;
  availableEditionCount: number;
  activeReservationCount: number;
}) {
  const proofs = computeProofStats(input);

  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <SectionHeader
        kicker="Collector proof"
        title="Drop ledger and launch telemetry"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {proofs.map((proof) => (
          <article
            className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4"
            key={proof.label}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
              {proof.label}
            </span>
            <strong className="mt-1 block text-sm text-[color:var(--storefront-text)]">
              {proof.value}
            </strong>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm leading-7 text-[color:var(--storefront-muted)]">
        {input.storefrontStatus === "upcoming"
          ? describeSupply(input)
          : `${describeSupply(input)}. ${input.activeDeployment ? `Deployed contract on ${input.activeDeployment.chain.label}.` : "No onchain deployment recorded yet."}`}
      </p>
      <p className="mt-2 text-xs text-[color:var(--storefront-accent)]">
        Launch timing: {launchLabel(input.launchAt, input.storefrontStatus)} ·
        Ends {formatTimestamp(input.endAt)}
      </p>
    </section>
  );
}

function linkClass(): "inline" {
  return "inline";
}

function CollectionReserveZone(input: {
  activeReservationCount: number;
  availableEditionCount: number;
  brandSlug: string;
  checkoutAvailabilityReason:
    | "collection_not_live"
    | "no_available_editions"
    | "pricing_incomplete"
    | "provider_disabled"
    | null;
  checkoutEnabled: boolean;
  collectionSlug: string;
  nextAvailableEditionNumber: number | null;
  priceLabel: string | null;
  providerMode: "disabled" | "manual" | "stripe";
  availabilityLabel: string;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          kicker="Reserve module"
          title="Secure your edition before it sells out"
        />
        <div className="flex flex-wrap gap-2">
          <StorefrontChip accent>{input.availabilityLabel}</StorefrontChip>
          <StorefrontChip>Reserve-ready</StorefrontChip>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <PurchasePanel
          activeReservationCount={input.activeReservationCount}
          availableEditionCount={input.availableEditionCount}
          brandSlug={input.brandSlug}
          checkoutAvailabilityReason={input.checkoutAvailabilityReason}
          checkoutEnabled={input.checkoutEnabled}
          collectionSlug={input.collectionSlug}
          nextAvailableEditionNumber={input.nextAvailableEditionNumber}
          priceLabel={input.priceLabel}
          providerMode={input.providerMode}
        />
        <article className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            Reserve trust
          </p>
          <h3 className="mt-2 text-xl font-semibold">Trust before checkout</h3>
          <div className="my-4">
            <CollectiblePreviewCard
              accentVar="--storefront-accent"
              badge="Reserve-ready"
              className="bg-transparent p-0 shadow-none"
              imageAlt="Reserve module collectible frame"
              meta={`${formatCount(input.availableEditionCount)} open editions`}
              subtitle={input.priceLabel ?? "Transparent checkout state"}
              title="Collector checkout module"
            />
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--storefront-muted)]">
            <li>Reservations are time-bound and consumed at checkout.</li>
            <li>
              Availability is sourced from immutable published snapshot state.
            </li>
            <li>
              Provider state and launch timing remain explicit in this route.
            </li>
            <li>
              Onchain deployment status is presented as transparent proof.
            </li>
          </ul>
          {input.providerMode === "stripe" ? (
            <p className="mt-3 text-xs text-[color:var(--storefront-accent)]">
              Stripe-powered checkout available for active reservations.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function CollectionGallery(input: {
  title: string;
  items: Array<{
    generatedAssetId: string;
    imageUrl: string;
    pipelineKey: string;
    position: number;
    sourceAssetOriginalFilename: string;
    variantIndex: number;
  }>;
}) {
  if (input.items.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
        <SectionHeader
          kicker="Gallery wall"
          title={`Gallery waiting for published variants for ${input.title}`}
        />
        <p className="text-sm text-[color:var(--storefront-muted)]">
          No artwork has been published for this release yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <SectionHeader kicker="Gallery wall" title="Curated collectible set" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {input.items.map((item) => (
          <div
            className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-3 shadow-[0_18px_45px_rgba(2,6,23,0.22)]"
            key={item.generatedAssetId}
          >
            <CollectiblePreviewCard
              accentVar="--storefront-accent"
              badge={`Edition ${item.position}`}
              className="bg-transparent p-0 shadow-none"
              imageAlt={`${input.title} edition ${item.position}`}
              imageUrl={item.imageUrl}
              meta={`Variant ${item.variantIndex} · ${item.pipelineKey}`}
              subtitle={item.sourceAssetOriginalFilename}
              title={input.title}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectionTechnicalSection(input: {
  activeDeployment: CollectionDeployment | null;
  collectionSlug: string;
  brandSlug: string;
  metadataPath: string;
  contractPath: string;
  firstEdition: {
    position: number;
  } | null;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <SectionHeader
        kicker="Technical proof"
        title="Manifest and contract references"
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs text-[color:var(--storefront-muted)]">
            Deployment record
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {input.activeDeployment ? "Deployed" : "Not deployed"}
          </h3>
          {input.activeDeployment ? (
            <div className="mt-3 space-y-1 text-sm text-[color:var(--storefront-muted)]">
              <p>Chain {input.activeDeployment.chain.label}</p>
              <p>
                {formatAddressShort(input.activeDeployment.contractAddress)}
              </p>
              <p>{formatAddressShort(input.activeDeployment.deployTxHash)}</p>
              <p>{formatTimestamp(input.activeDeployment.deployedAt)}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
              This collection has no recorded chain deployment yet.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs text-[color:var(--storefront-muted)]">
            Publication manifest
          </p>
          <h3 className="mt-2 text-xl font-semibold">Public metadata</h3>
          <div className="mt-3 flex flex-col gap-2">
            <ActionLink
              href={input.metadataPath}
              tone={linkClass()}
              target="_blank"
            >
              Collection metadata JSON
            </ActionLink>
            <ActionLink
              href={input.contractPath}
              tone={linkClass()}
              target="_blank"
            >
              Contract manifest
            </ActionLink>
          </div>
        </article>

        <article className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs text-[color:var(--storefront-muted)]">
            Token URI reference
          </p>
          <h3 className="mt-2 text-xl font-semibold">Edition example</h3>
          {input.firstEdition ? (
            <div className="mt-3 flex flex-col gap-2">
              <ActionLink
                href={`${input.metadataPath}/${input.firstEdition.position}`}
                tone={linkClass()}
                target="_blank"
              >
                Metadata #{input.firstEdition.position}
              </ActionLink>
              <ActionLink
                href={createCollectionTokenUriPath({
                  brandSlug: input.brandSlug,
                  collectionSlug: input.collectionSlug,
                  tokenId: input.firstEdition.position
                })}
                tone={linkClass()}
                target="_blank"
              >
                Token URI sample #{input.firstEdition.position}
              </ActionLink>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
              Add editions to generate sample token URI references.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

function CollectionRelatedSection(input: {
  relatedCollections: Array<{
    publicPath: string;
    storefrontStatus: "upcoming" | "live" | "sold_out" | "ended";
    title: string;
    collectionSlug: string;
  }>;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-5">
      <SectionHeader kicker="Related drops" title="Connected brand releases" />
      {input.relatedCollections.length === 0 ? (
        <p className="text-sm text-[color:var(--storefront-muted)]">
          This brand has no other released drops yet.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {input.relatedCollections.map((related) => (
            <Link
              className="rounded-2xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4 transition hover:translate-y-[-2px] hover:border-[color:var(--storefront-accent)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.06)]"
              href={related.publicPath}
              key={related.publicPath}
            >
              <StorefrontChip accent>
                {formatStatusLabel(related.storefrontStatus)}
              </StorefrontChip>
              <h3 className="mt-2 text-lg font-semibold">{related.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--storefront-muted)]">
                Collection {related.collectionSlug}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function buildCollectionMetadataPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}/metadata`;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { brandSlug, collectionSlug } = await params;
  const result =
    await createRuntimePublicCollectionService().getPublicCollectionBySlugs({
      brandSlug,
      collectionSlug
    });

  if (!result) {
    notFound();
  }

  const { collection } = result;
  const metadataPath = buildCollectionMetadataPath({
    brandSlug: collection.brandSlug,
    collectionSlug: collection.collectionSlug
  });
  const contractPath = createCollectionContractPath({
    brandSlug: collection.brandSlug,
    collectionSlug: collection.collectionSlug
  });
  const firstEdition = collection.items[0] ?? null;
  const heroHeadline =
    collection.storefrontHeadline ?? `${collection.title} drop release`;
  const launchStory =
    collection.storefrontBody ??
    collection.description ??
    "This release surface is resolved directly from the immutable published collection snapshot and includes snapshot-backed proof references for public verification.";

  return (
    <div
      className="min-h-screen bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]"
      style={createStorefrontThemeStyle(collection.brandTheme)}
    >
      <div className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.14),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.08),transparent_22%)]" />
        <CollectionHeroSection
          availabilityLabel={collection.availabilityLabel}
          brandPath={collection.brandPublicPath}
          brandThemeWordmark={
            collection.brandTheme.wordmark ?? collection.brandName
          }
          description={launchStory}
          featuredMessage={collection.brandTheme.featuredReleaseLabel}
          heroImageUrl={collection.heroImageUrl}
          launchAt={collection.launchAt}
          primaryCtaHref={collection.primaryCtaHref}
          primaryCtaLabel={collection.primaryCtaLabel}
          secondaryCtaHref={collection.secondaryCtaHref}
          secondaryCtaLabel={collection.secondaryCtaLabel}
          claimedCount={collection.soldCount}
          storefrontStatus={collection.storefrontStatus}
          title={heroHeadline}
          totalSupply={collection.totalSupply}
          priceLabel={collection.priceLabel}
        />

        <FloatingCollectibleCluster
          accentVar="--storefront-accent"
          headline="Each release page should feel staged like a premium collectible debut."
          items={["Hero frame", "Collector proof", "Reserve shell"]}
          label="Release composition"
        />

        <CollectibleEditorialBand accentVar="--storefront-accent">
          <CollectionLaunchStory
            availabilityLabel={collection.availabilityLabel}
            headline={heroHeadline}
            lead={launchStory}
            mintedTokenCount={collection.mintedTokenCount}
            status={collection.storefrontStatus}
          />
        </CollectibleEditorialBand>

        <CollectionProofPanel
          activeDeployment={collection.activeDeployment}
          launchAt={collection.launchAt}
          endAt={collection.endAt}
          storefrontStatus={collection.storefrontStatus}
          totalSupply={collection.totalSupply}
          remainingSupply={collection.remainingSupply}
          priceLabel={collection.priceLabel}
          soldCount={collection.soldCount}
          availableEditionCount={collection.commerce.availableEditionCount}
          activeReservationCount={collection.commerce.activeReservationCount}
        />

        <CollectionReserveZone
          activeReservationCount={collection.commerce.activeReservationCount}
          availableEditionCount={collection.commerce.availableEditionCount}
          brandSlug={collection.brandSlug}
          checkoutAvailabilityReason={
            collection.commerce.checkoutAvailabilityReason
          }
          checkoutEnabled={collection.commerce.checkoutEnabled}
          collectionSlug={collection.collectionSlug}
          nextAvailableEditionNumber={
            collection.commerce.nextAvailableEditionNumber
          }
          priceLabel={collection.priceLabel}
          providerMode={collection.commerce.providerMode}
          availabilityLabel={collection.availabilityLabel}
        />

        <CollectibleEditorialBand accentVar="--storefront-accent">
          <CollectionGallery
            items={collection.items}
            title={collection.title}
          />
        </CollectibleEditorialBand>

        <CollectionTechnicalSection
          activeDeployment={collection.activeDeployment}
          collectionSlug={collection.collectionSlug}
          brandSlug={collection.brandSlug}
          metadataPath={metadataPath}
          contractPath={contractPath}
          firstEdition={firstEdition}
        />

        <CollectionRelatedSection
          relatedCollections={collection.relatedCollections}
        />
      </div>
    </div>
  );
}
