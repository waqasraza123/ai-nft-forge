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
export type GenerationErrorResponse = z.infer<
  typeof generationErrorResponseSchema
>;
