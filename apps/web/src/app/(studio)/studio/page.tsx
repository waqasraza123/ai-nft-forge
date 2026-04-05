import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { getCurrentAuthSession } from "../../../server/auth/session";

export default async function StudioPage() {
  const session = await getCurrentAuthSession();

  return (
    <PageShell
      eyebrow="Studio"
      title="Operational shell for curation and release prep"
      lead="This route is session-protected and now includes the first source asset intake slice. Generation, curation, and publication workflows still land in later Phase 2 and Phase 3 steps."
      actions={
        <>
          <Link className="action-link" href="/studio/assets">
            Open assets
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
          body="Source asset upload intents and upload completion tracking now exist behind the protected studio surface."
          eyebrow="Current slice"
          title="Protected source asset intake"
        >
          <div className="pill-row">
            <Pill>{session?.user.walletAddress ?? "Session required"}</Pill>
            <Link className="inline-link" href="/studio/assets">
              /studio/assets
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The current session is resolved on the server before this route renders, and protected asset routes use the same session boundary."
          eyebrow="Session"
          title="Server-side access control"
        />
        <SurfaceCard
          body="Uploads now have a durable backend contract. Generation and minting remain intentionally deferred."
          eyebrow="Guardrail"
          title="Feature logic stays out"
        >
          <div className="pill-row">
            <Pill>Upload contract landed</Pill>
            <Pill>Generation deferred</Pill>
            <Pill>Minting deferred</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
