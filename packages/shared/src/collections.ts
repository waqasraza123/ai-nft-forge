import { z } from "zod";

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

export const collectionGeneratedAssetCandidateSchema = z.object({
  createdAt: z.string().datetime(),
  generatedAssetId: z.string().min(1),
  generationRequestId: z.string().min(1),
  pipelineKey: z.string().min(1),
  sourceAssetId: z.string().min(1),
  sourceAssetOriginalFilename: z.string().min(1),
  variantIndex: z.number().int().positive()
});

export const collectionPublicationSummarySchema = z.object({
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionSlug: collectionDraftSlugSchema,
  displayOrder: z.number().int().min(0),
  id: z.string().min(1),
  isFeatured: z.boolean(),
  publicPath: z.string().min(1),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime()
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
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collectionSlug: collectionDraftSlugSchema,
  description: z.string().max(1000).nullable(),
  items: z.array(collectionPublicItemSchema),
  publishedAt: z.string().datetime(),
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
  collectionSlug: collectionDraftSlugSchema,
  coverImageUrl: z.string().url().nullable(),
  coverImageUrlExpiresAt: z.string().datetime().nullable(),
  description: z.string().max(1000).nullable(),
  displayOrder: z.number().int().min(0),
  itemCount: z.number().int().positive(),
  isFeatured: z.boolean(),
  previewPipelineKey: z.string().min(1).nullable(),
  previewSourceAssetOriginalFilename: z.string().min(1).nullable(),
  previewVariantIndex: z.number().int().positive().nullable(),
  publicPath: z.string().min(1),
  publishedAt: z.string().datetime(),
  title: collectionDraftTitleSchema,
  updatedAt: z.string().datetime()
});

export const collectionPublicBrandPageSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  brandName: collectionBrandNameSchema,
  brandSlug: collectionBrandSlugSchema,
  collections: z.array(collectionPublicBrandPreviewSchema),
  customDomain: z.string().min(1).nullable(),
  featuredReleaseLabel: z.string().min(1).max(40),
  landingDescription: z.string().min(1).max(280),
  landingHeadline: collectionDraftTitleSchema,
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

export const collectionPublicationMerchandisingRequestSchema = z.object({
  displayOrder: z.number().int().min(0).max(9999),
  isFeatured: z.boolean()
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
      "INVALID_REQUEST",
      "INTERNAL_SERVER_ERROR",
      "STUDIO_SETTINGS_REQUIRED",
      "SESSION_REQUIRED"
    ]),
    message: z.string().min(1)
  })
});

export type CollectionDraftStatus = z.infer<typeof collectionDraftStatusSchema>;
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
