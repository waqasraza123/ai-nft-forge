import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

export default function OpsPage() {
  return (
    <PageShell
      eyebrow="Ops"
      title="Operational oversight without product features"
      lead="This route reserves the quieter operations surface for health, queues, moderation, and reconciliation later in the roadmap."
      actions={
        <>
          <Link className="action-link" href="/api/health">
            Inspect health
          </Link>
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="ops"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Queue monitoring, worker status, moderation, and reconciliation belong here later rather than in the public or studio shells."
          eyebrow="Boundary"
          title="Dedicated ops route"
        />
        <SurfaceCard
          body="Operations stay intentionally lighter and calmer than the public storefront."
          eyebrow="Surface direction"
          title="Calmer presentation"
        >
          <div className="pill-row">
            <Pill>Health</Pill>
            <Pill>Queues later</Pill>
            <Pill>Moderation later</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
