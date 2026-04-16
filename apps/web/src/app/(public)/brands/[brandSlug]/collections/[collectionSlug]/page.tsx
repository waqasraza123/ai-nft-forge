import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

import { createRuntimePublicCollectionService } from "../../../../../../server/collections/runtime";

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

function createStorefrontThemeStyle(theme: CollectionPublicBrandTheme) {
  const presetTokens: Record<
    CollectionPublicBrandTheme["themePreset"],
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

function buildCollectionMetadataPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return `/brands/${input.brandSlug}/collections/${input.collectionSlug}/metadata`;
}

function createPrimaryHeroCallToAction(input: {
  collectionStatus: "upcoming" | "live" | "sold_out" | "ended";
  fallbackToReserve: string;
  primaryCtaHref: string | null;
  primaryCtaLabel: string | null;
}) {
  if (input.primaryCtaLabel && input.primaryCtaHref) {
    return {
      label: input.primaryCtaLabel,
      href: input.primaryCtaHref
    };
  }

  if (input.collectionStatus === "live") {
    return {
      label: "Reserve now",
      href: input.fallbackToReserve
    };
  }

  return null;
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
  const fallbackCta = createPrimaryHeroCallToAction({
    collectionStatus: input.storefrontStatus,
    fallbackToReserve: "#reserve",
    primaryCtaHref: input.primaryCtaHref,
    primaryCtaLabel: input.primaryCtaLabel
  });

  return (
    <section className="storefront-collection-hero">
      <div className="storefront-collection-hero__media">
        {input.heroImageUrl ? (
          <img
            alt={`${input.title} hero artwork`}
            className="storefront-collection-hero__image"
            src={input.heroImageUrl}
          />
        ) : (
          <div className="storefront-collection-hero__fallback">
            Hero artwork unavailable
          </div>
        )}
        <div className="storefront-collection-hero__status-stack">
          <span className="storefront-chip storefront-chip--accent">
            {formatStatusLabel(input.storefrontStatus)}
          </span>
          <span className="storefront-chip">{input.availabilityLabel}</span>
        </div>
      </div>
      <div className="storefront-collection-hero__copy">
        <div>
          <p className="storefront-collection-hero__kicker">
            {input.featuredMessage}
          </p>
          <p className="storefront-wordmark">{input.brandThemeWordmark}</p>
          <p className="storefront-wordmark__path">{input.brandPath}</p>
        </div>
        <h1 className="storefront-hero__title">{input.title}</h1>
        <p className="storefront-hero__lead">{input.description}</p>
        <div className="storefront-hero__actions">
          {fallbackCta ? (
            <Link
              className="storefront-button storefront-button--primary"
              href={fallbackCta.href}
            >
              {fallbackCta.label}
            </Link>
          ) : null}
          {input.secondaryCtaLabel && input.secondaryCtaHref ? (
            <Link
              className="storefront-button storefront-button--secondary"
              href={input.secondaryCtaHref}
              target="_blank"
            >
              {input.secondaryCtaLabel}
            </Link>
          ) : null}
          <Link
            className="storefront-button storefront-button--ghost"
            href={input.brandPath}
          >
            Back to brand release floor
          </Link>
        </div>
        <div
          className="storefront-collection-hero__meta"
          aria-label="Collection status"
        >
          <article className="storefront-chip storefront-chip--accent">
            Launch mode
          </article>
          <article className="storefront-chip">
            {launchLabel(input.launchAt, input.storefrontStatus)}
          </article>
          {input.totalSupply ? (
            <article className="storefront-chip">
              {formatCount(input.totalSupply)} artworks
            </article>
          ) : null}
          {input.priceLabel ? (
            <article className="storefront-chip">{input.priceLabel}</article>
          ) : null}
          <article className="storefront-chip">
            {formatCount(input.claimedCount)} claimed
          </article>
        </div>
      </div>
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
    <section className="storefront-section storefront-collection-story">
      <div className="storefront-collection-story__copy">
        <p className="storefront-section-kicker">Launch story</p>
        <h2>{input.headline}</h2>
        <p className="storefront-hero__lead">{input.lead}</p>
      </div>
      <div className="storefront-collection-story__proof storefront-proof-card">
        <p className="storefront-section-kicker">Collector proof</p>
        <h3>{formatStatusLabel(input.status)} runway</h3>
        <div className="storefront-proof-card__statset">
          <span className="storefront-chip storefront-chip--accent">
            {input.availabilityLabel}
          </span>
          <span className="storefront-chip">
            {formatCount(input.mintedTokenCount)} minted proofs
          </span>
        </div>
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
    <section className="storefront-section" id="proofs">
      <div className="storefront-section__heading">
        <div>
          <p className="storefront-section-kicker">Collector proof</p>
          <h2>Drop ledger and launch telemetry</h2>
        </div>
      </div>
      <div className="storefront-collection-proof-grid">
        {proofs.map((proof) => (
          <article className="storefront-proof-card" key={proof.label}>
            <span>{proof.label}</span>
            <strong>{proof.value}</strong>
          </article>
        ))}
      </div>
      <p className="storefront-collection-trust-copy">
        {input.storefrontStatus === "upcoming"
          ? describeSupply(input)
          : `${describeSupply(input)}. ${input.activeDeployment ? `Deployed contract on ${input.activeDeployment.chain.label}.` : "No onchain deployment recorded yet."}`}
      </p>
    </section>
  );
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
    <section className="storefront-section" id="reserve">
      <div className="storefront-section__heading">
        <div>
          <p className="storefront-section-kicker">Reserve module</p>
          <h2>Secure your edition before it sells out</h2>
        </div>
        <div className="storefront-chip-row">
          <span className="storefront-chip storefront-chip--accent">
            {input.availabilityLabel}
          </span>
          <span className="storefront-chip">Reserve-ready</span>
        </div>
      </div>
      <div className="storefront-collection-reserve-grid">
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
        <article className="storefront-panel storefront-collection-trust-card">
          <span className="storefront-section-kicker">Reserve trust</span>
          <h3>Trust before checkout</h3>
          <ul className="storefront-collection-trust-list">
            <li>Reservation is time-bound and consumed at checkout.</li>
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
      <section className="storefront-section">
        <div className="storefront-section__heading">
          <p className="storefront-section-kicker">Gallery wall</p>
          <h2>{`Gallery is waiting for published variants for ${input.title}`}</h2>
        </div>
        <div className="storefront-empty-state">
          No artwork has been published for this release yet.
        </div>
      </section>
    );
  }

  return (
    <section className="storefront-section">
      <div className="storefront-section__heading">
        <p className="storefront-section-kicker">Gallery wall</p>
        <h2>Curated collectible set</h2>
      </div>
      <div className="storefront-collection-gallery-grid">
        {input.items.map((item) => (
          <article
            className="storefront-collection-gallery-card"
            key={item.generatedAssetId}
          >
            <img
              alt={`${input.title} edition ${item.position}`}
              className="storefront-collection-gallery-card__image"
              src={item.imageUrl}
            />
            <div className="storefront-collection-gallery-card__copy">
              <strong>
                {item.sourceAssetOriginalFilename} · Edition {item.position}
              </strong>
              <span>
                Variant {item.variantIndex} from {item.pipelineKey}
              </span>
            </div>
          </article>
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
    <section className="storefront-section" id="technical-proof">
      <div className="storefront-section__heading">
        <div>
          <p className="storefront-section-kicker">Technical proof</p>
          <h2>Manifest and contract references</h2>
        </div>
      </div>
      <div className="storefront-technical-proof-grid">
        <article className="storefront-proof-card storefront-proof-card--technical">
          <p>Deployment record</p>
          <h3>{input.activeDeployment ? "Deployed" : "Not deployed"}</h3>
          {input.activeDeployment ? (
            <div className="storefront-technical-proof-list">
              <span>Chain {input.activeDeployment.chain.label}</span>
              <span>
                {formatAddressShort(input.activeDeployment.contractAddress)}
              </span>
              <span>
                {formatAddressShort(input.activeDeployment.deployTxHash)}
              </span>
              <span>{formatTimestamp(input.activeDeployment.deployedAt)}</span>
            </div>
          ) : null}
          {!input.activeDeployment ? (
            <p className="storefront-technical-proof-copy">
              This collection has no recorded chain deployment yet.
            </p>
          ) : null}
        </article>

        <article className="storefront-proof-card storefront-proof-card--technical">
          <p>Publication manifest</p>
          <h3>Public metadata</h3>
          <div className="storefront-tech-links storefront-tech-links--stacked">
            <Link
              className="inline-link"
              href={input.metadataPath}
              target="_blank"
            >
              Collection metadata JSON
            </Link>
            <Link
              className="inline-link"
              href={input.contractPath}
              target="_blank"
            >
              Contract manifest
            </Link>
          </div>
        </article>

        <article className="storefront-proof-card storefront-proof-card--technical">
          <p>Token URI reference</p>
          <h3>Edition example</h3>
          {input.firstEdition ? (
            <div className="storefront-tech-links storefront-tech-links--stacked">
              <Link
                className="inline-link"
                href={`${input.metadataPath}/${input.firstEdition.position}`}
                target="_blank"
              >
                Metadata #{input.firstEdition.position}
              </Link>
              <Link
                className="inline-link"
                href={createCollectionTokenUriPath({
                  brandSlug: input.brandSlug,
                  collectionSlug: input.collectionSlug,
                  tokenId: input.firstEdition.position
                })}
                target="_blank"
              >
                Token URI sample #{input.firstEdition.position}
              </Link>
            </div>
          ) : (
            <p className="storefront-technical-proof-copy">
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
    <section className="storefront-section">
      <div className="storefront-section__heading">
        <p className="storefront-section-kicker">Related drops</p>
        <h2>Connected brand releases</h2>
      </div>
      {input.relatedCollections.length === 0 ? (
        <div className="storefront-empty-state">
          This brand has no other released drops yet.
        </div>
      ) : (
        <div className="storefront-related-grid storefront-related-grid--collection">
          {input.relatedCollections.map((related) => (
            <Link
              className="storefront-related-card storefront-related-card--collection"
              href={related.publicPath}
              key={related.publicPath}
            >
              <span className="storefront-chip storefront-chip--accent">
                {formatStatusLabel(related.storefrontStatus)}
              </span>
              <strong>{related.title}</strong>
              <span>Collection {related.collectionSlug}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
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
      className={`storefront-shell storefront-shell--${collection.brandTheme.themePreset}`}
      style={createStorefrontThemeStyle(collection.brandTheme)}
    >
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

      <CollectionLaunchStory
        availabilityLabel={collection.availabilityLabel}
        headline={heroHeadline}
        lead={launchStory}
        mintedTokenCount={collection.mintedTokenCount}
        status={collection.storefrontStatus}
      />

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

      <CollectionGallery items={collection.items} title={collection.title} />

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
  );
}
