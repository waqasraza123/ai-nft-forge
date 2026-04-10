import type { CollectionContractChainKey } from "@ai-nft-forge/shared";
import { toHex, type Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

export const defaultWalletAuthChain = base;

export const walletChains = {
  base,
  "base-sepolia": baseSepolia
} satisfies Record<CollectionContractChainKey, Chain>;

export function getWalletChainByKey(key: CollectionContractChainKey) {
  return walletChains[key];
}

export function getWalletChainLabel(chainId: number | null) {
  if (chainId === null) {
    return null;
  }

  const matchingChain = Object.values(walletChains).find(
    (chain) => chain.id === chainId
  );

  return matchingChain?.name ?? `Chain ${chainId}`;
}

export function createWalletAddChainParameters(chain: Chain) {
  return {
    chainId: toHex(chain.id),
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls.default.http,
    ...(chain.blockExplorers?.default
      ? {
          blockExplorerUrls: [chain.blockExplorers.default.url]
        }
      : {})
  };
}
