import Link from "next/link";

import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { getCurrentAuthSession } from "../../../../server/auth/session";
import { createRuntimeSourceAssetService } from "../../../../server/source-assets/runtime";

export default async function StudioAssetsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return null;
  }

  const result = await createRuntimeSourceAssetService().listSourceAssets({
    ownerUserId: session.user.id
  });

  return (
    <PageShell
      eyebrow="Studio assets"
      title="Source asset intake is now part of the protected studio surface"
      lead="This Phase 2 slice adds storage-backed upload intent records and upload completion tracking without jumping ahead to generation or collection workflows."
      actions={
        <>
          <Link className="action-link" href="/studio">
            Back to studio
          </Link>
          <Link className="inline-link" href="/api/auth/session">
            Session endpoint
          </Link>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="The server creates a pending source asset record and returns a signed upload target in private object storage."
          eyebrow="Current slice"
          title="Direct upload contract"
        >
          <div className="pill-row">
            <Pill>POST /api/studio/assets/upload-intents</Pill>
            <Pill>POST /api/studio/assets/[assetId]/complete</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Generation remains deferred. This slice only lands durable intake and storage confirmation boundaries."
          eyebrow="Guardrail"
          title="No generation yet"
        >
          <div className="pill-row">
            <Pill>Generation deferred</Pill>
            <Pill>Contracts deferred</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The current protected owner can inspect the stored source asset records below."
          eyebrow="Summary"
          span={8}
          title="Current source asset records"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={session.user.walletAddress} />
            <MetricTile label="Assets" value={String(result.assets.length)} />
            <MetricTile
              label="Latest status"
              value={result.assets[0]?.status ?? "none"}
            />
          </div>
        </SurfaceCard>
        {result.assets.length === 0 ? (
          <SurfaceCard
            body="No source assets have been created for this session owner yet. The API routes are ready for the first upload client to use."
            eyebrow="Empty state"
            span={4}
            title="No assets yet"
          />
        ) : (
          result.assets.map((asset) => (
            <SurfaceCard
              body={`${asset.contentType} · ${asset.byteSize ?? "Unknown"} bytes`}
              eyebrow={asset.status}
              key={asset.id}
              span={4}
              title={asset.originalFilename}
            >
              <div className="pill-row">
                <Pill>{asset.id}</Pill>
                <Pill>{asset.uploadedAt ?? "Pending upload"}</Pill>
              </div>
            </SurfaceCard>
          ))
        )}
      </SurfaceGrid>
    </PageShell>
  );
}
