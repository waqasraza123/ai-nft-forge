import {
  createObjectStorageClient,
  deleteStorageObject,
  getStorageConfig,
  getStorageObjectBytes,
  parseGenerationBackendEnv,
  putStorageObject,
  type GenerationBackendEnv
} from "@ai-nft-forge/shared";

import { createGenerationArtifactProvider } from "../generation/provider-factory.js";
import { createGenerationBackendService } from "../generation/service.js";
import { createGenerationBackendServer } from "../http/server.js";
import {
  createGenerationBackendHealthSnapshot,
  createGenerationBackendReadinessSnapshot
} from "../lib/health.js";
import { createLogger, type Logger } from "../lib/logger.js";
import type { GenerationArtifactProvider } from "../generation/provider.js";

export type GenerationBackendRuntime = {
  env: GenerationBackendEnv;
  logger: Logger;
  provider: GenerationArtifactProvider;
};

export type GenerationBackendApplication = {
  close: () => Promise<void>;
  env: GenerationBackendEnv;
  logger: Logger;
};

export async function createGenerationBackendRuntime(
  rawEnvironment: NodeJS.ProcessEnv
): Promise<GenerationBackendRuntime> {
  const env = parseGenerationBackendEnv(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.GENERATION_BACKEND_SERVICE_NAME
  });
  const provider = await createGenerationArtifactProvider({
    env,
    logger
  });

  return {
    env,
    logger,
    provider
  };
}

export async function bootstrapGenerationBackendApplication(
  rawEnvironment: NodeJS.ProcessEnv
): Promise<GenerationBackendApplication> {
  const runtime = await createGenerationBackendRuntime(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);
  const storageClient = createObjectStorageClient(rawEnvironment);
  const generationService = createGenerationBackendService({
    logger: runtime.logger,
    provider: runtime.provider,
    storage: {
      deleteObject: (input) =>
        deleteStorageObject({
          bucket: input.bucket,
          client: storageClient,
          key: input.key
        }),
      getObjectBytes: (input) =>
        getStorageObjectBytes({
          bucket: input.bucket,
          client: storageClient,
          key: input.key
        }),
      putObject: (input) =>
        putStorageObject({
          body: input.body,
          bucket: input.bucket,
          client: storageClient,
          contentType: input.contentType,
          key: input.key,
          ...(input.metadata
            ? {
                metadata: input.metadata
              }
            : {})
        })
    },
    targetBucketName: storageConfig.S3_BUCKET_PRIVATE
  });
  const server = createGenerationBackendServer({
    ...(runtime.env.GENERATION_BACKEND_AUTH_TOKEN
      ? {
          authToken: runtime.env.GENERATION_BACKEND_AUTH_TOKEN
        }
      : {}),
    generationService,
    healthReporter: {
      createHealthSnapshot: () =>
        createGenerationBackendHealthSnapshot({
          provider: runtime.provider,
          rawEnvironment
        }),
      createReadinessSnapshot: () =>
        createGenerationBackendReadinessSnapshot({
          provider: runtime.provider,
          rawEnvironment
        })
    },
    logger: runtime.logger
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(
      runtime.env.GENERATION_BACKEND_PORT,
      runtime.env.GENERATION_BACKEND_BIND_HOST,
      () => {
        server.off("error", reject);
        resolve();
      }
    );
  });

  runtime.logger.info("Generation backend application bootstrapped", {
    bindHost: runtime.env.GENERATION_BACKEND_BIND_HOST,
    port: runtime.env.GENERATION_BACKEND_PORT,
    providerKind: runtime.env.GENERATION_BACKEND_PROVIDER_KIND
  });

  let isClosed = false;

  const close = async () => {
    if (isClosed) {
      return;
    }

    isClosed = true;

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    storageClient.destroy();

    runtime.logger.info("Generation backend application stopped");
  };

  return {
    close,
    env: runtime.env,
    logger: runtime.logger
  };
}
