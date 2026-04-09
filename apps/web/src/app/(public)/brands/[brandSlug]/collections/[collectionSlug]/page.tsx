import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

import { createRuntimePublicCollectionService } from "../../../../../../server/collections/runtime";

type CollectionPageProps = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
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

  return (
    <div
      className={`storefront-shell storefront-shell--${collection.brandTheme.themePreset}`}
      style={createStorefrontThemeStyle(collection.brandTheme)}
    >
      <section className="storefront-collection-hero">
        <div className="storefront-collection-hero__media">
          {collection.heroImageUrl ? (
            <img
              alt={`${collection.title} hero artwork`}
              className="storefront-collection-hero__image"
              src={collection.heroImageUrl}
            />
          ) : (
            <div className="storefront-release-card__placeholder">
              Curated hero artwork unavailable
            </div>
          )}
        </div>
        <div className="storefront-collection-hero__copy">
          <div className="storefront-pill-row">
            <span className="storefront-chip storefront-chip--accent">
              {formatStatusLabel(collection.storefrontStatus)}
            </span>
            {collection.priceLabel ? (
              <span className="storefront-chip">{collection.priceLabel}</span>
            ) : null}
            <span className="storefront-chip">
              {collection.availabilityLabel}
            </span>
          </div>
          <div className="storefront-wordmark">
            <span>
              {collection.brandTheme.wordmark ?? collection.brandName}
            </span>
            <span className="storefront-wordmark__path">
              {collection.brandPublicPath}
            </span>
          </div>
          <h1 className="storefront-hero__title">
            {collection.storefrontHeadline ?? collection.title}
          </h1>
          <p className="storefront-hero__lead">
            {collection.storefrontBody ??
              collection.description ??
              "Launch-ready collectible page resolved entirely from the immutable published collection snapshot."}
          </p>
          <div className="storefront-hero__actions">
            {collection.primaryCtaLabel && collection.primaryCtaHref ? (
              <Link
                className="storefront-button storefront-button--primary"
                href={collection.primaryCtaHref}
                target="_blank"
              >
                {collection.primaryCtaLabel}
              </Link>
            ) : null}
            {collection.secondaryCtaLabel && collection.secondaryCtaHref ? (
              <Link
                className="storefront-button storefront-button--secondary"
                href={collection.secondaryCtaHref}
                target="_blank"
              >
                {collection.secondaryCtaLabel}
              </Link>
            ) : null}
            <Link
              className="storefront-button storefront-button--ghost"
              href={collection.brandPublicPath}
            >
              Back to brand storefront
            </Link>
          </div>
        </div>
      </section>

      <section className="storefront-collection-grid">
        <article className="storefront-panel storefront-status-panel">
          <span className="storefront-section-kicker">Release status</span>
          <h2>{collection.availabilityLabel}</h2>
          <div className="storefront-stat-grid">
            <div className="storefront-stat">
              <strong>{formatTimestamp(collection.launchAt)}</strong>
              <span>Launch</span>
            </div>
            <div className="storefront-stat">
              <strong>{formatTimestamp(collection.endAt)}</strong>
              <span>End</span>
            </div>
            <div className="storefront-stat">
              <strong>
                {collection.totalSupply?.toString() ?? "Open edition"}
              </strong>
              <span>Supply</span>
            </div>
            <div className="storefront-stat">
              <strong>{collection.soldCount.toString()}</strong>
              <span>Claimed</span>
            </div>
            <div className="storefront-stat">
              <strong>
                {collection.remainingSupply?.toString() ?? "Flexible"}
              </strong>
              <span>Remaining</span>
            </div>
            <div className="storefront-stat">
              <strong>{collection.items.length.toString()}</strong>
              <span>Works</span>
            </div>
          </div>
        </article>

        <article className="storefront-panel storefront-tech-panel">
          <span className="storefront-section-kicker">Technical details</span>
          <h2>Published snapshot endpoints</h2>
          <div className="storefront-tech-links">
            <Link className="inline-link" href={metadataPath} target="_blank">
              Collection metadata
            </Link>
            <Link className="inline-link" href={contractPath} target="_blank">
              Contract manifest
            </Link>
            {firstEdition ? (
              <Link
                className="inline-link"
                href={`${metadataPath}/${firstEdition.position}`}
                target="_blank"
              >
                Metadata edition {firstEdition.position}
              </Link>
            ) : null}
            {firstEdition ? (
              <Link
                className="inline-link"
                href={createCollectionTokenUriPath({
                  brandSlug: collection.brandSlug,
                  collectionSlug: collection.collectionSlug,
                  tokenId: firstEdition.position
                })}
                target="_blank"
              >
                Token URI {firstEdition.position}
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="storefront-section">
        <div className="storefront-section__heading">
          <h2>Collection gallery</h2>
        </div>
        <div className="storefront-gallery-grid">
          {collection.items.map((item) => (
            <article
              className="storefront-gallery-card"
              key={item.generatedAssetId}
            >
              <img
                alt={`${collection.title} variant ${item.variantIndex}`}
                className="storefront-gallery-card__image"
                src={item.imageUrl}
              />
              <div className="storefront-gallery-card__copy">
                <strong>
                  {item.sourceAssetOriginalFilename} · variant{" "}
                  {item.variantIndex}
                </strong>
                <span>{item.pipelineKey}</span>
                <span>Edition {item.position}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="storefront-section">
        <div className="storefront-section__heading">
          <h2>Related releases</h2>
        </div>
        {collection.relatedCollections.length === 0 ? (
          <div className="storefront-empty-state">
            This brand does not have other published releases yet.
          </div>
        ) : (
          <div className="storefront-related-grid">
            {collection.relatedCollections.map((related) => (
              <Link
                className="storefront-related-card"
                href={related.publicPath}
                key={related.publicPath}
              >
                <span className="storefront-chip">
                  {formatStatusLabel(related.storefrontStatus)}
                </span>
                <strong>{related.title}</strong>
                <span>Display order {related.displayOrder}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
