import { z } from "zod";

export const generatedAssetSummarySchema = z.object({
  byteSize: z.number().int().positive().nullable(),
  contentType: z.string().trim().min(1),
  createdAt: z.string().min(1),
  generationRequestId: z.string().min(1),
  id: z.string().min(1),
  sourceAssetId: z.string().min(1),
  storageBucket: z.string().trim().min(1),
  storageObjectKey: z.string().trim().min(1),
  variantIndex: z.number().int().positive()
});

export const generatedAssetDownloadDescriptorSchema = z.object({
  expiresAt: z.string().min(1),
  method: z.literal("GET"),
  url: z.string().url()
});

export const generatedAssetDownloadIntentResponseSchema = z.object({
  asset: generatedAssetSummarySchema,
  download: generatedAssetDownloadDescriptorSchema
});

export const generatedAssetErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "GENERATED_ASSET_NOT_FOUND",
      "INTERNAL_SERVER_ERROR",
      "SESSION_REQUIRED"
    ]),
    message: z.string().min(1)
  })
});

export type GeneratedAssetSummary = z.infer<typeof generatedAssetSummarySchema>;
export type GeneratedAssetDownloadDescriptor = z.infer<
  typeof generatedAssetDownloadDescriptorSchema
>;
export type GeneratedAssetDownloadIntentResponse = z.infer<
  typeof generatedAssetDownloadIntentResponseSchema
>;
export type GeneratedAssetErrorResponse = z.infer<
  typeof generatedAssetErrorResponseSchema
>;
