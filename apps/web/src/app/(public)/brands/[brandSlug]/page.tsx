import Link from "next/link";
import { notFound } from "next/navigation";

import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { createRuntimePublicCollectionService } from "../../../../server/collections/runtime";

type BrandPageProps = {
  params: Promise<{
    brandSlug: string;
  }>;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No releases yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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

  const brand = result.brand;
  const featuredCollection =
    brand.collections.find((collection) => collection.isFeatured) ?? null;
  const secondaryCollections = brand.collections.filter(
    (collection) => collection.publicPath !== featuredCollection?.publicPath
  );

  return (
    <PageShell
      eyebrow={brand.brandName}
      title={brand.landingHeadline}
      lead={brand.landingDescription}
      actions={
        <>
          <Link className="action-link" href="/">
            Marketing shell
          </Link>
          <Link className="inline-link" href="/studio/settings">
            Studio settings
          </Link>
        </>
      }
      tone="default"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Brand identity now comes from durable studio settings, so the public surface can show stable presentation metadata without exposing studio controls."
          eyebrow="Brand"
          span={12}
          title={brand.brandName}
        >
          <div className="metric-list">
            <MetricTile
              label="Collections"
              value={brand.collections.length.toString()}
            />
            <MetricTile label="Brand route" value={brand.publicPath} />
            <MetricTile
              label="Latest release"
              value={formatTimestamp(brand.latestPublishedAt)}
            />
          </div>
          <div className="pill-row">
            <Pill>{brand.brandSlug}</Pill>
            <Pill>{brand.customDomain ?? "Default brand route"}</Pill>
            <Pill>{brand.accentColor}</Pill>
            <Pill>{brand.featuredReleaseLabel}</Pill>
          </div>
          <div className="brand-accent-row">
            <span
              className="brand-accent-swatch"
              style={{ backgroundColor: brand.accentColor }}
            />
            <span className="brand-accent-copy">
              Accent color from saved studio settings
            </span>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="A featured release can anchor the brand surface while the remaining published collections stay available as a browsable archive."
          eyebrow="Merchandising"
          span={12}
          title="Release spotlight"
        >
          {featuredCollection ? (
            <div className="featured-collection-card">
              <div className="featured-collection-card__copy">
                <div className="pill-row">
                  <Pill>{brand.featuredReleaseLabel}</Pill>
                  <Pill>Display order {featuredCollection.displayOrder}</Pill>
                </div>
                <h2 className="featured-collection-card__title">
                  {featuredCollection.title}
                </h2>
                <p className="featured-collection-card__body">
                  {featuredCollection.description ??
                    "This highlighted release is currently pinned at the top of the brand surface."}
                </p>
                <div className="featured-collection-card__meta">
                  <span>{featuredCollection.itemCount} published works</span>
                  {featuredCollection.previewPipelineKey ? (
                    <span>{featuredCollection.previewPipelineKey}</span>
                  ) : null}
                  <span>
                    Published {formatTimestamp(featuredCollection.publishedAt)}
                  </span>
                </div>
                <div className="featured-collection-card__actions">
                  <Link
                    className="action-link"
                    href={featuredCollection.publicPath}
                  >
                    Open featured collection
                  </Link>
                </div>
              </div>
              {featuredCollection.coverImageUrl ? (
                <img
                  alt={`${featuredCollection.title} spotlight preview`}
                  className="featured-collection-card__image"
                  src={featuredCollection.coverImageUrl}
                />
              ) : (
                <div className="public-collection-card__placeholder">
                  Preview unavailable
                </div>
              )}
            </div>
          ) : (
            <div className="collection-empty-state">
              No collection is using the "{brand.featuredReleaseLabel}" slot
              yet. Published collections still appear below in archive order.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="Published collections follow the saved merchandising order for this brand so operators can control which releases surface first."
          eyebrow="Directory"
          span={12}
          title="Collection directory"
        >
          {brand.collections.length === 0 ? (
            <div className="collection-empty-state">
              No collections have been published for this brand yet.
            </div>
          ) : (
            <div className="public-collection-grid">
              {(secondaryCollections.length > 0
                ? secondaryCollections
                : featuredCollection
                  ? [featuredCollection]
                  : brand.collections
              ).map((collection) => (
                <article
                  className="public-collection-card"
                  key={collection.publicPath}
                >
                  {collection.coverImageUrl ? (
                    <img
                      alt={`${collection.title} cover preview`}
                      className="public-collection-card__image"
                      src={collection.coverImageUrl}
                    />
                  ) : (
                    <div className="public-collection-card__placeholder">
                      Preview unavailable
                    </div>
                  )}
                  <div className="public-collection-card__copy">
                    <strong>{collection.title}</strong>
                    <span>
                      {collection.description ??
                        "Published collection snapshot assembled from curated generated variants."}
                    </span>
                    <div className="public-collection-card__meta">
                      <span>{collection.itemCount} published works</span>
                      {collection.previewPipelineKey ? (
                        <span>{collection.previewPipelineKey}</span>
                      ) : null}
                      {collection.previewSourceAssetOriginalFilename &&
                      collection.previewVariantIndex ? (
                        <span>
                          {collection.previewSourceAssetOriginalFilename} ·
                          variant {collection.previewVariantIndex}
                        </span>
                      ) : null}
                      <span>
                        Updated {formatTimestamp(collection.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="public-collection-card__actions">
                    {collection.isFeatured ? (
                      <Pill>{brand.featuredReleaseLabel}</Pill>
                    ) : null}
                    <Pill>Order {collection.displayOrder}</Pill>
                    <Pill>{collection.collectionSlug}</Pill>
                    <Link className="action-link" href={collection.publicPath}>
                      Open collection
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
