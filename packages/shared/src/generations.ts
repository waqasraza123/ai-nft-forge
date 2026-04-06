import { z } from "zod";

import { generatedAssetSummarySchema } from "./generated-assets.js";

export const generationPipelineKeyValues = ["collectible-portrait-v1"] as const;

export const generationRequestStatusValues = [
  "queued",
  "running",
  "succeeded",
  "failed"
] as const;

export const generationPipelineKeySchema = z.enum(generationPipelineKeyValues);
export const generationRequestStatusSchema = z.enum(
  generationRequestStatusValues
);
export const generationVariantCountSchema = z.number().int().min(1).max(8);

export const generationResultSummarySchema = z.object({
  generatedVariantCount: generationVariantCountSchema,
  outputGroupKey: z.string().min(1),
  storedAssetCount: z.number().int().nonnegative().default(0)
});

export const generationRequestSummarySchema = z.object({
  completedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  failedAt: z.string().min(1).nullable(),
  failureCode: z.string().min(1).nullable(),
  failureMessage: z.string().min(1).nullable(),
  id: z.string().min(1),
  pipelineKey: generationPipelineKeySchema,
  queueJobId: z.string().min(1).nullable(),
  requestedVariantCount: generationVariantCountSchema,
  generatedAssets: z.array(generatedAssetSummarySchema),
  result: generationResultSummarySchema.nullable(),
  sourceAssetId: z.string().min(1),
  startedAt: z.string().min(1).nullable(),
  status: generationRequestStatusSchema
});

export const generationRequestCreateRequestSchema = z.object({
  pipelineKey: generationPipelineKeySchema.default("collectible-portrait-v1"),
  sourceAssetId: z.string().trim().min(1),
  variantCount: generationVariantCountSchema.default(4)
});

export const generationRequestCreateResponseSchema = z.object({
  generation: generationRequestSummarySchema
});

export const generationBackendArtifactSchema = z.object({
  contentType: z.string().trim().min(1),
  storageBucket: z.string().trim().min(1),
  storageObjectKey: z.string().trim().min(1),
  variantIndex: z.number().int().positive()
});

export const generationBackendRequestSchema = z.object({
  generationRequestId: z.string().min(1),
  ownerUserId: z.string().min(1),
  pipelineKey: generationPipelineKeySchema,
  requestedVariantCount: generationVariantCountSchema,
  sourceAsset: z.object({
    contentType: z.string().trim().min(1),
    originalFilename: z.string().trim().min(1),
    storageBucket: z.string().trim().min(1),
    storageObjectKey: z.string().trim().min(1)
  }),
  target: z.object({
    bucket: z.string().trim().min(1),
    outputGroupKey: z.string().min(1)
  })
});

export const generationBackendResponseSchema = z.object({
  artifacts: z.array(generationBackendArtifactSchema).min(1).max(8),
  outputGroupKey: z.string().min(1)
});

export const generationBackendErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "BACKEND_AUTH_REQUIRED",
      "BACKEND_AUTH_INVALID",
      "INTERNAL_SERVER_ERROR",
      "INVALID_REQUEST",
      "MODEL_BACKEND_ERROR",
      "MODEL_BACKEND_TIMEOUT",
      "SOURCE_ASSET_UNSUPPORTED",
      "SOURCE_OBJECT_MISSING"
    ]),
    message: z.string().min(1)
  })
});

export const generationErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "ACTIVE_GENERATION_EXISTS",
      "GENERATION_QUEUE_ERROR",
      "INTERNAL_SERVER_ERROR",
      "INVALID_REQUEST",
      "SESSION_REQUIRED",
      "SOURCE_ASSET_NOT_FOUND",
      "SOURCE_ASSET_NOT_READY"
    ]),
    message: z.string().min(1)
  })
});

export type GenerationPipelineKey =
  (typeof generationPipelineKeyValues)[number];
export type GenerationRequestStatus =
  (typeof generationRequestStatusValues)[number];
export type GenerationResultSummary = z.infer<
  typeof generationResultSummarySchema
>;
export type GenerationRequestSummary = z.infer<
  typeof generationRequestSummarySchema
>;
export type GenerationRequestCreateRequest = z.infer<
  typeof generationRequestCreateRequestSchema
>;
export type GenerationRequestCreateResponse = z.infer<
  typeof generationRequestCreateResponseSchema
>;
export type GenerationBackendArtifact = z.infer<
  typeof generationBackendArtifactSchema
>;
export type GenerationBackendRequest = z.infer<
  typeof generationBackendRequestSchema
>;
export type GenerationBackendResponse = z.infer<
  typeof generationBackendResponseSchema
>;
export type GenerationBackendErrorResponse = z.infer<
  typeof generationBackendErrorResponseSchema
>;
export type GenerationErrorResponse = z.infer<
  typeof generationErrorResponseSchema
>;
