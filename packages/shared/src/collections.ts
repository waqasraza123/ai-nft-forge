import { z } from "zod";

import { generatedAssetModerationStatusSchema } from "./generated-assets.js";
import {
  collectionOnchainDeploymentSummarySchema,
  collectionOnchainMintSummarySchema
} from "./onchain.js";

export const collectionDraftStatusSchema = z.enum(["draft", "review_ready"]);

export const collectionDraftSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Expected a lowercase slug with letters, numbers, and single hyphens."
  });

export const collectionBrandSlugSchema = collectionDraftSlugSchema;
export const collectionBrandNameSchema = z.string().trim().min(1).max(120);
export const collectionDraftTitleSchema = z.string().trim().min(1).max(120);
export const collectionDraftDescriptionSchema = z.string().trim().max(1000);
export const collectionStorefrontStatusSchema = z.enum([
  "upcoming",
  "live",
  "sold_out",
  "ended"
]);
export const collectionStorefrontPriceLabelSchema = z.string().trim().max(60);
export const collectionStorefrontHeadlineSchema = z.string().trim().max(120);
export const collectionStorefrontBodySchema = z.string().trim().max(600);
export const collectionStorefrontCtaLabelSchema = z.string().trim().max(40);
export const collectionStorefrontCtaHrefSchema = z.string().trim().url();
export const collectionThemePresetSchema = z.enum([
  "editorial_warm",
  "gallery_mono",
  "midnight_launch"
]);

export const collectionGeneratedAssetCandidateSchema = z.object({
  createdAt: z.string().datetime(),
  generatedAssetId: z.string().min(1),
  generationRequestId: z.string().min(1),
  moderatedAt: z.string().datetime().nullable(),
  moderationStatus: generatedAssetModerationStatusSchema,
  pipelineKey: z.string().min(1),
  sourceAssetId: z.string().min(1),
  sourceAssetOriginalFilename: z.string().min(1),
  variantIndex: z.number().int().positive()
});

export const collectionPublicationSummarySchema = z.object({
  activeDeployment: collectionOnchainDeploymentSummarySchema.nullable(),
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionSlug: collectionDraftSlugSchema,
  displayOrder: z.number().int().min(0),
  endAt: z.string().datetime().nullable(),
  heroGeneratedAssetId: z.string().min(1).nullable(),
  id: z.string().min(1),
  isFeatured: z.boolean(),
  launchAt: z.string().datetime().nullable(),
  mintedTokenCount: z.number().int().min(0),
  mints: z.array(collectionOnchainMintSummarySchema),
  priceLabel: collectionStorefrontPriceLabelSchema.nullable(),
  primaryCtaHref: collectionStorefrontCtaHrefSchema.nullable(),
  primaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable(),
  publicPath: z.string().min(1),
  publishedAt: z.string().datetime(),
  remainingSupply: z.number().int().min(0).nullable(),
  secondaryCtaHref: collectionStorefrontCtaHrefSchema.nullable(),
  secondaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable(),
  soldCount: z.number().int().min(0),
  storefrontBody: collectionStorefrontBodySchema.nullable(),
  storefrontHeadline: collectionStorefrontHeadlineSchema.nullable(),
  storefrontStatus: collectionStorefrontStatusSchema,
  totalSupply: z.number().int().positive().nullable(),
  updatedAt: z.string().datetime()
});

export const collectionPublicBrandThemeSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  featuredReleaseLabel: z.string().min(1).max(40),
  heroKicker: z.string().max(60).nullable(),
  landingDescription: z.string().min(1).max(280),
  landingHeadline: collectionDraftTitleSchema,
  primaryCtaLabel: z.string().max(40).nullable(),
  secondaryCtaLabel: z.string().max(40).nullable(),
  storyBody: z.string().max(600).nullable(),
  storyHeadline: z.string().max(120).nullable(),
  themePreset: collectionThemePresetSchema,
  wordmark: z.string().max(40).nullable()
});

export const collectionDraftItemSummarySchema = z.object({
  generatedAsset: collectionGeneratedAssetCandidateSchema,
  id: z.string().min(1),
  position: z.number().int().positive()
});

export const collectionDraftSummarySchema = z.object({
  createdAt: z.string().datetime(),
  description: z.string().max(1000).nullable(),
  id: z.string().min(1),
  itemCount: z.number().int().min(0),
  items: z.array(collectionDraftItemSummarySchema),
  publication: collectionPublicationSummarySchema.nullable(),
  slug: collectionDraftSlugSchema,
  status: collectionDraftStatusSchema,
  title: collectionDraftTitleSchema,
  updatedAt: z.string().datetime()
});

export const collectionPublicItemSchema = z.object({
  generatedAssetId: z.string().min(1),
  imageUrl: z.string().url(),
  imageUrlExpiresAt: z.string().datetime().nullable(),
  pipelineKey: z.string().min(1),
  position: z.number().int().positive(),
  sourceAssetOriginalFilename: z.string().min(1),
  variantIndex: z.number().int().positive()
});

export const collectionPublicPageSchema = z.object({
  activeDeployment: collectionOnchainDeploymentSummarySchema.nullable(),
  availabilityLabel: z.string().min(1),
  brandPublicPath: z.string().min(1),
  brandTheme: collectionPublicBrandThemeSchema,
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionSlug: collectionDraftSlugSchema,
  description: z.string().max(1000).nullable(),
  endAt: z.string().datetime().nullable(),
  heroGeneratedAssetId: z.string().min(1).nullable(),
  heroImageUrl: z.string().url().nullable(),
  heroImageUrlExpiresAt: z.string().datetime().nullable(),
  items: z.array(collectionPublicItemSchema),
  launchAt: z.string().datetime().nullable(),
  mintedTokenCount: z.number().int().min(0),
  priceLabel: collectionStorefrontPriceLabelSchema.nullable(),
  primaryCtaHref: collectionStorefrontCtaHrefSchema.nullable(),
  primaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable(),
  publishedAt: z.string().datetime(),
  relatedCollections: z.array(
    z.object({
      collectionSlug: collectionDraftSlugSchema,
      displayOrder: z.number().int().min(0),
      isFeatured: z.boolean(),
      publicPath: z.string().min(1),
      storefrontStatus: collectionStorefrontStatusSchema,
      title: collectionDraftTitleSchema
    })
  ),
  remainingSupply: z.number().int().min(0).nullable(),
  secondaryCtaHref: collectionStorefrontCtaHrefSchema.nullable(),
  secondaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable(),
  soldCount: z.number().int().min(0),
  storefrontBody: collectionStorefrontBodySchema.nullable(),
  storefrontHeadline: collectionStorefrontHeadlineSchema.nullable(),
  storefrontStatus: collectionStorefrontStatusSchema,
  totalSupply: z.number().int().positive().nullable(),
  title: collectionDraftTitleSchema,
  updatedAt: z.string().datetime()
});

export const collectionMetadataAttributeSchema = z.object({
  traitType: z.string().trim().min(1).max(80),
  value: z.union([z.string().trim().min(1).max(200), z.number().finite()])
});

export const collectionPublicMetadataManifestItemSchema = z.object({
  editionNumber: z.number().int().positive(),
  generatedAssetId: z.string().min(1),
  metadataPath: z.string().min(1),
  name: z.string().min(1).max(160),
  pipelineKey: z.string().min(1),
  sourceAssetOriginalFilename: z.string().min(1),
  variantIndex: z.number().int().positive()
});

export const collectionPublicMetadataManifestSchema = z.object({
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionPath: z.string().min(1),
  collectionSlug: collectionDraftSlugSchema,
  description: z.string().max(1000).nullable(),
  itemCount: z.number().int().min(0),
  items: z.array(collectionPublicMetadataManifestItemSchema),
  metadataPath: z.string().min(1),
  publishedAt: z.string().datetime(),
  title: collectionDraftTitleSchema,
  updatedAt: z.string().datetime()
});

export const collectionPublicMetadataItemSchema = z.object({
  attributes: z.array(collectionMetadataAttributeSchema).min(1),
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionPath: z.string().min(1),
  collectionSlug: collectionDraftSlugSchema,
  description: z.string().min(1).max(1400),
  editionNumber: z.number().int().positive(),
  externalUrl: z.string().min(1),
  generatedAssetId: z.string().min(1),
  imageUrl: z.string().url(),
  imageUrlExpiresAt: z.string().datetime().nullable(),
  metadataPath: z.string().min(1),
  name: z.string().min(1).max(160),
  pipelineKey: z.string().min(1),
  publishedAt: z.string().datetime(),
  sourceAssetOriginalFilename: z.string().min(1),
  title: collectionDraftTitleSchema,
  variantIndex: z.number().int().positive()
});

export const collectionPublicBrandPreviewSchema = z.object({
  activeDeployment: collectionOnchainDeploymentSummarySchema.nullable(),
  collectionSlug: collectionDraftSlugSchema,
  availabilityLabel: z.string().min(1),
  description: z.string().max(1000).nullable(),
  displayOrder: z.number().int().min(0),
  endAt: z.string().datetime().nullable(),
  heroGeneratedAssetId: z.string().min(1).nullable(),
  heroImageUrl: z.string().url().nullable(),
  heroImageUrlExpiresAt: z.string().datetime().nullable(),
  itemCount: z.number().int().positive(),
  isFeatured: z.boolean(),
  launchAt: z.string().datetime().nullable(),
  mintedTokenCount: z.number().int().min(0),
  priceLabel: collectionStorefrontPriceLabelSchema.nullable(),
  previewPipelineKey: z.string().min(1).nullable(),
  previewSourceAssetOriginalFilename: z.string().min(1).nullable(),
  previewVariantIndex: z.number().int().positive().nullable(),
  publicPath: z.string().min(1),
  publishedAt: z.string().datetime(),
  remainingSupply: z.number().int().min(0).nullable(),
  soldCount: z.number().int().min(0),
  storefrontHeadline: collectionStorefrontHeadlineSchema.nullable(),
  storefrontStatus: collectionStorefrontStatusSchema,
  totalSupply: z.number().int().positive().nullable(),
  title: collectionDraftTitleSchema,
  updatedAt: z.string().datetime()
});

export const collectionPublicBrandPageSchema = z.object({
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionCount: z.number().int().min(0),
  collections: z.array(collectionPublicBrandPreviewSchema),
  customDomain: z.string().min(1).nullable(),
  featuredRelease: collectionPublicBrandPreviewSchema.nullable(),
  liveReleases: z.array(collectionPublicBrandPreviewSchema),
  theme: collectionPublicBrandThemeSchema,
  upcomingReleases: z.array(collectionPublicBrandPreviewSchema),
  archiveReleases: z.array(collectionPublicBrandPreviewSchema),
  latestPublishedAt: z.string().datetime().nullable(),
  publicPath: z.string().min(1)
});

export const collectionDraftCreateRequestSchema = z.object({
  description: collectionDraftDescriptionSchema.nullish(),
  title: collectionDraftTitleSchema
});

export const collectionDraftUpdateRequestSchema = z.object({
  description: collectionDraftDescriptionSchema.nullable(),
  slug: collectionDraftSlugSchema,
  status: collectionDraftStatusSchema,
  title: collectionDraftTitleSchema
});

export const collectionDraftPublishRequestSchema = z.object({});

export const collectionPublicationMerchandisingRequestSchema = z
  .object({
    displayOrder: z.number().int().min(0).max(9999),
    endAt: z.string().datetime().nullable().optional(),
    heroGeneratedAssetId: z.string().min(1).nullable().optional(),
    isFeatured: z.boolean(),
    launchAt: z.string().datetime().nullable().optional(),
    priceLabel: collectionStorefrontPriceLabelSchema.nullable().optional(),
    primaryCtaHref: collectionStorefrontCtaHrefSchema.nullable().optional(),
    primaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable().optional(),
    secondaryCtaHref: collectionStorefrontCtaHrefSchema.nullable().optional(),
    secondaryCtaLabel: collectionStorefrontCtaLabelSchema.nullable().optional(),
    soldCount: z.number().int().min(0),
    storefrontBody: collectionStorefrontBodySchema.nullable().optional(),
    storefrontHeadline: collectionStorefrontHeadlineSchema
      .nullable()
      .optional(),
    storefrontStatus: collectionStorefrontStatusSchema,
    totalSupply: z.number().int().positive().nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.totalSupply !== null && value.totalSupply !== undefined) {
      if (value.soldCount > value.totalSupply) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sold count cannot exceed total supply.",
          path: ["soldCount"]
        });
      }
    }

    if (value.launchAt && value.endAt) {
      if (
        new Date(value.launchAt).getTime() > new Date(value.endAt).getTime()
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Launch time must not be after the end time.",
          path: ["endAt"]
        });
      }
    }

    const primaryPair =
      (value.primaryCtaLabel ? 1 : 0) + (value.primaryCtaHref ? 1 : 0);

    if (primaryPair === 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Primary CTA label and URL must be provided together.",
        path: value.primaryCtaLabel ? ["primaryCtaHref"] : ["primaryCtaLabel"]
      });
    }

    const secondaryPair =
      (value.secondaryCtaLabel ? 1 : 0) + (value.secondaryCtaHref ? 1 : 0);

    if (secondaryPair === 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Secondary CTA label and URL must be provided together.",
        path: value.secondaryCtaLabel
          ? ["secondaryCtaHref"]
          : ["secondaryCtaLabel"]
      });
    }
  });

export const collectionDraftItemAddRequestSchema = z.object({
  generatedAssetId: z.string().min(1)
});

export const collectionDraftItemReorderRequestSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1)
});

export const collectionDraftListResponseSchema = z.object({
  drafts: z.array(collectionDraftSummarySchema),
  generatedAssetCandidates: z.array(collectionGeneratedAssetCandidateSchema),
  publicationTarget: z
    .object({
      brandName: collectionBrandNameSchema,
      brandSlug: collectionBrandSlugSchema,
      publicBrandPath: z.string().min(1)
    })
    .nullable()
});

export const collectionDraftResponseSchema = z.object({
  draft: collectionDraftSummarySchema
});

export const collectionPublicPageResponseSchema = z.object({
  collection: collectionPublicPageSchema
});

export const collectionPublicBrandPageResponseSchema = z.object({
  brand: collectionPublicBrandPageSchema
});

export const collectionPublicMetadataManifestResponseSchema = z.object({
  metadata: collectionPublicMetadataManifestSchema
});

export const collectionPublicMetadataItemResponseSchema = z.object({
  metadata: collectionPublicMetadataItemSchema
});

export const collectionDraftErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "COLLECTION_PUBLICATION_CONFLICT",
      "COLLECTION_PUBLICATION_NOT_FOUND",
      "DRAFT_ITEM_NOT_FOUND",
      "DRAFT_NOT_FOUND",
      "DRAFT_NOT_READY",
      "DRAFT_REORDER_MISMATCH",
      "DRAFT_SLUG_CONFLICT",
      "GENERATED_ASSET_ALREADY_INCLUDED",
      "GENERATED_ASSET_NOT_FOUND",
      "GENERATED_ASSET_NOT_APPROVED",
      "ONCHAIN_COLLECTION_ALREADY_DEPLOYED",
      "ONCHAIN_COLLECTION_IMMUTABLE",
      "ONCHAIN_DEPLOYMENT_REQUIRED",
      "ONCHAIN_TOKEN_ALREADY_MINTED",
      "ONCHAIN_TOKEN_NOT_FOUND",
      "INVALID_REQUEST",
      "INTERNAL_SERVER_ERROR",
      "STUDIO_SETTINGS_REQUIRED",
      "SESSION_REQUIRED"
    ]),
    message: z.string().min(1)
  })
});

export type CollectionDraftStatus = z.infer<typeof collectionDraftStatusSchema>;
export type CollectionStorefrontStatus = z.infer<
  typeof collectionStorefrontStatusSchema
>;
export type CollectionPublicationSummary = z.infer<
  typeof collectionPublicationSummarySchema
>;
export type CollectionGeneratedAssetCandidate = z.infer<
  typeof collectionGeneratedAssetCandidateSchema
>;
export type CollectionDraftItemSummary = z.infer<
  typeof collectionDraftItemSummarySchema
>;
export type CollectionDraftSummary = z.infer<
  typeof collectionDraftSummarySchema
>;
export type CollectionMetadataAttribute = z.infer<
  typeof collectionMetadataAttributeSchema
>;
export type CollectionPublicBrandPage = z.infer<
  typeof collectionPublicBrandPageSchema
>;
export type CollectionPublicBrandTheme = z.infer<
  typeof collectionPublicBrandThemeSchema
>;
export type CollectionPublicBrandPreview = z.infer<
  typeof collectionPublicBrandPreviewSchema
>;
export type CollectionPublicMetadataManifest = z.infer<
  typeof collectionPublicMetadataManifestSchema
>;
export type CollectionPublicMetadataManifestItem = z.infer<
  typeof collectionPublicMetadataManifestItemSchema
>;
export type CollectionPublicMetadataItem = z.infer<
  typeof collectionPublicMetadataItemSchema
>;
export type CollectionPublicMetadataManifestResponse = z.infer<
  typeof collectionPublicMetadataManifestResponseSchema
>;
export type CollectionPublicMetadataItemResponse = z.infer<
  typeof collectionPublicMetadataItemResponseSchema
>;
export type CollectionPublicItem = z.infer<typeof collectionPublicItemSchema>;
export type CollectionPublicPage = z.infer<typeof collectionPublicPageSchema>;
export type CollectionDraftCreateRequest = z.infer<
  typeof collectionDraftCreateRequestSchema
>;
export type CollectionDraftUpdateRequest = z.infer<
  typeof collectionDraftUpdateRequestSchema
>;
export type CollectionDraftPublishRequest = z.infer<
  typeof collectionDraftPublishRequestSchema
>;
export type CollectionPublicationMerchandisingRequest = z.infer<
  typeof collectionPublicationMerchandisingRequestSchema
>;
export type CollectionDraftItemAddRequest = z.infer<
  typeof collectionDraftItemAddRequestSchema
>;
export type CollectionDraftItemReorderRequest = z.infer<
  typeof collectionDraftItemReorderRequestSchema
>;
export type CollectionDraftListResponse = z.infer<
  typeof collectionDraftListResponseSchema
>;
export type CollectionDraftResponse = z.infer<
  typeof collectionDraftResponseSchema
>;
export type CollectionPublicPageResponse = z.infer<
  typeof collectionPublicPageResponseSchema
>;
export type CollectionPublicBrandPageResponse = z.infer<
  typeof collectionPublicBrandPageResponseSchema
>;
export type CollectionDraftErrorResponse = z.infer<
  typeof collectionDraftErrorResponseSchema
>;
