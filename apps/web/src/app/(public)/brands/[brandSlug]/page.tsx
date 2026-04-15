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

type BrandMetric = {
  label: string;
  value: string;
};

type BrandSectionTone = "live" | "upcoming" | "archive";

type BrandSection = {
  collections: CollectionPublicBrandPreview[];
  id: string;
  tone: BrandSectionTone;
  title: string;
};

const brandSectionTitleByTone: Record<BrandSectionTone, string> = {
  live: "Live drop corridor",
  upcoming: "Upcoming drop lane",
  archive: "Archive vault"
};

const brandSectionCopyByTone: Record<BrandSectionTone, string> = {
  live: "Active campaigns and current mint windows.",
  upcoming: "Planned drops and next-wave campaigns in queue.",
  archive:
    "Published campaigns preserved as a launch history with immutable reference data."
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

function formatSectionHeadline(input: {
  status: CollectionPublicBrandPreview["storefrontStatus"];
  itemCount: number;
}) {
  if (input.status === "ended" || input.status === "sold_out") {
    return "Vaulted";
  }

  if (input.status === "upcoming") {
    return "Queued";
  }

  if (input.itemCount <= 0) {
    return "Open";
  }

  return "Active";
}

function formatAvailabilityLabel(input: {
  release: CollectionPublicBrandPreview;
}) {
  const rows = [
    `${formatCount(input.release.itemCount)} works`,
    input.release.availabilityLabel
  ];

  if (input.release.priceLabel) {
    rows.push(input.release.priceLabel);
  }

  return rows;
};

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

function createHeroCtaLabel(input: {
  collection: CollectionPublicBrandPreview;
  preferredLabel: string | null;
}) {
  if (input.preferredLabel) {
    return input.preferredLabel;
  }

  if (input.collection.storefrontStatus === "live") {
    return "Open live release";
  }

  if (input.collection.storefrontStatus === "upcoming") {
    return "Open upcoming release";
  }

  return "Open release";
}

function dedupeByPublicPath(
  collections: CollectionPublicBrandPreview[],
  featured: CollectionPublicBrandPreview | null
) {
  if (!featured) {
    return collections;
  }

  return collections.filter((release) => release.publicPath !== featured.publicPath);
}

function BrandHeroVisual(input: {
  accentColor: string;
  release: CollectionPublicBrandPreview | null;
}) {
  return (
    <section className="public-brand-hero-composition">
      <div
        className="public-brand-hero-composition__glow"
        style={{ "--public-brand-accent": input.accentColor } as CSSProperties}
      />
      <div className="public-brand-hero-composition__frame">
        {input.release ? (
          <div className="public-brand-hero-media">
            {input.release.heroImageUrl ? (
              <img
                alt={`${input.release.title} campaign artwork`}
                className="public-brand-hero-media__image"
                src={input.release.heroImageUrl}
              />
            ) : (
              <div className="public-brand-hero-media--empty">
                Visual assets unavailable for this release.
              </div>
            )}
          </div>
        ) : (
          <div className="public-brand-hero-media public-brand-hero-media--empty">
            Visual campaign deck will be active once a release is published.
          </div>
        )}
      </div>
      <div className="public-brand-hero-composition__hud">
        <p className="public-brand-kicker">
          {input.release ? formatStatusLabel(input.release.storefrontStatus) : "Campaign"}
        </p>
        <p className="public-brand-hero-composition__kicker">
          {input.release
            ? formatSectionHeadline({
                itemCount: input.release.itemCount,
                status: input.release.storefrontStatus
              })
            : "Launch world"}
        </p>
      </div>
      <div className="public-brand-hero-composition__meta">
        <span>{input.release ? `${input.release.itemCount} works` : "No active release"}</span>
        <span>{input.release ? input.release.availabilityLabel : "Awaiting campaign"}</span>
      </div>
    </section>
  );
}

function BrandHeroSection(input: {
  brandLabel: string;
  brandPath: string;
  accentColor: string;
  heroKicker: string;
  heroHeadline: string;
  heroDescription: string;
  primaryCtaHref: string | null;
  primaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  secondaryCtaLabel: string;
  campaignMetrics: BrandMetric[];
  release: CollectionPublicBrandPreview | null;
}) {
  return (
    <section className="public-brand-hero">
      <div className="public-brand-hero__campaign">
        <div className="public-brand-wordmark">
          <span>{input.brandLabel}</span>
          <span className="public-brand-wordmark__path">{input.brandPath}</span>
        </div>
        <p className="public-brand-kicker">{input.heroKicker}</p>
        <h1 className="public-brand-hero__title">{input.heroHeadline}</h1>
        <p className="public-brand-hero__description">{input.heroDescription}</p>
        <div className="public-brand-hero__actions">
          {input.primaryCtaHref ? (
            <Link
              className="public-brand-button public-brand-button--primary"
              href={input.primaryCtaHref}
            >
              {input.primaryCtaLabel}
            </Link>
          ) : null}
          {input.secondaryCtaHref ? (
            <Link
              className="public-brand-button public-brand-button--ghost"
              href={input.secondaryCtaHref}
            >
              {input.secondaryCtaLabel}
            </Link>
          ) : null}
        </div>
        <div className="public-brand-hero-stats" aria-label="Brand campaign metrics">
          {input.campaignMetrics.map((metric) => (
            <article className="public-brand-stat" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </div>
      <BrandHeroVisual accentColor={input.accentColor} release={input.release} />
      </section>
  );
}

function BrandFeaturedReleaseCard(input: {
  featuredLabel?: string | null;
  release: CollectionPublicBrandPreview | null;
}) {
  if (!input.release) {
    return (
      <section className="public-brand-featured-card public-brand-featured-card--empty">
        <p className="public-brand-featured-card__empty">
          Campaign spotlight is waiting on a published release.
        </p>
      </section>
    );
  }

  const release = input.release;
  const metadataRows = formatAvailabilityLabel({ release });

  return (
    <section className="public-brand-featured-card">
      <div className="public-brand-featured-card__media">
        {release.heroImageUrl ? (
          <img
            alt={`${release.title} featured release`}
            className="public-brand-release-card__image"
            src={release.heroImageUrl}
          />
        ) : (
          <div className="public-brand-featured-card__placeholder">
            Featured artwork unavailable
          </div>
        )}
      </div>
      <div className="public-brand-featured-card__copy">
        <p className="public-brand-kicker">
          {input.featuredLabel ?? "Featured release"}
        </p>
        <h2 className="public-brand-featured-card__title">
          {release.storefrontHeadline ?? release.title}
        </h2>
        <p className="public-brand-featured-card__body">
          {release.storefrontHeadline
            ? release.storefrontHeadline
            : release.description ??
              "Published collectible drops are surfaced from immutable snapshots and arranged by brand campaign rhythm."}
        </p>
        <div className="public-brand-release-card__chips">
          <span className="public-brand-chip public-brand-chip--accent">
            {formatStatusLabel(release.storefrontStatus)}
          </span>
          {release.priceLabel ? (
            <span className="public-brand-chip">{release.priceLabel}</span>
          ) : null}
          <span className="public-brand-chip">
            {formatSectionHeadline({
              itemCount: release.itemCount,
              status: release.storefrontStatus
            })}
          </span>
        </div>
        <ul className="public-brand-featured-card__meta" aria-label={`${release.title} metadata`}>
          {metadataRows.map((metric) => (
            <li key={`${release.publicPath}-featured-${metric}`}>{metric}</li>
          ))}
        </ul>
        <div className="public-brand-release-card__actions">
          <Link className="public-brand-button public-brand-button--primary" href={release.publicPath}>
            Open launch campaign
          </Link>
          <span className="public-brand-featured-card__timeline">
            Launch {formatTimestamp(release.launchAt)} · Ends {formatTimestamp(release.endAt)}
          </span>
        </div>
      </div>
    </section>
  );
}

function BrandStorySection(input: {
  headline: string;
  body: string;
  metrics: BrandMetric[];
}) {
  return (
    <section className="public-brand-manifesto">
      <div className="public-brand-manifesto__copy">
        <p className="public-brand-kicker">Brand manifesto</p>
        <h2>{input.headline}</h2>
        <p>{input.body}</p>
      </div>
      <div className="public-brand-manifesto-grid" aria-label="Brand campaign profile">
        {input.metrics.map((metric) => (
          <article className="public-brand-manifesto-stat" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function BrandReleaseCard(input: {
  release: CollectionPublicBrandPreview;
  tone: BrandSectionTone;
}) {
  const metadata = formatAvailabilityLabel({ release: input.release });
  const toneClass = `public-brand-release-card--${input.tone}`;
  const metaPrefix =
    input.tone === "upcoming" ? "Anticipating" : input.tone === "archive" ? "Record" : "Live";

  return (
    <article className={`public-brand-release-card ${toneClass}`}>
      <Link className="public-brand-release-card__media" href={input.release.publicPath}>
        {input.release.heroImageUrl ? (
          <img
            alt={`${input.release.title} release artwork`}
            className="public-brand-release-card__image"
            src={input.release.heroImageUrl}
          />
        ) : (
          <div className="public-brand-release-card__placeholder">
            Campaign preview unavailable
          </div>
        )}
      </Link>
      <div className="public-brand-release-card__copy">
        <p className="public-brand-kicker">{metaPrefix}</p>
        <h3 className="public-brand-release-card__title">
          {input.release.storefrontHeadline ?? input.release.title}
        </h3>
        <p className="public-brand-release-card__body">
          {input.release.description ??
            `${metaPrefix.toLowerCase()} campaign entry for this campaign route.`}
        </p>
        <div className="public-brand-release-card__chips">
          <span className="public-brand-chip public-brand-chip--accent">
            {formatStatusLabel(input.release.storefrontStatus)}
          </span>
          <span className="public-brand-chip">
            {input.release.availabilityLabel}
          </span>
        </div>
        <ul className="public-brand-release-card__meta" aria-label={`${input.release.title} metadata`}>
          {metadata.map((metric) => (
            <li key={`${input.release.publicPath}-${metric}`}>{metric}</li>
          ))}
        </ul>
        <div className="public-brand-release-card__actions">
          <Link className="public-brand-button" href={input.release.publicPath}>
            Open campaign
          </Link>
        </div>
      </div>
    </article>
  );
}

function BrandReleaseSection(input: BrandSection) {
  return (
    <section className={`public-brand-release-section public-brand-release-section--${input.tone}`} id={input.id}>
      <div className="public-brand-section__heading">
        <div>
          <p className="public-brand-kicker">
            {brandSectionTitleByTone[input.tone]}
          </p>
          <h2>{input.title}</h2>
          <p className="public-brand-release-section__subtitle">
            {brandSectionCopyByTone[input.tone]}
          </p>
        </div>
      </div>
      {input.collections.length === 0 ? (
        <div className="public-brand-empty-state">
          {input.tone === "live"
            ? "No live launches are active right now."
            : input.tone === "upcoming"
              ? "No upcoming launches are queued yet."
              : "Archived campaigns are currently being recorded in this brand route."}
        </div>
      ) : (
        <div className={`public-brand-release-rail public-brand-release-rail--${input.tone}`}>
          {input.collections.map((release) => (
            <BrandReleaseCard key={release.publicPath} release={release} tone={input.tone} />
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
  const featuredRelease =
    brand.featuredRelease ??
    brand.liveReleases[0] ??
    brand.upcomingReleases[0] ??
    brand.archiveReleases[0] ??
    brand.collections[0] ??
    null;

  const primaryHref = featuredRelease?.publicPath ?? null;
  const heroKicker = brand.theme.heroKicker ?? `${formatCount(brand.collectionCount)} campaign releases`;
  const heroHeadline = brand.theme.landingHeadline;
  const heroDescription = brand.theme.landingDescription;
  const heroBrandLabel = brand.theme.wordmark ?? brand.brandName;
  const storyHeadline =
    brand.theme.storyHeadline ??
    `${heroBrandLabel} drop culture and campaign rhythm`;
  const storyBody =
    brand.theme.storyBody ??
    "The launch floor is built from saved brand presets and immutable published snapshots, so every campaign page stays true to the same collectible direction.";
  const primaryCtaLabel = featuredRelease
    ? createHeroCtaLabel({
        collection: featuredRelease,
        preferredLabel: brand.theme.primaryCtaLabel
      })
    : null;
  const secondaryCtaHref = brand.liveReleases.length > 0
    ? "#live-releases"
    : brand.upcomingReleases.length > 0
      ? "#upcoming-releases"
      : brand.archiveReleases.length > 0
        ? "#archive-vault"
        : null;
  const secondaryCtaLabel =
    brand.theme.secondaryCtaLabel ??
    (secondaryCtaHref === "#archive-vault"
      ? "Open archive vault"
      : secondaryCtaHref === "#live-releases"
        ? "Open live releases"
        : "Browse release rail");

  const campaignStats: BrandMetric[] = [
    {
      label: "Campaign releases",
      value: formatCount(brand.collectionCount)
    },
    {
      label: "Launch state",
      value: brand.collectionCount > 0 ? "Curated and active" : "Preparing launch"
    },
    {
      label: "Route home",
      value: brand.publicPath
    },
    {
      label: "Latest publish",
      value: formatTimestamp(brand.latestPublishedAt)
    }
  ];

  const storyMetrics: BrandMetric[] = [
    { label: "Featured", value: brand.featuredRelease ? "Yes" : "Not set" },
    { label: "Live", value: formatCount(brand.liveReleases.length) },
    { label: "Upcoming", value: formatCount(brand.upcomingReleases.length) },
    { label: "Archive", value: formatCount(brand.archiveReleases.length) }
  ];

  const liveReleases = dedupeByPublicPath(brand.liveReleases, featuredRelease);
  const upcomingReleases = dedupeByPublicPath(
    brand.upcomingReleases,
    featuredRelease
  );
  const archiveReleases = dedupeByPublicPath(brand.archiveReleases, featuredRelease);

  return (
    <div
      className={`public-brand-page storefront-shell storefront-shell--${brand.theme.themePreset}`}
      style={createStorefrontThemeStyle(brand.theme)}
    >
      <BrandHeroSection
        brandLabel={heroBrandLabel}
        brandPath={brand.publicPath}
        accentColor={brand.theme.accentColor}
        heroKicker={heroKicker}
        heroHeadline={heroHeadline}
        heroDescription={heroDescription}
        primaryCtaHref={primaryHref}
        primaryCtaLabel={primaryCtaLabel}
        secondaryCtaHref={secondaryCtaHref}
        secondaryCtaLabel={secondaryCtaLabel}
        campaignMetrics={campaignStats}
        release={featuredRelease}
      />
      <section className="public-brand-featured">
        <div className="public-brand-section__heading">
          <p className="public-brand-kicker">Featured spotlight</p>
          <h2>Campaign centerpiece</h2>
        </div>
        <BrandFeaturedReleaseCard
          featuredLabel={brand.theme.featuredReleaseLabel}
          release={featuredRelease}
        />
      </section>

      <BrandStorySection headline={storyHeadline} body={storyBody} metrics={storyMetrics} />

      <BrandReleaseSection
        collections={liveReleases}
        id="live-releases"
        tone="live"
        title="Live releases"
      />
      <BrandReleaseSection
        collections={upcomingReleases}
        id="upcoming-releases"
        tone="upcoming"
        title="Upcoming releases"
      />
      <BrandReleaseSection
        collections={archiveReleases}
        id="archive-vault"
        tone="archive"
        title="Archive vault"
      />
    </div>
  );
}
