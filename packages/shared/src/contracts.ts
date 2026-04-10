import { z } from "zod";

import {
  collectionBrandNameSchema,
  collectionBrandSlugSchema,
  collectionDraftSlugSchema,
  collectionDraftTitleSchema
} from "./collections.js";
import {
  collectionContractChainSchema,
  collectionOnchainDeploymentSummarySchema
} from "./onchain.js";

export const collectionContractStandardSchema = z.literal("erc721");

export const collectionPublicContractSchema = z.object({
  activeDeployment: collectionOnchainDeploymentSummarySchema.nullable(),
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionUrl: z.string().url(),
  collectionSlug: collectionDraftSlugSchema,
  contractUrl: z.string().url(),
  description: z.string().max(1000).nullable(),
  itemCount: z.number().int().positive(),
  metadataUrl: z.string().url(),
  mintedTokenCount: z.number().int().min(0),
  mintedTokenIds: z.array(z.number().int().positive()),
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
export type CollectionContractStandard = z.infer<
  typeof collectionContractStandardSchema
>;
export type CollectionPublicContract = z.infer<
  typeof collectionPublicContractSchema
>;
export type CollectionPublicContractResponse = z.infer<
  typeof collectionPublicContractResponseSchema
>;
