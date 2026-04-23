import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import {
  ActionRow,
  StorefrontActionLink,
  StorefrontPanel,
  StorefrontPill,
  StorefrontSectionHeading,
  StorefrontTile,
  cn
} from "@ai-nft-forge/ui";
import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  CollectibleGalleryRail
} from "../../../../../../components/collectible-visuals";
import { createRuntimePublicCollectionService } from "../../../../../../server/collections/runtime";
import {
  createStorefrontThemeStyle,
  resolveStorefrontThemeClasses
} from "../../../../../../lib/ui/storefront-theme";
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
        <StorefrontPill tone="accent">{input.featuredMessage}</StorefrontPill>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--storefront-muted)]">
          {input.brandPath}
        </p>
        <h1 className="text-3xl font-semibold leading-tight font-[var(--font-display)] md:text-5xl">
          {input.title}
        </h1>
        <p className="text-sm leading-7 text-[color:var(--storefront-muted)] md:text-base">
          {input.description}
        </p>
        <ActionRow compact>
          {fallbackCta ? (
            <StorefrontActionLink href={fallbackCta.href}>
              {fallbackCta.label}
            </StorefrontActionLink>
          ) : null}
          {input.secondaryCtaLabel && input.secondaryCtaHref ? (
            <StorefrontActionLink href={input.secondaryCtaHref} tone="inline">
              {input.secondaryCtaLabel}
            </StorefrontActionLink>
          ) : null}
          <StorefrontActionLink href={input.brandPath} tone="inline">
            Back to brand release floor
          </StorefrontActionLink>
        </ActionRow>
        <dl className="grid gap-3 border-t border-[color:var(--storefront-border)]/80 pt-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
              Launch mode
            </dt>
            <dd className="text-sm text-[color:var(--storefront-text)]">
              {input.storefrontStatus === "live"
                ? "Open"
                : input.storefrontStatus === "upcoming"
                  ? "Queued"
                  : input.storefrontStatus === "ended"
                    ? "Closed"
                    : "Sold out"}
            </dd>
          </div>
          {input.totalSupply ? (
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
                Supply
              </dt>
              <dd className="text-sm text-[color:var(--storefront-text)]">
                {formatCount(input.totalSupply)} artworks
              </dd>
            </div>
          ) : null}
          {input.priceLabel ? (
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
                Price
              </dt>
              <dd className="text-sm text-[color:var(--storefront-text)]">
                {input.priceLabel}
              </dd>
            </div>
          ) : null}
          <div className="grid gap-1">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
              Claimed
            </dt>
            <dd className="text-sm text-[color:var(--storefront-text)]">
              {formatCount(input.claimedCount)} claimed
            </dd>
          </div>
        </dl>
      </div>
      <CollectibleHeroArtwork
        accentVar="--storefront-accent"
        badge={
          input.storefrontStatus === "live"
            ? "Live mint window"
            : formatStatusLabel(input.storefrontStatus)
        }
        className="border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]"
        details={[
          { label: "Availability", value: input.availabilityLabel },
          { label: "Launch timing", value: formatTimestamp(input.launchAt) },
          {
            label: "Collector posture",
            value:
              input.storefrontStatus === "live"
                ? "Reserve and mint activity are open with snapshot-backed proof."
                : input.storefrontStatus === "upcoming"
                  ? "Launch proof is staged before the public window opens."
                  : "The release remains viewable as a verified public record."
          }
        ]}
        fallbackIndex={6}
        imageAlt={`${input.title} hero artwork`}
        imageUrl={input.heroImageUrl}
        meta="Hero release"
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
    <StorefrontPanel tone="soft">
      <StorefrontSectionHeading
        eyebrow="Editorial story"
        lead={input.lead}
        title={input.headline}
      />
      <div className="mt-5 grid gap-3 border-t border-[color:var(--storefront-border)]/80 pt-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
            Collector proof
          </p>
          <p className="text-sm text-[color:var(--storefront-text)]">
            {formatStatusLabel(input.status)} runway
          </p>
        </div>
        <div className="grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
            Snapshot state
          </p>
          <p className="text-sm text-[color:var(--storefront-text)]">
            {input.availabilityLabel} · {formatCount(input.mintedTokenCount)}{" "}
            minted proofs
          </p>
        </div>
      </div>
    </StorefrontPanel>
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
    <StorefrontPanel tone="soft">
      <StorefrontSectionHeading
        eyebrow="Collector proof"
        title="Release ledger and launch telemetry"
      />
      <dl className="mt-5 grid gap-4 border-t border-[color:var(--storefront-border)]/80 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {proofs.map((proof) => (
          <div className="grid gap-1" key={proof.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
              {proof.label}
            </dt>
            <dd className="text-sm text-[color:var(--storefront-text)]">
              {proof.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm leading-7 text-[color:var(--storefront-muted)]">
        {input.storefrontStatus === "upcoming"
          ? describeSupply(input)
          : `${describeSupply(input)}. ${input.activeDeployment ? `Deployed contract on ${input.activeDeployment.chain.label}.` : "No onchain deployment recorded yet."}`}
      </p>
      <p className="mt-2 text-xs text-[color:var(--storefront-accent)]">
        Launch timing: {launchLabel(input.launchAt, input.storefrontStatus)} ·
        Ends {formatTimestamp(input.endAt)}
      </p>
    </StorefrontPanel>
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
    <StorefrontPanel tone="soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <StorefrontSectionHeading
          eyebrow="Reserve module"
          title="Secure your edition before it sells out"
        />
        <ActionRow compact>
          <StorefrontPill tone="accent">
            {input.availabilityLabel}
          </StorefrontPill>
          <StorefrontPill>Reserve-ready</StorefrontPill>
        </ActionRow>
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
        <StorefrontTile className="p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            Reserve trust
          </p>
          <h3 className="mt-2 text-xl font-semibold">Trust before checkout</h3>
          <div className="my-4">
            <CollectiblePreviewCard
              accentVar="--storefront-accent"
              badge="Reserve-ready"
              className="bg-transparent p-0 shadow-none"
              fallbackIndex={7}
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
        </StorefrontTile>
      </div>
    </StorefrontPanel>
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
      <CollectibleGalleryRail
        accentVar="--storefront-accent"
        headline="Gallery wall"
        summary={`Gallery waiting for published variants for ${input.title}`}
      >
        <StorefrontSectionHeading
          eyebrow="Gallery wall"
          title={`Gallery waiting for published variants for ${input.title}`}
        />
        <p className="text-sm text-[color:var(--storefront-muted)]">
          No artwork has been published for this release yet.
        </p>
      </CollectibleGalleryRail>
    );
  }

  return (
    <CollectibleGalleryRail
      accentVar="--storefront-accent"
      headline="Curated collectible set"
      summary={`${input.items.length} collectible variants`}
    >
      <StorefrontSectionHeading
        eyebrow="Gallery wall"
        title="Curated collectible set"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {input.items.map((item) => (
          <StorefrontTile
            className="p-3 shadow-[0_18px_45px_rgba(2,6,23,0.22)]"
            interactive
            tone="gallery"
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
          </StorefrontTile>
        ))}
      </div>
    </CollectibleGalleryRail>
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
    <CollectibleGalleryRail
      accentVar="--storefront-accent"
      headline="Manifest and contract references"
      summary="Technical proof and public contract metadata for this release."
    >
      <StorefrontSectionHeading
        eyebrow="Technical proof"
        title="Manifest and contract references"
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <StorefrontTile className="p-4" tone="muted">
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
        </StorefrontTile>

        <StorefrontTile className="p-4" tone="muted">
          <p className="text-xs text-[color:var(--storefront-muted)]">
            Publication manifest
          </p>
          <h3 className="mt-2 text-xl font-semibold">Public metadata</h3>
          <div className="mt-3 flex flex-col gap-2">
            <StorefrontActionLink
              href={input.metadataPath}
              target="_blank"
              tone={linkClass()}
            >
              Collection metadata JSON
            </StorefrontActionLink>
            <StorefrontActionLink
              href={input.contractPath}
              target="_blank"
              tone={linkClass()}
            >
              Contract manifest
            </StorefrontActionLink>
          </div>
        </StorefrontTile>

        <StorefrontTile className="p-4" tone="muted">
          <p className="text-xs text-[color:var(--storefront-muted)]">
            Token URI reference
          </p>
          <h3 className="mt-2 text-xl font-semibold">Edition example</h3>
          {input.firstEdition ? (
            <div className="mt-3 flex flex-col gap-2">
              <StorefrontActionLink
                href={`${input.metadataPath}/${input.firstEdition.position}`}
                target="_blank"
                tone={linkClass()}
              >
                Metadata #{input.firstEdition.position}
              </StorefrontActionLink>
              <StorefrontActionLink
                href={createCollectionTokenUriPath({
                  brandSlug: input.brandSlug,
                  collectionSlug: input.collectionSlug,
                  tokenId: input.firstEdition.position
                })}
                target="_blank"
                tone={linkClass()}
              >
                Token URI sample #{input.firstEdition.position}
              </StorefrontActionLink>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--storefront-muted)]">
              Add editions to generate sample token URI references.
            </p>
          )}
        </StorefrontTile>
      </div>
    </CollectibleGalleryRail>
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
    <CollectibleGalleryRail
      accentVar="--storefront-accent"
      headline="Connected brand releases"
      summary="Related collectible drops from the same campaign family."
    >
      <StorefrontSectionHeading
        eyebrow="Related drops"
        title="Connected brand releases"
      />
      {input.relatedCollections.length === 0 ? (
        <p className="text-sm text-[color:var(--storefront-muted)]">
          This brand has no other released drops yet.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {input.relatedCollections.map((related) => (
            <Link
              className="transition"
              href={related.publicPath}
              key={related.publicPath}
            >
              <StorefrontTile className="p-4" interactive tone="gallery">
                <StorefrontPill tone="accent">
                  {formatStatusLabel(related.storefrontStatus)}
                </StorefrontPill>
                <h3 className="mt-2 text-lg font-semibold">{related.title}</h3>
                <p className="mt-1 text-sm text-[color:var(--storefront-muted)]">
                  Collection {related.collectionSlug}
                </p>
              </StorefrontTile>
            </Link>
          ))}
        </div>
      )}
    </CollectibleGalleryRail>
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
      className={cn(
        "min-h-screen bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]",
        resolveStorefrontThemeClasses(collection.brandTheme)
      )}
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
