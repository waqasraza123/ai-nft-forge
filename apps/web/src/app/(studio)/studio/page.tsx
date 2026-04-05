import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

export default function StudioPage() {
  return (
    <PageShell
      eyebrow="Studio"
      title="Operational shell for curation and release prep"
      lead="This route boundary will become session-protected in Commit 5. For now it establishes the calmer studio surface and the durable path where product state will live."
      actions={
        <>
          <Link className="action-link" href="/api/health">
            Health endpoint
          </Link>
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Asset review, generation state, collection drafts, and workspace controls land here after the auth and data spine exists."
          eyebrow="Planned"
          title="Protected studio workspace"
        />
        <SurfaceCard
          body="No uploads or generation controls exist yet in this phase slice."
          eyebrow="Guardrail"
          title="Feature logic stays out"
        >
          <div className="pill-row">
            <Pill>Uploads deferred</Pill>
            <Pill>Generation deferred</Pill>
            <Pill>Minting deferred</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
