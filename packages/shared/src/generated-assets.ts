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

export type GeneratedAssetSummary = z.infer<typeof generatedAssetSummarySchema>;
