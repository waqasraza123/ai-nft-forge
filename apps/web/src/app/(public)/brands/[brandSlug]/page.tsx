import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActionRow,
  StorefrontActionLink,
  StorefrontPanel,
  StorefrontPill,
  StorefrontSectionHeading,
  StorefrontTile,
  cn
} from "@ai-nft-forge/ui";
import type {
  CollectionPublicBrandPreview,
  CollectionPublicBrandTheme
} from "@ai-nft-forge/shared";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  CollectibleGalleryRail
} from "../../../../components/collectible-visuals";
import { createRuntimePublicCollectionService } from "../../../../server/collections/runtime";
import {
  createStorefrontThemeStyle,
  resolveStorefrontThemeClasses
} from "../../../../lib/ui/storefront-theme";

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
  live: "Live gallery",
  upcoming: "Upcoming gallery",
  archive: "Archive gallery"
};

const brandSectionCopyByTone: Record<BrandSectionTone, string> = {
  live: "Active campaigns and current mint windows.",
  upcoming: "Planned drops and next-wave campaigns in queue.",
  archive:
    "Published campaigns preserved as immutable reference data for historical context."
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

  return collections.filter(
    (release) => release.publicPath !== featured.publicPath
  );
}

function BrandHeroVisual(input: {
  release: CollectionPublicBrandPreview | null;
}) {
  return (
    <CollectibleHeroArtwork
      accentVar="--storefront-accent"
      badge={
        input.release
          ? formatStatusLabel(input.release.storefrontStatus)
          : "Awaiting release"
      }
      className="border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)]"
      details={[
        {
          label: "Release stage",
          value: input.release
            ? formatSectionHeadline({
                itemCount: input.release.itemCount,
                status: input.release.storefrontStatus
              })
            : "Launch world"
        },
        {
          label: "Availability",
          value: input.release
            ? `${input.release.itemCount} works · ${input.release.availabilityLabel}`
            : "Awaiting campaign"
        },
        {
          label: "Spotlight",
          value: input.release
            ? "Published campaign loaded from the immutable release snapshot."
            : "The hero composition activates after a release is published."
        }
      ]}
      fallbackIndex={0}
      imageAlt={
        input.release
          ? `${input.release.title} campaign artwork`
          : "Release spotlight placeholder"
      }
      imageUrl={input.release?.heroImageUrl}
      meta="Premium editorial shell"
      title={input.release?.title ?? "Release spotlight"}
    />
  );
}

function BrandHeroSection(input: {
  brandLabel: string;
  brandPath: string;
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
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <StorefrontPill className="gap-2" tone="accent">
          <span>{input.brandLabel}</span>
          <span>·</span>
          <span>{input.brandPath}</span>
        </StorefrontPill>
        <h1 className="text-3xl font-semibold leading-tight font-[var(--font-display)] md:text-5xl">
          {input.heroHeadline}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--storefront-muted)] md:text-base">
          {input.heroDescription}
        </p>
        <ActionRow>
          {input.primaryCtaHref ? (
            <StorefrontActionLink href={input.primaryCtaHref}>
              {input.primaryCtaLabel}
            </StorefrontActionLink>
          ) : null}
          {input.secondaryCtaHref ? (
            <StorefrontActionLink href={input.secondaryCtaHref} tone="inline">
              {input.secondaryCtaLabel}
            </StorefrontActionLink>
          ) : null}
        </ActionRow>
        <div className="grid gap-3 border-t border-[color:var(--storefront-border)]/80 pt-4 sm:grid-cols-2">
          {input.campaignMetrics.map((metric) => (
            <div className="grid gap-1" key={metric.label}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
                {metric.label}
              </p>
              <p className="text-sm text-[color:var(--storefront-text)]">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--storefront-muted)]">
          {input.heroKicker}
        </p>
      </div>
      <BrandHeroVisual release={input.release} />
    </section>
  );
}

function BrandFeaturedReleaseCard(input: {
  featuredLabel?: string | null;
  fallbackIndex: number;
  release: CollectionPublicBrandPreview | null;
}) {
  if (!input.release) {
    return (
      <StorefrontPanel
        tone="default"
        className="text-sm text-[color:var(--storefront-muted)]"
      >
        Release spotlight is waiting on a published launch.
      </StorefrontPanel>
    );
  }

  const release = input.release;
  const metadataRows = formatAvailabilityLabel({ release });

  return (
    <StorefrontPanel tone="soft">
      <div className="grid gap-5 md:grid-cols-[1fr_1.1fr] md:items-center">
        <CollectiblePreviewCard
          accentVar="--storefront-accent"
          badge={input.featuredLabel ?? "Featured release"}
          className="bg-[color:var(--storefront-panel-strong)]/30"
          fallbackIndex={input.fallbackIndex}
          imageAlt={`${release.title} featured release`}
          imageUrl={release.heroImageUrl}
          meta={release.availabilityLabel}
          subtitle={release.priceLabel ?? "Immutable snapshot"}
          title={release.title}
        />
        <div className="space-y-4">
          <StorefrontSectionHeading
            eyebrow={input.featuredLabel ?? "Featured release"}
            lead={
              release.storefrontHeadline
                ? release.storefrontHeadline
                : (release.description ??
                  "Published collectible drops are surfaced from immutable snapshots and arranged by brand campaign rhythm.")
            }
            title={release.storefrontHeadline ?? release.title}
          />
          <ActionRow compact>
            <StorefrontPill tone="accent">
              {formatStatusLabel(release.storefrontStatus)}
            </StorefrontPill>
            {release.priceLabel ? (
              <StorefrontPill>{release.priceLabel}</StorefrontPill>
            ) : null}
            <StorefrontPill>
              {formatSectionHeadline({
                itemCount: release.itemCount,
                status: release.storefrontStatus
              })}
            </StorefrontPill>
          </ActionRow>
          <ul
            className="grid gap-1 text-sm text-[color:var(--storefront-muted)] md:grid-cols-2"
            aria-label={`${release.title} metadata`}
          >
            {metadataRows.map((metric) => (
              <li key={`${release.publicPath}-featured-${metric}`}>
                • {metric}
              </li>
            ))}
          </ul>
          <ActionRow compact>
            <StorefrontActionLink href={release.publicPath}>
              Open launch campaign
            </StorefrontActionLink>
            <span className="text-xs text-[color:var(--storefront-muted)]">
              Launch {formatTimestamp(release.launchAt)} · Ends{" "}
              {formatTimestamp(release.endAt)}
            </span>
          </ActionRow>
        </div>
      </div>
    </StorefrontPanel>
  );
}

function BrandStorySection(input: {
  headline: string;
  body: string;
  metrics: BrandMetric[];
}) {
  return (
    <StorefrontPanel tone="soft">
      <StorefrontSectionHeading
        eyebrow="Brand manifesto"
        lead={input.body}
        title={input.headline}
      />
      <dl className="mt-5 grid gap-4 border-t border-[color:var(--storefront-border)]/80 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {input.metrics.map((metric) => (
          <div className="grid gap-1" key={metric.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-muted)]">
              {metric.label}
            </dt>
            <dd className="text-sm text-[color:var(--storefront-text)]">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </StorefrontPanel>
  );
}

function BrandReleaseCard(input: {
  fallbackIndex: number;
  release: CollectionPublicBrandPreview;
  tone: BrandSectionTone;
}) {
  const metadata = formatAvailabilityLabel({ release: input.release });

  return (
    <StorefrontTile
      className="rounded-[2rem] p-4 shadow-[0_22px_55px_rgba(2,6,23,0.22)]"
      interactive
      tone="gallery"
    >
      <Link href={input.release.publicPath}>
        <CollectiblePreviewCard
          accentVar="--storefront-accent"
          badge={
            input.tone === "upcoming"
              ? "Queued drop"
              : input.tone === "archive"
                ? "Vault record"
                : "Live release"
          }
          className="mb-3 bg-[color:var(--storefront-panel-strong)]/20"
          fallbackIndex={input.fallbackIndex}
          imageAlt={`${input.release.title} release artwork`}
          imageUrl={input.release.heroImageUrl}
          meta={input.release.availabilityLabel}
          subtitle={
            input.release.priceLabel ?? formatTimestamp(input.release.launchAt)
          }
          title={input.release.title}
        />
      </Link>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
          {input.tone === "upcoming"
            ? "Anticipating"
            : input.tone === "archive"
              ? "Record"
              : "Live"}
        </p>
        <h3 className="text-lg font-semibold font-[var(--font-display)]">
          {input.release.storefrontHeadline ?? input.release.title}
        </h3>
        <p className="text-sm leading-6 text-[color:var(--storefront-muted)]">
          {input.release.description ??
            "Campaign entry for this campaign route."}
        </p>
        <ActionRow compact>
          <StorefrontPill tone="accent">
            {formatStatusLabel(input.release.storefrontStatus)}
          </StorefrontPill>
          <StorefrontPill>{input.release.availabilityLabel}</StorefrontPill>
        </ActionRow>
        <ul className="text-sm leading-6 text-[color:var(--storefront-muted)]">
          {metadata.map((metric) => (
            <li key={`${input.release.publicPath}-${metric}`}>• {metric}</li>
          ))}
        </ul>
        <StorefrontActionLink href={input.release.publicPath} tone="inline">
          Open campaign
        </StorefrontActionLink>
      </div>
    </StorefrontTile>
  );
}

function BrandReleaseSection(input: BrandSection) {
  return (
    <section className="space-y-4" id={input.id}>
      <CollectibleGalleryRail
        accentVar="--storefront-accent"
        headline={brandSectionTitleByTone[input.tone]}
        summary={brandSectionCopyByTone[input.tone]}
      >
        <div className="flex items-center justify-between gap-3">
          <StorefrontSectionHeading
            eyebrow={brandSectionTitleByTone[input.tone]}
            title={input.title}
          />
          <StorefrontPill className="text-[color:var(--storefront-muted)]">
            {input.collections.length} drops
          </StorefrontPill>
        </div>
        {input.collections.length === 0 ? (
          <StorefrontPanel
            tone="default"
            className="text-sm text-[color:var(--storefront-muted)]"
          >
            {input.tone === "live"
              ? "No live launches are active right now."
              : input.tone === "upcoming"
                ? "No upcoming launches are queued yet."
                : "Archived campaigns are currently being recorded in this brand route."}
          </StorefrontPanel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {input.collections.map((release, index) => (
              <BrandReleaseCard
                fallbackIndex={
                  input.tone === "live"
                    ? index + 2
                    : input.tone === "upcoming"
                      ? index + 4
                      : index + 6
                }
                key={release.publicPath}
                release={release}
                tone={input.tone}
              />
            ))}
          </div>
        )}
      </CollectibleGalleryRail>
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
  const heroKicker =
    brand.theme.heroKicker ??
    `${formatCount(brand.collectionCount)} campaign releases`;
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
  const secondaryCtaHref =
    brand.liveReleases.length > 0
      ? "#live-releases"
      : brand.upcomingReleases.length > 0
        ? "#upcoming-releases"
        : brand.archiveReleases.length > 0
          ? "#archive-gallery"
          : null;
  const secondaryCtaLabel =
    brand.theme.secondaryCtaLabel ??
    (secondaryCtaHref === "#archive-gallery"
      ? "Open archive gallery"
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
      value:
        brand.collectionCount > 0 ? "Curated and active" : "Preparing launch"
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
  const archiveReleases = dedupeByPublicPath(
    brand.archiveReleases,
    featuredRelease
  );

  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]",
        resolveStorefrontThemeClasses(brand.theme as CollectionPublicBrandTheme)
      )}
      style={createStorefrontThemeStyle(
        brand.theme as CollectionPublicBrandTheme
      )}
    >
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.08),transparent_22%)]" />
        <BrandHeroSection
          brandLabel={heroBrandLabel}
          brandPath={brand.publicPath}
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

        <CollectibleEditorialBand accentVar="--storefront-accent">
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <StorefrontSectionHeading
                eyebrow="Curated spotlight"
                title="Current launch focus"
              />
              <Link
                className="text-xs font-semibold text-[color:var(--storefront-accent)] hover:underline"
                href="#live-releases"
              >
                Browse live
              </Link>
            </div>
            <BrandFeaturedReleaseCard
              fallbackIndex={1}
              featuredLabel={brand.theme.featuredReleaseLabel}
              release={featuredRelease}
            />
          </div>
        </CollectibleEditorialBand>

        <BrandStorySection
          headline={storyHeadline}
          body={storyBody}
          metrics={storyMetrics}
        />

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
          id="archive-gallery"
          tone="archive"
          title="Archive gallery"
        />
      </div>
    </div>
  );
}
