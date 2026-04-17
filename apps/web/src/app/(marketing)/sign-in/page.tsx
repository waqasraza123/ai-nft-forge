import {
  ActionLink,
  ActionRow,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

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
          <ActionLink href="/api/auth/session">Session endpoint</ActionLink>
          <ActionLink href="/" tone="inline">
            Back to marketing
          </ActionLink>
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
          <ActionRow className="mt-2">
            <Pill>POST /api/auth/nonce</Pill>
            <Pill>POST /api/auth/verify</Pill>
            <Pill>GET /api/auth/session</Pill>
            <Pill>POST /api/auth/logout</Pill>
          </ActionRow>
        </SurfaceCard>
        <SurfaceCard
          body="The same wallet connection layer also feeds collection deployment and minting, so the signed-in owner can stay on a single Base Account or browser-wallet path from auth through onchain execution."
          eyebrow="Boundary"
          span={6}
          title="Shared wallet UX"
        >
          <ActionRow className="mt-2">
            <Pill>Base Account</Pill>
            <Pill>Injected wallet</Pill>
            <Pill>/studio/collections</Pill>
          </ActionRow>
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
