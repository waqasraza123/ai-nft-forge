import Link from "next/link";

import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

export default function MarketingPage() {
  return (
    <PageShell
      eyebrow="AI NFT Forge"
      title="Premium collectible storefront infrastructure"
      lead="A self-hosted white-label spine for agencies, creator teams, and studios that need curated collectible experiences rather than a one-off photo effect."
      actions={
        <>
          <Link className="action-link" href="/studio">
            Open studio shell
          </Link>
          <Link
            className="inline-link"
            href="/brands/demo-studio/collections/foundation"
          >
            Open public placeholder
          </Link>
        </>
      }
      tone="default"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Later phases plug uploads, generation, curation, publication, and minting into the same durable spine."
          eyebrow="Current state"
          footer={
            <div className="pill-row">
              <Pill>Monorepo</Pill>
              <Pill>Worker boundary</Pill>
              <Pill>Asset intake started</Pill>
            </div>
          }
          title="Foundation is now carrying the first Phase 2 slice"
        />
        <SurfaceCard
          body="The public surface is intentionally more atmospheric and presentation-led than the studio and ops areas."
          eyebrow="Public"
          footer={
            <div className="pill-row">
              <Pill>White-label</Pill>
              <Pill>Premium pages</Pill>
            </div>
          }
          title="Storefront quality is a product requirement"
        />
        <SurfaceCard
          body="The browser talks to server routes, the worker owns long-running work, and blockchain concerns stay out of the web runtime for now."
          eyebrow="Boundary"
          footer={
            <div className="pill-row">
              <Pill>Server-verified auth</Pill>
              <Pill>Worker-owned jobs</Pill>
            </div>
          }
          title="Durable system edges"
        />
        <SurfaceCard
          body="The repo now has foundation, auth, local infra, and the first source asset intake slice."
          eyebrow="Current state"
          span={8}
          title="The visible shell is moving into product groundwork"
        >
          <div className="metric-list">
            <MetricTile label="Marketing" value="Ready" />
            <MetricTile label="Studio assets" value="/studio/assets" />
            <MetricTile label="Health route" value="/api/health" />
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Navigate the current surface map without touching any product workflows yet."
          eyebrow="Routes"
          span={4}
          title="Phase 1 route boundaries"
        >
          <div className="pill-row">
            <Link className="inline-link" href="/studio">
              /studio
            </Link>
            <Link className="inline-link" href="/ops">
              /ops
            </Link>
            <Link
              className="inline-link"
              href="/brands/demo-studio/collections/foundation"
            >
              /brands/[brandSlug]/collections/[collectionSlug]
            </Link>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
