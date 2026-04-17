import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActionLink,
  StorefrontPanel,
  StorefrontPill,
  StorefrontTile
} from "@ai-nft-forge/ui";
import type {
  CollectionPublicBrandPreview,
  CollectionPublicBrandTheme
} from "@ai-nft-forge/shared";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  FloatingCollectibleCluster
} from "../../../../components/collectible-visuals";
import { createRuntimePublicCollectionService } from "../../../../server/collections/runtime";
import { createStorefrontThemeStyle } from "../../../../lib/ui/storefront-theme";

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
    <StorefrontPanel className="relative overflow-hidden" tone="soft">
      <div className="absolute -left-20 top-8 h-40 w-40 rounded-full bg-[color:var(--storefront-accent)]/15 blur-3xl" />
      <div className="absolute -right-16 bottom-4 h-44 w-44 rounded-full bg-[color:var(--storefront-accent)]/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--storefront-muted)]">
            Campaign stage
          </p>
          <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--storefront-accent)]">
            <span>
              {input.release
                ? formatStatusLabel(input.release.storefrontStatus)
                : "Campaign"}
            </span>
            <span>
              {input.release
                ? formatSectionHeadline({
                    itemCount: input.release.itemCount,
                    status: input.release.storefrontStatus
                  })
                : "Launch world"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[color:var(--storefront-muted)]">
          <span>
            {input.release
              ? `${input.release.itemCount} works`
              : "No active release"}
          </span>
          <span>·</span>
          <span>
            {input.release
              ? input.release.availabilityLabel
              : "Awaiting campaign"}
          </span>
        </div>
        <div className="mt-2 grid gap-2 text-sm text-[color:var(--storefront-muted)]">
          <StorefrontTile className="px-4 py-3" tone="gallery">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--storefront-accent)]">
              Featured spotlight
            </p>
            <p className="mt-1">
              {input.release
                ? "Live campaign loaded from immutable publication snapshot."
                : "The spotlight remains empty until a release is published."}
            </p>
          </StorefrontTile>
        </div>
      </div>
      <div className="mt-5">
        <CollectibleHeroArtwork
          accentVar="--storefront-accent"
          badge={
            input.release
              ? formatStatusLabel(input.release.storefrontStatus)
              : "Awaiting release"
          }
          className="border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)]"
          imageAlt={
            input.release
              ? `${input.release.title} campaign artwork`
              : "Campaign spotlight placeholder"
          }
          imageUrl={input.release?.heroImageUrl}
          meta={
            input.release
              ? `${input.release.itemCount} works · ${input.release.availabilityLabel}`
              : "Visual campaign deck will activate after publication"
          }
          title={input.release?.title ?? "Campaign spotlight"}
        />
      </div>
    </StorefrontPanel>
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
        <div className="flex flex-wrap gap-3">
          {input.primaryCtaHref ? (
            <ActionLink href={input.primaryCtaHref} tone="action">
              {input.primaryCtaLabel}
            </ActionLink>
          ) : null}
          {input.secondaryCtaHref ? (
            <ActionLink href={input.secondaryCtaHref} tone="inline">
              {input.secondaryCtaLabel}
            </ActionLink>
          ) : null}
        </div>
        <StorefrontPanel>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            {input.heroKicker}
          </p>
          <div className="flex flex-wrap gap-2">
            {input.campaignMetrics.map((metric) => (
              <StorefrontTile className="p-3" tone="muted" key={metric.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--storefront-accent)]">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm text-[color:var(--storefront-text)]">
                  {metric.value}
                </p>
              </StorefrontTile>
            ))}
          </div>
        </StorefrontPanel>
      </div>
      <BrandHeroVisual release={input.release} />
    </section>
  );
}

function BrandFeaturedReleaseCard(input: {
  featuredLabel?: string | null;
  release: CollectionPublicBrandPreview | null;
}) {
  if (!input.release) {
    return (
      <StorefrontPanel
        tone="default"
        className="text-sm text-[color:var(--storefront-muted)]"
      >
        Campaign spotlight is waiting on a published release.
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
          imageAlt={`${release.title} featured release`}
          imageUrl={release.heroImageUrl}
          meta={release.availabilityLabel}
          subtitle={release.priceLabel ?? "Immutable snapshot"}
          title={release.title}
        />
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            {input.featuredLabel ?? "Featured release"}
          </p>
          <h2 className="text-2xl font-semibold font-[var(--font-display)]">
            {release.storefrontHeadline ?? release.title}
          </h2>
          <p className="text-sm leading-7 text-[color:var(--storefront-muted)]">
            {release.storefrontHeadline
              ? release.storefrontHeadline
              : (release.description ??
                "Published collectible drops are surfaced from immutable snapshots and arranged by brand campaign rhythm.")}
          </p>
          <div className="flex flex-wrap gap-2">
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
          </div>
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
          <div className="flex flex-wrap items-center gap-2">
            <ActionLink href={release.publicPath} tone="action">
              Open launch campaign
            </ActionLink>
            <span className="text-xs text-[color:var(--storefront-muted)]">
              Launch {formatTimestamp(release.launchAt)} · Ends{" "}
              {formatTimestamp(release.endAt)}
            </span>
          </div>
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
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
            Brand manifesto
          </p>
          <h2 className="mt-1 text-2xl font-semibold font-[var(--font-display)]">
            {input.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--storefront-muted)]">
            {input.body}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {input.metrics.map((metric) => (
            <StorefrontTile className="p-3" tone="muted" key={metric.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--storefront-accent)]">
                {metric.label}
              </p>
              <p className="mt-1 text-sm text-[color:var(--storefront-text)]">
                {metric.value}
              </p>
            </StorefrontTile>
          ))}
        </div>
      </div>
    </StorefrontPanel>
  );
}

function BrandReleaseCard(input: {
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
        <div className="flex flex-wrap gap-2">
          <StorefrontPill tone="accent">
            {formatStatusLabel(input.release.storefrontStatus)}
          </StorefrontPill>
          <StorefrontPill>{input.release.availabilityLabel}</StorefrontPill>
        </div>
        <ul className="text-sm leading-6 text-[color:var(--storefront-muted)]">
          {metadata.map((metric) => (
            <li key={`${input.release.publicPath}-${metric}`}>• {metric}</li>
          ))}
        </ul>
        <ActionLink href={input.release.publicPath} tone="inline">
          Open campaign
        </ActionLink>
      </div>
    </StorefrontTile>
  );
}

function BrandReleaseSection(input: BrandSection) {
  return (
    <section className="space-y-4" id={input.id}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
          {brandSectionTitleByTone[input.tone]}
        </p>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold font-[var(--font-display)]">
            {input.title}
          </h2>
          <StorefrontPill className="text-[color:var(--storefront-muted)]">
            {input.collections.length} drops
          </StorefrontPill>
        </div>
        <p className="text-sm text-[color:var(--storefront-muted)]">
          {brandSectionCopyByTone[input.tone]}
        </p>
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
          {input.collections.map((release) => (
            <BrandReleaseCard
              key={release.publicPath}
              release={release}
              tone={input.tone}
            />
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
      className="min-h-screen bg-[var(--storefront-bg)] text-[color:var(--storefront-text)]"
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

        <FloatingCollectibleCluster
          accentVar="--storefront-accent"
          headline="Drop floors need a hero composition before the browsing grid begins."
          items={[
            brand.featuredRelease ? "Featured spotlight" : "Launch spotlight",
            "Collectible rail",
            "Vault framing"
          ]}
          label="Storefront direction"
        />

        <CollectibleEditorialBand accentVar="--storefront-accent">
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
                Featured spotlight
              </p>
              <Link
                className="text-xs font-semibold text-[color:var(--storefront-accent)] hover:underline"
                href="#live-releases"
              >
                Browse live
              </Link>
            </div>
            <BrandFeaturedReleaseCard
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
          id="archive-vault"
          tone="archive"
          title="Archive vault"
        />
      </div>
    </div>
  );
}
