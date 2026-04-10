import { z } from "zod";

import { walletAddressSchema } from "./auth.js";

export const evmAddressSchema = walletAddressSchema;
export const evmTransactionHashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format");
export const evmHexDataSchema = z
  .string()
  .trim()
  .regex(/^0x(?:[a-fA-F0-9]{2})*$/, "Invalid hexadecimal data");

export const collectionContractChainKeySchema = z.enum([
  "base-sepolia",
  "base"
]);

export const collectionContractChainNetworkSchema = z.enum([
  "development",
  "production"
]);

export const collectionContractChainSchema = z.object({
  chainId: z.number().int().positive(),
  key: collectionContractChainKeySchema,
  label: z.string().trim().min(1).max(40),
  network: collectionContractChainNetworkSchema
});

export const collectionOnchainDeploymentSummarySchema = z.object({
  chain: collectionContractChainSchema,
  contractAddress: evmAddressSchema,
  deployedAt: z.string().datetime(),
  deployTxHash: evmTransactionHashSchema
});

export const collectionOnchainMintSummarySchema = z.object({
  id: z.string().min(1),
  mintedAt: z.string().datetime(),
  recipientWalletAddress: walletAddressSchema,
  tokenId: z.number().int().positive(),
  txHash: evmTransactionHashSchema
});

export const collectionContractDeploymentIntentRequestSchema = z.object({
  chainKey: collectionContractChainKeySchema
});

export const collectionContractDeploymentIntentResponseSchema = z.object({
  deployment: z.object({
    chain: collectionContractChainSchema,
    contractName: z.string().trim().min(1).max(160),
    contractSymbol: z.string().regex(/^[A-Z0-9]{1,11}$/),
    ownerWalletAddress: walletAddressSchema,
    tokenUriBaseUrl: z.string().url(),
    transaction: z.object({
      data: evmHexDataSchema,
      to: z.null(),
      value: z.literal("0x0")
    })
  })
});

export const collectionContractDeploymentRecordRequestSchema = z.object({
  chainKey: collectionContractChainKeySchema,
  deployTxHash: evmTransactionHashSchema
});

export const collectionContractMintIntentRequestSchema = z.object({
  recipientWalletAddress: walletAddressSchema,
  tokenId: z.number().int().positive()
});

export const collectionContractMintIntentResponseSchema = z.object({
  mint: z.object({
    chain: collectionContractChainSchema,
    contractAddress: evmAddressSchema,
    recipientWalletAddress: walletAddressSchema,
    tokenId: z.number().int().positive(),
    transaction: z.object({
      data: evmHexDataSchema,
      to: evmAddressSchema,
      value: z.literal("0x0")
    })
  })
});

export const collectionContractMintRecordRequestSchema = z.object({
  recipientWalletAddress: walletAddressSchema,
  tokenId: z.number().int().positive(),
  txHash: evmTransactionHashSchema
});

export type CollectionContractChain = z.infer<
  typeof collectionContractChainSchema
>;
export type CollectionContractChainKey = z.infer<
  typeof collectionContractChainKeySchema
>;
export type CollectionContractChainNetwork = z.infer<
  typeof collectionContractChainNetworkSchema
>;
export type CollectionContractDeploymentIntentRequest = z.infer<
  typeof collectionContractDeploymentIntentRequestSchema
>;
export type CollectionContractDeploymentIntentResponse = z.infer<
  typeof collectionContractDeploymentIntentResponseSchema
>;
export type CollectionContractDeploymentRecordRequest = z.infer<
  typeof collectionContractDeploymentRecordRequestSchema
>;
export type CollectionContractMintIntentRequest = z.infer<
  typeof collectionContractMintIntentRequestSchema
>;
export type CollectionContractMintIntentResponse = z.infer<
  typeof collectionContractMintIntentResponseSchema
>;
export type CollectionContractMintRecordRequest = z.infer<
  typeof collectionContractMintRecordRequestSchema
>;
export type CollectionOnchainDeploymentSummary = z.infer<
  typeof collectionOnchainDeploymentSummarySchema
>;
export type CollectionOnchainMintSummary = z.infer<
  typeof collectionOnchainMintSummarySchema
>;
