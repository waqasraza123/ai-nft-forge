import { z } from "zod";

import {
  collectionBrandNameSchema,
  collectionBrandSlugSchema,
  collectionDraftSlugSchema,
  collectionDraftTitleSchema
} from "./collections.js";

export const collectionContractStandardSchema = z.literal("erc721");

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

export const collectionPublicContractSchema = z.object({
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionUrl: z.string().url(),
  collectionSlug: collectionDraftSlugSchema,
  contractUrl: z.string().url(),
  description: z.string().max(1000).nullable(),
  itemCount: z.number().int().positive(),
  metadataUrl: z.string().url(),
  name: z.string().trim().min(1).max(160),
  publishedAt: z.string().datetime(),
  standard: collectionContractStandardSchema,
  supportedChains: z.array(collectionContractChainSchema).min(1),
  symbol: z.string().regex(/^[A-Z0-9]{1,11}$/),
  title: collectionDraftTitleSchema,
  tokenUriBaseUrl: z.string().url(),
  tokenUriExampleUrl: z.string().url(),
  tokenUriTemplate: z.string().min(1),
  updatedAt: z.string().datetime()
});

export const collectionPublicContractResponseSchema = z.object({
  contract: collectionPublicContractSchema
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
export type CollectionContractStandard = z.infer<
  typeof collectionContractStandardSchema
>;
export type CollectionPublicContract = z.infer<
  typeof collectionPublicContractSchema
>;
export type CollectionPublicContractResponse = z.infer<
  typeof collectionPublicContractResponseSchema
>;
