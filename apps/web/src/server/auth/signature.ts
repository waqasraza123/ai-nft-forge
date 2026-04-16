import { createPublicClient, getAddress, http, verifyMessage } from "viem";
import { parseSiweMessage } from "viem/siwe";
import { base, baseSepolia, type Chain } from "viem/chains";

import { AuthServiceError } from "./error";
import { normalizeWalletAddress } from "./message";

const authSupportedChains: Record<
  number,
  { chain: Chain; defaultRpcUrl: string }
> = {
  [base.id]: {
    chain: base,
    defaultRpcUrl: base.rpcUrls.default.http[0] ?? "https://mainnet.base.org"
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    defaultRpcUrl:
      baseSepolia.rpcUrls.default.http[0] ?? "https://sepolia.base.org"
  }
};

type AuthSignatureVerificationInput = {
  expectedDomain?: string | null;
  nonce: string;
  signature: `0x${string}`;
  signedMessage?: string;
  statement: string;
  walletAddress: string;
};

function getSiweRpcUrl(chainId: number, rawEnvironment: NodeJS.ProcessEnv) {
  if (chainId === base.id) {
    return rawEnvironment.ONCHAIN_BASE_RPC_URL ?? base.rpcUrls.default.http[0]!;
  }

  if (chainId === baseSepolia.id) {
    return (
      rawEnvironment.ONCHAIN_BASE_SEPOLIA_RPC_URL ??
      baseSepolia.rpcUrls.default.http[0]!
    );
  }

  throw new AuthServiceError(
    "SIGNATURE_INVALID",
    "The provided SIWE message targeted an unsupported chain.",
    401
  );
}

export function createAuthSignatureVerifier(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const publicClients = new Map<
    number,
    ReturnType<typeof createPublicClient>
  >();

  function getPublicClient(chainId: number) {
    const existingClient = publicClients.get(chainId);

    if (existingClient) {
      return existingClient;
    }

    const supportedChain = authSupportedChains[chainId];

    if (!supportedChain) {
      throw new AuthServiceError(
        "SIGNATURE_INVALID",
        "The provided SIWE message targeted an unsupported chain.",
        401
      );
    }

    const client = createPublicClient({
      chain: supportedChain.chain,
      transport: http(getSiweRpcUrl(chainId, rawEnvironment))
    });

    publicClients.set(chainId, client);

    return client;
  }

  return async function verifyAuthSignature(
    input: AuthSignatureVerificationInput
  ): Promise<boolean> {
    const walletAddress = normalizeWalletAddress(input.walletAddress);

    if (!input.signedMessage) {
      return verifyMessage({
        address: walletAddress,
        message: [
          input.statement,
          "",
          `Wallet: ${walletAddress}`,
          `Nonce: ${input.nonce}`
        ].join("\n"),
        signature: input.signature
      });
    }

    let parsedMessage: ReturnType<typeof parseSiweMessage> | null = null;

    try {
      parsedMessage = parseSiweMessage(input.signedMessage);
    } catch {
      return false;
    }

    if (!parsedMessage.address || !parsedMessage.chainId) {
      return false;
    }

    if (parsedMessage.statement !== input.statement) {
      return false;
    }

    const normalizedMessageAddress = getAddress(parsedMessage.address);

    if (normalizedMessageAddress !== walletAddress) {
      return false;
    }

    const eoaSignatureValid = await verifyMessage({
      address: walletAddress,
      message: input.signedMessage,
      signature: input.signature
    }).catch(() => false);

    if (eoaSignatureValid) {
      return true;
    }

    return getPublicClient(parsedMessage.chainId)
      .verifySiweMessage({
        address: walletAddress,
        ...(input.expectedDomain ? { domain: input.expectedDomain } : {}),
        message: input.signedMessage,
        nonce: input.nonce,
        signature: input.signature,
        time: new Date()
      })
      .catch(() => false);
  };
}
