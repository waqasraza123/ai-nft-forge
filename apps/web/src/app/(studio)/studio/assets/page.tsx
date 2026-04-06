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
  const queuedAssets = result.assets.filter(
    (asset) => asset.latestGeneration?.status === "queued"
  ).length;
  const runningAssets = result.assets.filter(
    (asset) => asset.latestGeneration?.status === "running"
  ).length;
  const completedAssets = result.assets.filter(
    (asset) => asset.latestGeneration?.status === "succeeded"
  ).length;
  const generatedOutputCount = result.assets.reduce(
    (total, asset) => total + asset.latestGeneratedAssets.length,
    0
  );
  const uploadedAssets = result.assets.filter(
    (asset) => asset.status === "uploaded"
  ).length;

  return (
    <PageShell
      eyebrow="Studio assets"
      title="Source asset intake now feeds retrievable generated outputs"
      lead="Uploaded source assets can now be dispatched into a worker-backed generation flow that can target either the storage-copy adapter or an external HTTP backend, persist `GeneratedAsset` records, and expose protected download intents for stored outputs."
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
          body="The web app now creates queued generation requests for uploaded source assets, dispatches them into BullMQ for worker processing, and can mint protected download intents for stored generated outputs."
          eyebrow="Current slice"
          title="Queue-backed generation dispatch"
        >
          <div className="pill-row">
            <Pill>POST /api/studio/assets/upload-intents</Pill>
            <Pill>POST /api/studio/assets/[assetId]/complete</Pill>
            <Pill>POST /api/studio/generations</Pill>
            <Pill>
              POST
              /api/studio/generated-assets/[generatedAssetId]/download-intent
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The worker can now run either the deterministic storage-copy adapter or a validated external HTTP backend contract without reopening the web or database layers."
          eyebrow="Guardrail"
          title="Selectable generation adapters"
        >
          <div className="pill-row">
            <Pill>Generated assets persisted</Pill>
            <Pill>HTTP backend supported</Pill>
            <Pill>Contracts deferred</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The current protected owner can inspect source assets, generation request state, and stored generated outputs below."
          eyebrow="Summary"
          span={8}
          title="Current source asset and generation records"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={session.user.walletAddress} />
            <MetricTile label="Assets" value={String(result.assets.length)} />
            <MetricTile label="Uploaded" value={String(uploadedAssets)} />
            <MetricTile label="Queued" value={String(queuedAssets)} />
            <MetricTile label="Running" value={String(runningAssets)} />
            <MetricTile label="Succeeded" value={String(completedAssets)} />
            <MetricTile
              label="Generated outputs"
              value={String(generatedOutputCount)}
            />
          </div>
        </SurfaceCard>
        {result.assets.length === 0 ? (
          <SurfaceCard
            body="No source assets have been created for this session owner yet. The upload and generation API routes are ready for the first studio client."
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
                <Pill>
                  {asset.latestGeneration
                    ? `Generation ${asset.latestGeneration.status}`
                    : "No generation request"}
                </Pill>
                <Pill>
                  {asset.latestGeneration
                    ? `${asset.latestGeneration.requestedVariantCount} variants`
                    : "Ready for dispatch"}
                </Pill>
                <Pill>
                  {asset.latestGeneratedAssets.length > 0
                    ? `${asset.latestGeneratedAssets.length} stored outputs`
                    : "No stored outputs"}
                </Pill>
                <Pill>
                  {asset.latestGeneratedAssets[0]?.storageObjectKey ??
                    "Output keys pending"}
                </Pill>
              </div>
            </SurfaceCard>
          ))
        )}
      </SurfaceGrid>
    </PageShell>
  );
}
