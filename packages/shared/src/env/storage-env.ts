import { z } from "zod";

import { booleanEnvironmentValueSchema } from "./boolean-environment-value.js";
import { optionalUrlSchema } from "./optional-environment-value.js";

export const storageEnvSchema = z.object({
  GENERATED_ASSET_DOWNLOAD_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(3600)
    .default(300),
  S3_ACCESS_KEY_ID: z.string().trim().min(1),
  S3_BUCKET_PRIVATE: z.string().trim().min(1),
  S3_BUCKET_PUBLIC: z.string().trim().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_FORCE_PATH_STYLE: booleanEnvironmentValueSchema.default(true),
  S3_PUBLIC_BASE_URL: optionalUrlSchema,
  S3_REGION: z.string().trim().min(1).default("us-east-1"),
  S3_SECRET_ACCESS_KEY: z.string().trim().min(1),
  S3_USE_SSL: booleanEnvironmentValueSchema.default(false),
  SOURCE_ASSET_UPLOAD_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(3600)
    .default(900)
});

export type StorageEnv = z.infer<typeof storageEnvSchema>;

export function parseStorageEnv(rawEnvironment: NodeJS.ProcessEnv): StorageEnv {
  return storageEnvSchema.parse(rawEnvironment);
}
