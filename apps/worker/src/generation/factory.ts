import {
  createObjectStorageClient,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import type { GenerationAdapter } from "./adapter.js";
import { createHttpBackendGenerationAdapter } from "./http-backend-adapter.js";
import { createStorageBackedGenerationAdapter } from "./storage-backed-adapter.js";

type CreateGenerationAdapterInput = {
  env: WorkerEnv;
  logger: Logger;
  storageClient: ReturnType<typeof createObjectStorageClient>;
  targetBucketName: string;
};

export function createGenerationAdapter({
  env,
  logger,
  storageClient,
  targetBucketName
}: CreateGenerationAdapterInput): GenerationAdapter {
  switch (env.GENERATION_ADAPTER_KIND) {
    case "http_backend": {
      const backendUrl = env.GENERATION_BACKEND_URL;

      if (!backendUrl) {
        throw new Error(
          "GENERATION_BACKEND_URL is required when GENERATION_ADAPTER_KIND=http_backend."
        );
      }

      return createHttpBackendGenerationAdapter({
        ...(env.GENERATION_BACKEND_AUTH_TOKEN
          ? {
              authToken: env.GENERATION_BACKEND_AUTH_TOKEN
            }
          : {}),
        backendUrl,
        logger,
        storageClient,
        targetBucketName,
        timeoutMs: env.GENERATION_BACKEND_TIMEOUT_MS
      });
    }
    case "storage_copy":
      return createStorageBackedGenerationAdapter({
        logger,
        storageClient,
        targetBucketName
      });
  }
}
