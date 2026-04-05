import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

type CollectionPageProps = {
  params: Promise<{
    brandSlug: string;
    collectionSlug: string;
  }>;
};

export default async function CollectionPlaceholderPage({
  params
}: CollectionPageProps) {
  const { brandSlug, collectionSlug } = await params;

  return (
    <PageShell
      eyebrow="Public placeholder"
      title={`${brandSlug} / ${collectionSlug}`}
      lead="This premium public route is a branded placeholder shell only. Live collection data, minting, and publication logic are intentionally deferred beyond this commit."
      actions={
        <>
          <Link className="action-link" href="/">
            Marketing shell
          </Link>
          <Link className="inline-link" href="/studio">
            Studio shell
          </Link>
        </>
      }
      tone="default"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="The eventual storefront should present curated assets, collection narrative, drop mechanics, and brand controls without exposing internal operations."
          eyebrow="Storefront direction"
          span={8}
          title="Premium public page boundary"
        />
        <SurfaceCard
          body="Current placeholder values come from route params only."
          eyebrow="Resolved params"
          span={4}
          title="Current route payload"
        >
          <div className="pill-row">
            <Pill>{brandSlug}</Pill>
            <Pill>{collectionSlug}</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
