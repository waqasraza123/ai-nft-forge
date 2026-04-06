import {
  createObjectStorageClient,
  getStorageConfig,
  getStorageObjectBytes,
  parseGenerationBackendEnv,
  putStorageObject,
  deleteStorageObject,
  type GenerationBackendEnv
} from "@ai-nft-forge/shared";

import { createGenerationArtifactProvider } from "../generation/provider-factory.js";
import { createGenerationBackendService } from "../generation/service.js";
import { createGenerationBackendServer } from "../http/server.js";
import { createLogger, type Logger } from "../lib/logger.js";

export type GenerationBackendApplication = {
  close: () => Promise<void>;
  env: GenerationBackendEnv;
  logger: Logger;
};

export async function bootstrapGenerationBackendApplication(
  rawEnvironment: NodeJS.ProcessEnv
): Promise<GenerationBackendApplication> {
  const env = parseGenerationBackendEnv(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);
  const storageClient = createObjectStorageClient(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.GENERATION_BACKEND_SERVICE_NAME
  });
  const provider = await createGenerationArtifactProvider({
    env,
    logger
  });
  const generationService = createGenerationBackendService({
    logger,
    provider,
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
    ...(env.GENERATION_BACKEND_AUTH_TOKEN
      ? {
          authToken: env.GENERATION_BACKEND_AUTH_TOKEN
        }
      : {}),
    generationService,
    logger
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(
      env.GENERATION_BACKEND_PORT,
      env.GENERATION_BACKEND_BIND_HOST,
      () => {
        server.off("error", reject);
        resolve();
      }
    );
  });

  logger.info("Generation backend application bootstrapped", {
    bindHost: env.GENERATION_BACKEND_BIND_HOST,
    port: env.GENERATION_BACKEND_PORT,
    providerKind: env.GENERATION_BACKEND_PROVIDER_KIND
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

    logger.info("Generation backend application stopped");
  };

  return {
    close,
    env,
    logger
  };
}
