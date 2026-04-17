"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getAddress, toHex } from "viem";
import { useConnection, useConnect, useDisconnect } from "wagmi";

import {
  authNonceResponseSchema,
  authSessionResponseSchema,
  type AuthSessionResponse
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  ActionLink,
  MetricTile,
  Pill,
  ActionRow,
  SurfaceCard
} from "@ai-nft-forge/ui";

import { CollectibleHeroArtwork } from "../../../components/collectible-visuals";
import {
  defaultWalletAuthChain,
  getWalletChainLabel
} from "../../../lib/wallet/chains";

type SignInClientProps = {
  initialSession: AuthSessionResponse["session"];
};

type NoticeState = {
  message: string;
  tone: NoticeTone;
} | null;

type BaseAccountWalletConnectResponse = {
  accounts: Array<{
    address: string;
    capabilities?: {
      signInWithEthereum?: {
        message: string;
        signature: `0x${string}`;
      };
    };
  }>;
};

type BrowserEthereumProvider = {
  request(input: { method: string; params?: unknown[] }): Promise<unknown>;
};

type SupportedConnectorId = "baseAccount" | "injected";

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 400:
      return "The authentication request was invalid.";
    case 401:
      return "Wallet authentication failed.";
    default:
      return "The authentication request could not be completed.";
  }
}

async function parseJsonResponse<T>(input: {
  response: Response;
  schema: {
    parse(value: unknown): T;
  };
}) {
  const payload = await input.response.json().catch(() => null);

  if (!input.response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message);
    }

    throw new Error(createFallbackErrorMessage(input.response));
  }

  return input.schema.parse(payload);
}

function extractAuthStatement(message: string) {
  return message.split("\n")[0]?.trim() || "Sign in to AI NFT Forge";
}

function shortHex(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

type NoticeTone = "error" | "info" | "success";

function formatNoticeToneClass(tone: NoticeTone | null) {
  if (!tone) {
    return "";
  }

  if (tone === "error") {
    return "border-red-400/55 bg-red-500/12 text-red-100";
  }

  if (tone === "success") {
    return "border-emerald-400/45 bg-emerald-500/12 text-emerald-100";
  }

  return "border-cyan-400/40 bg-cyan-500/15 text-cyan-100";
}

export function SignInClient({ initialSession }: SignInClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState(initialSession);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [activeAction, setActiveAction] = useState<
    "base" | "browser" | "logout" | null
  >(null);
  const walletConnection = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const nextPath = searchParams.get("next") || "/studio";
  const baseAccountConnector =
    connectors.find((connector) => connector.id === "baseAccount") ?? null;
  const browserWalletConnector =
    connectors.find((connector) => connector.id === "injected") ?? null;
  const availableConnectorCount =
    Number(Boolean(baseAccountConnector)) +
    Number(Boolean(browserWalletConnector));
  const connectedWalletAddress = walletConnection.address ?? null;
  const connectedWalletChainLabel = getWalletChainLabel(
    walletConnection.chainId ?? null
  );

  async function issueNonce(walletAddress: string) {
    const response = await fetch("/api/auth/nonce", {
      body: JSON.stringify({
        walletAddress
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    return parseJsonResponse({
      response,
      schema: authNonceResponseSchema
    });
  }

  async function verifySession(input: {
    nonce: string;
    signature: `0x${string}`;
    signedMessage?: string;
    walletAddress: string;
  }) {
    const response = await fetch("/api/auth/verify", {
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    return parseJsonResponse({
      response,
      schema: authSessionResponseSchema
    });
  }

  async function connectWallet(connectorId: SupportedConnectorId) {
    const connector =
      connectorId === "baseAccount"
        ? baseAccountConnector
        : browserWalletConnector;

    if (!connector) {
      throw new Error(
        connectorId === "baseAccount"
          ? "Base Account is not available in this browser."
          : "No browser wallet connector is available in this browser."
      );
    }

    const result = await connectAsync({
      connector,
      ...(connectorId === "baseAccount"
        ? {
            chainId: defaultWalletAuthChain.id
          }
        : {})
    });
    const walletAddress = result.accounts[0];

    if (!walletAddress) {
      throw new Error(
        "The wallet did not return an address for this browser session."
      );
    }

    const provider =
      (await connector.getProvider()) as BrowserEthereumProvider | null;

    if (!provider) {
      throw new Error("The connected wallet provider is unavailable.");
    }

    return {
      provider,
      walletAddress: getAddress(walletAddress)
    };
  }

  async function handleBaseAccountSignIn() {
    setActiveAction("base");
    setNotice({
      message: "Connecting Base Account and requesting a server nonce…",
      tone: "info"
    });

    try {
      const { provider, walletAddress } = await connectWallet("baseAccount");
      const nonceResponse = await issueNonce(walletAddress);
      const authResult = (await provider.request({
        method: "wallet_connect",
        params: [
          {
            capabilities: {
              signInWithEthereum: {
                chainId: toHex(defaultWalletAuthChain.id),
                domain: window.location.host,
                nonce: nonceResponse.nonce,
                statement: extractAuthStatement(nonceResponse.message),
                uri: `${window.location.origin}/sign-in`,
                version: "1"
              }
            }
          }
        ]
      })) as BaseAccountWalletConnectResponse;
      const account = authResult.accounts[0];
      const siweCapability = account?.capabilities?.signInWithEthereum;

      if (
        !account?.address ||
        !siweCapability?.message ||
        !siweCapability.signature
      ) {
        throw new Error(
          "Base Account did not return a SIWE message and signature."
        );
      }

      if (getAddress(account.address) !== walletAddress) {
        throw new Error(
          "Base Account returned a different address than the connected wallet."
        );
      }

      const sessionResponse = await verifySession({
        nonce: nonceResponse.nonce,
        signature: siweCapability.signature,
        signedMessage: siweCapability.message,
        walletAddress
      });

      setSession(sessionResponse.session);
      setNotice({
        message:
          "Signed in with Base Account. Redirecting to the requested route…",
        tone: "success"
      });
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Base Account sign-in failed.",
        tone: "error"
      });
    } finally {
      setActiveAction(null);
    }
  }

  async function handleBrowserWalletSignIn() {
    setActiveAction("browser");
    setNotice({
      message: "Connecting browser wallet and requesting a server nonce…",
      tone: "info"
    });

    try {
      const { provider, walletAddress } = await connectWallet("injected");
      const nonceResponse = await issueNonce(walletAddress);
      const signature = await provider.request({
        method: "personal_sign",
        params: [nonceResponse.message, walletAddress]
      });

      if (typeof signature !== "string") {
        throw new Error("The browser wallet did not return a signature.");
      }

      const sessionResponse = await verifySession({
        nonce: nonceResponse.nonce,
        signature: signature as `0x${string}`,
        walletAddress
      });

      setSession(sessionResponse.session);
      setNotice({
        message: "Signed in with the connected browser wallet. Redirecting…",
        tone: "success"
      });
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Browser wallet sign-in failed.",
        tone: "error"
      });
    } finally {
      setActiveAction(null);
    }
  }

  async function handleLogout() {
    setActiveAction("logout");
    setNotice({
      message: "Ending the current studio session…",
      tone: "info"
    });

    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      await disconnectAsync().catch(() => undefined);
      setSession(null);
      setNotice({
        message: "Studio session cleared for this browser.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Logout could not be completed.",
        tone: "error"
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <>
      <SurfaceCard
        body="Sign in with Base Account or a standard injected wallet. Both paths terminate at the same server-issued nonce, signature verification, and HTTP-only session boundary."
        eyebrow="Interactive"
        span={8}
        title="Wallet sign-in"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile
            label="Studio session"
            value={session ? "Authenticated" : "Not signed in"}
          />
          <MetricTile
            label="Connected wallet"
            value={
              connectedWalletAddress ? shortHex(connectedWalletAddress) : "None"
            }
          />
          <MetricTile
            label="Connector"
            value={walletConnection.connector?.name ?? "Not connected"}
          />
        </div>
        <ActionRow className="mt-3">
          <Pill>{availableConnectorCount} wallet path(s) ready</Pill>
          <Pill>Next: {nextPath}</Pill>
          {connectedWalletChainLabel ? (
            <Pill>{connectedWalletChainLabel}</Pill>
          ) : null}
          {session?.user.walletAddress ? (
            <Pill>Owner {shortHex(session.user.walletAddress)}</Pill>
          ) : null}
        </ActionRow>
        <CollectibleHeroArtwork
          accentVar="--color-accent"
          badge={
            session?.user.walletAddress
              ? `Owner ${shortHex(session.user.walletAddress)}`
              : "Sign-in first"
          }
          className="mt-2"
          imageAlt="Wallet authentication artwork"
          imageUrl={null}
          meta={
            session?.user.walletAddress
              ? "Session-backed auth boundary is active."
              : "Server-issued nonce then signature, then signed cookie session."
          }
          title="Secure access"
        />
        {notice ? (
          <div
            className={`mt-3 rounded-xl border p-2.5 text-sm ${formatNoticeToneClass(
              notice?.tone ?? null
            )}`}
          >
            {notice.message}
          </div>
        ) : null}
        <ActionRow className="mt-4">
          <ActionButton
            disabled={!baseAccountConnector || activeAction !== null}
            onClick={() => {
              void handleBaseAccountSignIn();
            }}
            tone="accent"
            type="button"
          >
            {activeAction === "base"
              ? "Signing in…"
              : "Sign in with Base Account"}
          </ActionButton>
          <ActionButton
            disabled={!browserWalletConnector || activeAction !== null}
            onClick={() => {
              void handleBrowserWalletSignIn();
            }}
            tone="primary"
            type="button"
          >
            {activeAction === "browser"
              ? "Signing in…"
              : "Sign in with browser wallet"}
          </ActionButton>
          {session ? (
            <ActionButton
              disabled={activeAction !== null}
              onClick={() => {
                void handleLogout();
              }}
              tone="secondary"
              type="button"
            >
              {activeAction === "logout" ? "Signing out…" : "Sign out"}
            </ActionButton>
          ) : null}
          <ActionLink href={nextPath}>Continue</ActionLink>
        </ActionRow>
      </SurfaceCard>
      <SurfaceCard
        body="The authenticated studio session remains server-owned. Wallet connection state is a client convenience for sign-in and later onchain actions."
        eyebrow="Current state"
        span={4}
        title={session ? "Authenticated session detected" : "No session yet"}
      >
        <div className="grid gap-3">
          <MetricTile label="Authenticated" value={session ? "Yes" : "No"} />
          <MetricTile
            label="Session wallet"
            value={session?.user.walletAddress ?? "Not signed in"}
          />
          <MetricTile
            label="Studio access"
            value={session ? "Allowed" : "Redirects to sign-in"}
          />
        </div>
      </SurfaceCard>
    </>
  );
}
