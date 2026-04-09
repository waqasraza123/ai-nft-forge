import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import type {
  CollectionPublicBrandPreview,
  CollectionPublicBrandTheme
} from "@ai-nft-forge/shared";

import { createRuntimePublicCollectionService } from "../../../../server/collections/runtime";

type BrandPageProps = {
  params: Promise<{
    brandSlug: string;
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

function formatStatusLabel(
  status: CollectionPublicBrandPreview["storefrontStatus"]
) {
  switch (status) {
    case "live":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "sold_out":
      return "Sold out";
    case "ended":
    default:
      return "Archive";
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

function ReleaseCard(input: {
  collection: CollectionPublicBrandPreview;
  featuredLabel?: string | null;
  showFeaturedPill?: boolean;
  tone?: "default" | "feature";
}) {
  const { collection } = input;

  return (
    <article
      className={`storefront-release-card ${
        input.tone === "feature" ? "storefront-release-card--feature" : ""
      }`}
    >
      <div className="storefront-release-card__media">
        {collection.heroImageUrl ? (
          <img
            alt={`${collection.title} hero artwork`}
            className="storefront-release-card__image"
            src={collection.heroImageUrl}
          />
        ) : (
          <div className="storefront-release-card__placeholder">
            Curated hero artwork unavailable
          </div>
        )}
      </div>
      <div className="storefront-release-card__copy">
        <div className="storefront-pill-row">
          <span className="storefront-chip">
            {formatStatusLabel(collection.storefrontStatus)}
          </span>
          {input.showFeaturedPill && collection.isFeatured ? (
            <span className="storefront-chip storefront-chip--accent">
              {input.featuredLabel ?? "Featured release"}
            </span>
          ) : null}
          {collection.priceLabel ? (
            <span className="storefront-chip">{collection.priceLabel}</span>
          ) : null}
        </div>
        <h2 className="storefront-release-card__title">{collection.title}</h2>
        <p className="storefront-release-card__body">
          {collection.storefrontHeadline ??
            collection.description ??
            "Published collection snapshot assembled from curated generated works."}
        </p>
        <div className="storefront-release-card__meta">
          <span>{collection.availabilityLabel}</span>
          <span>{collection.itemCount} works</span>
          {collection.launchAt ? (
            <span>Launch {formatTimestamp(collection.launchAt)}</span>
          ) : null}
          {collection.endAt ? (
            <span>Ends {formatTimestamp(collection.endAt)}</span>
          ) : null}
        </div>
        <div className="storefront-release-card__actions">
          <Link
            className="storefront-button storefront-button--primary"
            href={collection.publicPath}
          >
            Open release
          </Link>
        </div>
      </div>
    </article>
  );
}

function ReleaseRail(input: {
  collections: CollectionPublicBrandPreview[];
  emptyCopy: string;
  title: string;
}) {
  return (
    <section className="storefront-section">
      <div className="storefront-section__heading">
        <h2>{input.title}</h2>
      </div>
      {input.collections.length === 0 ? (
        <div className="storefront-empty-state">{input.emptyCopy}</div>
      ) : (
        <div className="storefront-release-rail">
          {input.collections.map((collection) => (
            <ReleaseCard collection={collection} key={collection.publicPath} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brandSlug } = await params;
  const result =
    await createRuntimePublicCollectionService().getPublicBrandBySlug({
      brandSlug
    });

  if (!result) {
    notFound();
  }

  const { brand } = result;
  const heroCollection =
    brand.featuredRelease ??
    brand.liveReleases[0] ??
    brand.upcomingReleases[0] ??
    brand.archiveReleases[0] ??
    brand.collections[0] ??
    null;
  const primaryHref = heroCollection?.publicPath ?? null;
  const storyHeadline =
    brand.theme.storyHeadline ?? `${brand.brandName} release program`;
  const storyBody =
    brand.theme.storyBody ??
    "Each collection page resolves from saved brand settings and immutable published snapshots, so launch presentation stays stable even as studio drafts continue to evolve.";

  return (
    <div
      className={`storefront-shell storefront-shell--${brand.theme.themePreset}`}
      style={createStorefrontThemeStyle(brand.theme)}
    >
      <section className="storefront-hero">
        <div className="storefront-hero__copy">
          <div className="storefront-wordmark">
            <span>{brand.theme.wordmark ?? brand.brandName}</span>
            <span className="storefront-wordmark__path">
              {brand.publicPath}
            </span>
          </div>
          <div className="storefront-pill-row">
            <span className="storefront-chip storefront-chip--accent">
              {brand.theme.heroKicker ?? "Launch storefront"}
            </span>
            <span className="storefront-chip">
              {brand.collectionCount.toString()} published releases
            </span>
            <span className="storefront-chip">
              Updated {formatTimestamp(brand.latestPublishedAt)}
            </span>
          </div>
          <h1 className="storefront-hero__title">
            {brand.theme.landingHeadline}
          </h1>
          <p className="storefront-hero__lead">
            {brand.theme.landingDescription}
          </p>
          <div className="storefront-hero__actions">
            {primaryHref ? (
              <Link
                className="storefront-button storefront-button--primary"
                href={primaryHref}
              >
                {brand.theme.primaryCtaLabel ??
                  (heroCollection?.storefrontStatus === "live"
                    ? "View live release"
                    : "View featured release")}
              </Link>
            ) : null}
            {brand.archiveReleases.length > 0 ? (
              <Link
                className="storefront-button storefront-button--secondary"
                href="#archive-releases"
              >
                {brand.theme.secondaryCtaLabel ?? "Browse archive"}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="storefront-hero__feature">
          {heroCollection ? (
            <ReleaseCard
              collection={heroCollection}
              featuredLabel={brand.theme.featuredReleaseLabel}
              showFeaturedPill
              tone="feature"
            />
          ) : (
            <div className="storefront-empty-state">
              No releases are published for this brand yet.
            </div>
          )}
        </div>
      </section>

      <section className="storefront-story">
        <div className="storefront-story__copy">
          <span className="storefront-section-kicker">Editorial story</span>
          <h2>{storyHeadline}</h2>
          <p>{storyBody}</p>
        </div>
        <div className="storefront-story__stats">
          <div className="storefront-stat">
            <strong>{brand.liveReleases.length.toString()}</strong>
            <span>Live releases</span>
          </div>
          <div className="storefront-stat">
            <strong>{brand.upcomingReleases.length.toString()}</strong>
            <span>Upcoming launches</span>
          </div>
          <div className="storefront-stat">
            <strong>{brand.archiveReleases.length.toString()}</strong>
            <span>Archive entries</span>
          </div>
          <div className="storefront-stat">
            <strong>{brand.customDomain ?? "Default route"}</strong>
            <span>Domain</span>
          </div>
        </div>
      </section>

      <ReleaseRail
        collections={brand.liveReleases}
        emptyCopy="No live releases are being merchandised right now."
        title="Live releases"
      />
      <ReleaseRail
        collections={brand.upcomingReleases}
        emptyCopy="No upcoming releases are scheduled yet."
        title="Upcoming releases"
      />

      <section className="storefront-section" id="archive-releases">
        <div className="storefront-section__heading">
          <h2>Archive</h2>
        </div>
        {brand.archiveReleases.length === 0 ? (
          <div className="storefront-empty-state">
            Archive entries appear here as releases end or sell out.
          </div>
        ) : (
          <div className="storefront-archive-grid">
            {brand.archiveReleases.map((collection) => (
              <ReleaseCard
                collection={collection}
                key={collection.publicPath}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
