import Link from "next/link";

import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { getCurrentAuthSession } from "../../../server/auth/session";

export default async function SignInPage() {
  const session = await getCurrentAuthSession();

  return (
    <PageShell
      eyebrow="Auth"
      title="Server-verified wallet session foundation"
      lead="Phase 1 lands the nonce and session contract before a polished wallet UI. The server issues a nonce, verifies a signature, and stores the session in the database."
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
      tone="default"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="The browser requests a nonce, signs the server-defined message, and submits the signature for verification. A valid signature becomes an HTTP-only session cookie."
          eyebrow="Flow"
          title="Wallet auth contract"
        >
          <div className="pill-row">
            <Pill>POST /api/auth/nonce</Pill>
            <Pill>POST /api/auth/verify</Pill>
            <Pill>GET /api/auth/session</Pill>
            <Pill>POST /api/auth/logout</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The studio route is now protected by server-side session lookup. Later UI work can plug Base Account and wallet fallback experiences into the same server contract."
          eyebrow="Boundary"
          title="Protected studio shell"
        >
          <div className="pill-row">
            <Link className="inline-link" href="/studio">
              Open studio
            </Link>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body={
            session
              ? "A valid studio session is currently present in this browser."
              : "No active studio session is present in this browser."
          }
          eyebrow="Current state"
          span={8}
          title={session ? "Authenticated session detected" : "No session yet"}
        >
          <div className="metric-list">
            <MetricTile label="Authenticated" value={session ? "Yes" : "No"} />
            <MetricTile
              label="Wallet"
              value={session?.user.walletAddress ?? "Not signed in"}
            />
            <MetricTile
              label="Studio access"
              value={session ? "Allowed" : "Redirects to sign-in"}
            />
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="A polished client wallet flow is intentionally deferred. The durable server contract is what matters in this commit."
          eyebrow="Guardrail"
          span={4}
          title="UI stays thin"
        />
      </SurfaceGrid>
    </PageShell>
  );
}
