import { z } from "zod";

import { generatedAssetSummarySchema } from "./generated-assets.js";
import { generationRequestSummarySchema } from "./generations.js";

export const sourceAssetStatusValues = [
  "pending_upload",
  "uploaded",
  "upload_failed"
] as const;

export const sourceAssetContentTypeValues = [
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const sourceAssetStatusSchema = z.enum(sourceAssetStatusValues);
export const sourceAssetContentTypeSchema = z.enum(
  sourceAssetContentTypeValues
);
export const sourceAssetFileNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((value) => !/[\\/]/.test(value), {
    message: "File name must not include path separators."
  });

export const sourceAssetSummarySchema = z.object({
  byteSize: z.number().int().positive().nullable(),
  contentType: sourceAssetContentTypeSchema,
  createdAt: z.string().min(1),
  id: z.string().min(1),
  originalFilename: sourceAssetFileNameSchema,
  status: sourceAssetStatusSchema,
  uploadedAt: z.string().min(1).nullable()
});

export const studioSourceAssetSummarySchema = sourceAssetSummarySchema.extend({
  latestGeneratedAssets: z.array(generatedAssetSummarySchema),
  latestGeneration: generationRequestSummarySchema.nullable()
});

export const sourceAssetListResponseSchema = z.object({
  assets: z.array(studioSourceAssetSummarySchema)
});

export const sourceAssetUploadIntentRequestSchema = z.object({
  contentType: sourceAssetContentTypeSchema,
  fileName: sourceAssetFileNameSchema
});

export const sourceAssetUploadDescriptorSchema = z.object({
  expiresAt: z.string().min(1),
  headers: z.object({
    "content-type": sourceAssetContentTypeSchema
  }),
  method: z.literal("PUT"),
  objectKey: z.string().min(1),
  url: z.string().url()
});

export const sourceAssetUploadIntentResponseSchema = z.object({
  asset: sourceAssetSummarySchema,
  upload: sourceAssetUploadDescriptorSchema
});

export const sourceAssetCompletionResponseSchema = z.object({
  asset: sourceAssetSummarySchema
});

export const sourceAssetErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "ASSET_NOT_FOUND",
      "CONTENT_TYPE_UNSUPPORTED",
      "INTERNAL_SERVER_ERROR",
      "INVALID_REQUEST",
      "OBJECT_MISSING",
      "SESSION_REQUIRED"
    ]),
    message: z.string().min(1)
  })
});

export type SourceAssetContentType =
  (typeof sourceAssetContentTypeValues)[number];
export type SourceAssetStatus = (typeof sourceAssetStatusValues)[number];
export type SourceAssetSummary = z.infer<typeof sourceAssetSummarySchema>;
export type StudioSourceAssetSummary = z.infer<
  typeof studioSourceAssetSummarySchema
>;
export type SourceAssetListResponse = z.infer<
  typeof sourceAssetListResponseSchema
>;
export type SourceAssetUploadIntentRequest = z.infer<
  typeof sourceAssetUploadIntentRequestSchema
>;
export type SourceAssetUploadIntentResponse = z.infer<
  typeof sourceAssetUploadIntentResponseSchema
>;
export type SourceAssetCompletionResponse = z.infer<
  typeof sourceAssetCompletionResponseSchema
>;
export type SourceAssetErrorResponse = z.infer<
  typeof sourceAssetErrorResponseSchema
>;
