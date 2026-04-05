import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { getCurrentAuthSession } from "../../../server/auth/session";

export default async function StudioPage() {
  const session = await getCurrentAuthSession();

  return (
    <PageShell
      eyebrow="Studio"
      title="Operational shell for curation and release prep"
      lead="This route is now session-protected. The calmer studio surface is still intentionally thin until upload, generation, and collection workflows land in later phases."
      actions={
        <>
          <Link className="action-link" href="/api/auth/session">
            Session endpoint
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
        >
          <div className="pill-row">
            <Pill>{session?.user.walletAddress ?? "Session required"}</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The current session is resolved on the server before this route renders."
          eyebrow="Session"
          title="Server-side access control"
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
