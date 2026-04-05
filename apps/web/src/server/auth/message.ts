import { getAddress, verifyMessage, type Address } from "viem";

import { AuthServiceError } from "./error";

export function normalizeWalletAddress(walletAddress: string): Address {
  try {
    return getAddress(walletAddress);
  } catch {
    throw new AuthServiceError(
      "WALLET_ADDRESS_INVALID",
      "Wallet address is invalid.",
      400
    );
  }
}

export function createAuthMessage(input: {
  nonce: string;
  statement: string;
  walletAddress: string;
}): string {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  return [
    input.statement,
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${input.nonce}`
  ].join("\n");
}

export async function verifyAuthMessageSignature(input: {
  nonce: string;
  signature: `0x${string}`;
  statement: string;
  walletAddress: string;
}): Promise<boolean> {
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const message = createAuthMessage({
    nonce: input.nonce,
    statement: input.statement,
    walletAddress
  });

  return verifyMessage({
    address: walletAddress,
    message,
    signature: input.signature as `0x${string}`
  });
}
