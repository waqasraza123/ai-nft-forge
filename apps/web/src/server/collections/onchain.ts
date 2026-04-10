import { getAiNftForgeCollectionContractArtifact } from "@ai-nft-forge/contracts/server";
import type { CollectionContractChainKey } from "@ai-nft-forge/shared";
import {
  createPublicClient,
  getAddress,
  http,
  isAddressEqual,
  type Abi
} from "viem";
import { base, baseSepolia, type Chain } from "viem/chains";

import { CollectionDraftServiceError } from "./error";

const defaultChainRpcUrls = {
  base: base.rpcUrls.default.http[0] ?? "https://mainnet.base.org",
  "base-sepolia":
    baseSepolia.rpcUrls.default.http[0] ?? "https://sepolia.base.org"
} satisfies Record<CollectionContractChainKey, string>;

const supportedViemChains = {
  base,
  "base-sepolia": baseSepolia
} satisfies Record<CollectionContractChainKey, Chain>;

type CollectionOnchainRuntime = {
  verifyDeploymentTransaction(input: {
    chainKey: CollectionContractChainKey;
    deployTxHash: `0x${string}`;
    expectedContractName: string;
    expectedContractSymbol: string;
    expectedDeploymentData: `0x${string}`;
    expectedOwnerWalletAddress: string;
    expectedTokenUriBaseUrl: string;
  }): Promise<{
    contractAddress: string;
    deployedAt: Date;
    deployTxHash: string;
  }>;
  verifyMintTransaction(input: {
    chainKey: CollectionContractChainKey;
    contractAddress: string;
    expectedMintData: `0x${string}`;
    expectedOwnerWalletAddress: string;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: `0x${string}`;
  }): Promise<{
    mintedAt: Date;
    txHash: string;
  }>;
};

function createOnchainError(
  code:
    | "ONCHAIN_TRANSACTION_MISMATCH"
    | "ONCHAIN_TRANSACTION_NOT_FOUND"
    | "ONCHAIN_TRANSACTION_REVERTED"
    | "ONCHAIN_TRANSACTION_UNCONFIRMED",
  message: string,
  statusCode = 409
) {
  return new CollectionDraftServiceError(code, message, statusCode);
}

function getChainByKey(key: CollectionContractChainKey) {
  return supportedViemChains[key];
}

function getRpcUrlByChainKey(
  chainKey: CollectionContractChainKey,
  rawEnvironment: NodeJS.ProcessEnv
) {
  if (chainKey === "base") {
    return rawEnvironment.ONCHAIN_BASE_RPC_URL ?? defaultChainRpcUrls.base;
  }

  return (
    rawEnvironment.ONCHAIN_BASE_SEPOLIA_RPC_URL ??
    defaultChainRpcUrls["base-sepolia"]
  );
}

function createTimestampDate(unixTimestampSeconds: bigint) {
  return new Date(Number(unixTimestampSeconds) * 1000);
}

export function createCollectionOnchainRuntime(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): CollectionOnchainRuntime {
  const publicClients = new Map<CollectionContractChainKey, unknown>();

  function getPublicClient(chainKey: CollectionContractChainKey) {
    const cachedClient = publicClients.get(
      chainKey
    ) as ReturnType<typeof createPublicClient> | undefined;

    if (cachedClient) {
      return cachedClient;
    }

    const client = createPublicClient({
      chain: getChainByKey(chainKey),
      transport: http(getRpcUrlByChainKey(chainKey, rawEnvironment))
    });

    publicClients.set(chainKey, client);

    return client as ReturnType<typeof createPublicClient>;
  }

  return {
    async verifyDeploymentTransaction(input) {
      const publicClient = getPublicClient(input.chainKey);
      const artifact = getAiNftForgeCollectionContractArtifact();
      const contractAbi = artifact.abi as Abi;
      const transaction = await publicClient
        .getTransaction({
          hash: input.deployTxHash
        })
        .catch(() => null);

      if (!transaction) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_NOT_FOUND",
          "The deployment transaction could not be found on the selected chain.",
          404
        );
      }

      const receipt = await publicClient
        .getTransactionReceipt({
          hash: input.deployTxHash
        })
        .catch(() => null);

      if (!receipt) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_UNCONFIRMED",
          "The deployment transaction has not been confirmed onchain yet."
        );
      }

      if (receipt.status !== "success") {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_REVERTED",
          "The deployment transaction reverted onchain."
        );
      }

      if (
        !isAddressEqual(transaction.from, getAddress(input.expectedOwnerWalletAddress))
      ) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The deployment transaction was not submitted by the authenticated owner wallet."
        );
      }

      if (transaction.to !== null || transaction.input !== input.expectedDeploymentData) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The deployment transaction payload does not match the prepared collection deployment intent."
        );
      }

      if (!receipt.contractAddress) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The deployment receipt did not produce a contract address."
        );
      }

      const normalizedContractAddress = getAddress(receipt.contractAddress);
      const bytecode = await publicClient.getBytecode({
        address: normalizedContractAddress
      });

      if (!bytecode || bytecode === "0x") {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The deployed contract bytecode could not be verified onchain."
        );
      }

      const [contractOwner, contractName, contractSymbol, baseTokenUri, block] =
        await Promise.all([
          publicClient.readContract({
            abi: contractAbi,
            address: normalizedContractAddress,
            functionName: "owner"
          }),
          publicClient.readContract({
            abi: contractAbi,
            address: normalizedContractAddress,
            functionName: "name"
          }),
          publicClient.readContract({
            abi: contractAbi,
            address: normalizedContractAddress,
            functionName: "symbol"
          }),
          publicClient.readContract({
            abi: contractAbi,
            address: normalizedContractAddress,
            functionName: "baseTokenUri"
          }),
          publicClient.getBlock({
            blockHash: receipt.blockHash
          })
        ]);

      if (
        !isAddressEqual(
          contractOwner as `0x${string}`,
          getAddress(input.expectedOwnerWalletAddress)
        ) ||
        contractName !== input.expectedContractName ||
        contractSymbol !== input.expectedContractSymbol ||
        baseTokenUri !== input.expectedTokenUriBaseUrl
      ) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The deployed contract state does not match the prepared collection deployment intent."
        );
      }

      return {
        contractAddress: normalizedContractAddress,
        deployedAt: createTimestampDate(block.timestamp),
        deployTxHash: receipt.transactionHash
      };
    },

    async verifyMintTransaction(input) {
      const publicClient = getPublicClient(input.chainKey);
      const artifact = getAiNftForgeCollectionContractArtifact();
      const contractAbi = artifact.abi as Abi;
      const normalizedContractAddress = getAddress(input.contractAddress);
      const normalizedOwnerWalletAddress = getAddress(
        input.expectedOwnerWalletAddress
      );
      const normalizedRecipientWalletAddress = getAddress(
        input.recipientWalletAddress
      );
      const transaction = await publicClient
        .getTransaction({
          hash: input.txHash
        })
        .catch(() => null);

      if (!transaction) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_NOT_FOUND",
          "The mint transaction could not be found on the selected chain.",
          404
        );
      }

      const receipt = await publicClient
        .getTransactionReceipt({
          hash: input.txHash
        })
        .catch(() => null);

      if (!receipt) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_UNCONFIRMED",
          "The mint transaction has not been confirmed onchain yet."
        );
      }

      if (receipt.status !== "success") {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_REVERTED",
          "The mint transaction reverted onchain."
        );
      }

      if (!isAddressEqual(transaction.from, normalizedOwnerWalletAddress)) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The mint transaction was not submitted by the authenticated owner wallet."
        );
      }

      if (
        !transaction.to ||
        !isAddressEqual(transaction.to, normalizedContractAddress) ||
        transaction.input !== input.expectedMintData
      ) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The mint transaction payload does not match the prepared token mint intent."
        );
      }

      const [recordedOwner, block] = await Promise.all([
        publicClient.readContract({
          abi: contractAbi,
          address: normalizedContractAddress,
          functionName: "ownerOf",
          args: [BigInt(input.tokenId)]
        }),
        publicClient.getBlock({
          blockHash: receipt.blockHash
        })
      ]);

      if (
        !isAddressEqual(
          recordedOwner as `0x${string}`,
          normalizedRecipientWalletAddress
        )
      ) {
        throw createOnchainError(
          "ONCHAIN_TRANSACTION_MISMATCH",
          "The onchain token owner does not match the requested mint recipient."
        );
      }

      return {
        mintedAt: createTimestampDate(block.timestamp),
        txHash: receipt.transactionHash
      };
    }
  };
}

export type { CollectionOnchainRuntime };
