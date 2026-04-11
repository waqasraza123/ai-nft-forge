import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { getCurrentStudioAccess } from "../../../server/studio/access";

export default async function StudioPage() {
  const access = await getCurrentStudioAccess();

  return (
    <PageShell
      eyebrow="Studio"
      title="Operational shell for curation and release prep"
      lead="This route is session-protected and now includes source asset intake, collection curation, live publication, owner-side commerce administration, and durable studio settings for the owner brand profile. Onchain mint fulfillment remains intentionally deferred from the studio shell."
      actions={
        <>
          <Link className="action-link" href="/studio/assets">
            Open assets
          </Link>
          <Link className="action-link" href="/studio/collections">
            Open collections
          </Link>
          <Link className="action-link" href="/studio/commerce">
            Open commerce
          </Link>
          <Link className="action-link" href="/studio/settings">
            Open settings
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
          body="Source asset upload intents, upload completion tracking, and generation history now exist behind the protected studio surface."
          eyebrow="Current slice"
          title="Protected source asset intake"
        >
          <div className="pill-row">
            <Pill>{access?.owner.walletAddress ?? "Session required"}</Pill>
            <Pill>{access?.role === "owner" ? "Owner access" : "Operator access"}</Pill>
            <Link className="inline-link" href="/studio/assets">
              /studio/assets
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The collection draft surface now lets the owner create ordered curation sets from generated variants, mark them review-ready, and publish them to a live public route."
          eyebrow="Phase 3"
          title="Collection draft curation"
        >
          <div className="pill-row">
            <Pill>Owner-scoped drafts</Pill>
            <Pill>Ordered curation</Pill>
            <Pill>Live publication</Pill>
            <Link className="inline-link" href="/studio/collections">
              /studio/collections
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Workspace and brand identity are now persisted on a protected settings route and reused by collection publication instead of per-draft freeform brand entry."
          eyebrow="Identity"
          title="Durable studio settings"
        >
          <div className="pill-row">
            <Pill>Workspace profile</Pill>
            <Pill>Brand profile</Pill>
            <Pill>Publication defaults</Pill>
            <Link className="inline-link" href="/studio/settings">
              /studio/settings
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Reservations, hosted checkout sessions, payment completion, and fulfillment tracking now have a protected operations surface for the owner."
          eyebrow="Commerce"
          title="Owner-side commerce administration"
        >
          <div className="pill-row">
            <Pill>Reservations</Pill>
            <Pill>Checkout sessions</Pill>
            <Pill>Fulfillment state</Pill>
            <Link className="inline-link" href="/studio/commerce">
              /studio/commerce
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The current session is resolved on the server before these routes render, and protected studio APIs use the same session boundary."
          eyebrow="Session"
          title="Server-side access control"
        />
        <SurfaceCard
          body="Uploads, generation, curation, publication, commerce administration, and settings now have durable backend contracts. Onchain mint fulfillment remains intentionally deferred."
          eyebrow="Guardrail"
          title="Feature logic stays out"
        >
          <div className="pill-row">
            <Pill>Upload contract landed</Pill>
            <Pill>Curation landed</Pill>
            <Pill>Publication landed</Pill>
            <Pill>Commerce admin landed</Pill>
            <Pill>Settings landed</Pill>
            <Pill>Minting deferred</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
