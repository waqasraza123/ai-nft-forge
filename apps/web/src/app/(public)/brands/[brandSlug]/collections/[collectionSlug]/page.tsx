import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { createRuntimePublicCollectionService } from "../../../../../../server/collections/runtime";

type CollectionPageProps = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

function formatPublishedTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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

  const collection = result.collection;
  const metadataPath = buildCollectionMetadataPath({
    brandSlug: collection.brandSlug,
    collectionSlug: collection.collectionSlug
  });
  const contractPath = createCollectionContractPath({
    brandSlug: collection.brandSlug,
    collectionSlug: collection.collectionSlug
  });
  const firstMetadataItemPath =
    collection.items[0] !== undefined ? `${metadataPath}/1` : null;
  const firstTokenUriPath =
    collection.items[0] !== undefined
      ? createCollectionTokenUriPath({
          brandSlug: collection.brandSlug,
          collectionSlug: collection.collectionSlug,
          tokenId: collection.items[0].position
        })
      : null;

  return (
    <PageShell
      eyebrow={collection.brandName}
      title={collection.title}
      lead={
        collection.description ??
        "Published collectible collection assembled from curated generated variants."
      }
      actions={
        <>
          <Link className="action-link" href="/">
            Marketing shell
          </Link>
          <Link
            className="action-link"
            href={`/brands/${collection.brandSlug}`}
          >
            Brand landing
          </Link>
          <Link className="action-link" href={metadataPath} target="_blank">
            Collection metadata
          </Link>
          <Link className="action-link" href={contractPath} target="_blank">
            Contract manifest
          </Link>
          <Link className="inline-link" href="/studio/collections">
            Studio collections
          </Link>
        </>
      }
      tone="default"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="This public route now resolves a published collection snapshot, so release-ready curated drafts can be delivered without exposing the studio control plane."
          eyebrow="Publication"
          span={12}
          title={`${collection.brandName} release`}
        >
          <div className="metric-list">
            <MetricTile
              label="Published items"
              value={collection.items.length.toString()}
            />
            <MetricTile
              label="Brand route"
              value={`/brands/${collection.brandSlug}`}
            />
            <MetricTile
              label="Published"
              value={formatPublishedTimestamp(collection.publishedAt)}
            />
            <MetricTile label="Contract" value={contractPath} />
          </div>
          <div className="pill-row">
            <Pill>{collection.brandSlug}</Pill>
            <Pill>{collection.collectionSlug}</Pill>
            <Pill>{metadataPath}</Pill>
            <Pill>{contractPath}</Pill>
            <Pill>
              Updated {formatPublishedTimestamp(collection.updatedAt)}
            </Pill>
          </div>
          {firstMetadataItemPath ? (
            <div className="studio-action-row">
              <Link
                className="inline-link"
                href={firstMetadataItemPath}
                target="_blank"
              >
                Open edition 1 metadata
              </Link>
            </div>
          ) : null}
          {firstTokenUriPath ? (
            <div className="studio-action-row">
              <Link
                className="inline-link"
                href={firstTokenUriPath}
                target="_blank"
              >
                Open token URI 1
              </Link>
            </div>
          ) : null}
        </SurfaceCard>
        <SurfaceCard
          body="Each item below is resolved from the published collection snapshot and now also has both metadata and token-uri surfaces for the initial contract publication path."
          eyebrow="Collection"
          span={12}
          title="Curated works"
        >
          <div className="public-collection-grid">
            {collection.items.map((item) => (
              <article
                className="public-collection-card"
                key={item.generatedAssetId}
              >
                <img
                  alt={`${collection.title} variant ${item.variantIndex}`}
                  className="public-collection-card__image"
                  src={item.imageUrl}
                />
                <div className="public-collection-card__copy">
                  <strong>
                    {item.sourceAssetOriginalFilename} · variant{" "}
                    {item.variantIndex}
                  </strong>
                  <span>{item.pipelineKey}</span>
                  <span>Sequence {item.position}</span>
                  <Link
                    className="inline-link"
                    href={`${metadataPath}/${item.position}`}
                    target="_blank"
                  >
                    Open metadata
                  </Link>
                  <Link
                    className="inline-link"
                    href={createCollectionTokenUriPath({
                      brandSlug: collection.brandSlug,
                      collectionSlug: collection.collectionSlug,
                      tokenId: item.position
                    })}
                    target="_blank"
                  >
                    Open token URI
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
