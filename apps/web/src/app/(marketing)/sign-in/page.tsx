import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { getCurrentAuthSession } from "../../../server/auth/session";

import { SignInClient } from "./sign-in-client";

export default async function SignInPage() {
  const session = await getCurrentAuthSession();

  return (
    <PageShell
      eyebrow="Auth"
      title="Wallet access and Base Account sign-in"
      lead="Phase 8 turns the wallet-auth placeholder into a real sign-in surface. Base Account now uses a SIWE-capable flow on top of the existing server nonce and session contract, while standard injected wallets still work through the same backend boundary."
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
        <SignInClient initialSession={session} />
        <SurfaceCard
          body="The server remains the source of truth: it issues the nonce, verifies either the classic wallet signature or the SIWE message returned by Base Account, and sets the HTTP-only session cookie."
          eyebrow="Flow"
          span={6}
          title="Server auth contract"
        >
          <div className="pill-row">
            <Pill>POST /api/auth/nonce</Pill>
            <Pill>POST /api/auth/verify</Pill>
            <Pill>GET /api/auth/session</Pill>
            <Pill>POST /api/auth/logout</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The same wallet connection layer also feeds collection deployment and minting, so the signed-in owner can stay on a single Base Account or browser-wallet path from auth through onchain execution."
          eyebrow="Boundary"
          span={6}
          title="Shared wallet UX"
        >
          <div className="pill-row">
            <Pill>Base Account</Pill>
            <Pill>Injected wallet</Pill>
            <Pill>/studio/collections</Pill>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
