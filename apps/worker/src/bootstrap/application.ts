import { type Redis } from "ioredis";

import {
  createDatabaseClient,
  createGenerationRequestRepository,
  createSourceAssetRepository,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  createObjectStorageClient,
  getStorageConfig,
  parseWorkerEnv,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import { createGenerationAdapter } from "../generation/factory.js";
import { createLogger, type Logger } from "../lib/logger.js";
import { createRedisConnection } from "../lib/redis.js";
import { captureRuntimeOpsObservabilityWithDependencies } from "../ops/runtime.js";
import { startOpsObservabilityCaptureScheduler } from "../ops/scheduler.js";
import {
  createQueueRegistry,
  type WorkerQueueRegistry
} from "../queues/registry.js";

export type WorkerApplication = {
  close: () => Promise<void>;
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  logger: Logger;
  opsObservabilityCaptureScheduler: {
    close: () => Promise<void>;
  };
  queueRegistry: WorkerQueueRegistry;
  redisConnection: Redis;
};

export async function bootstrapWorkerApplication(
  rawEnvironment: NodeJS.ProcessEnv
): Promise<WorkerApplication> {
  const env = parseWorkerEnv(rawEnvironment);
  const databaseClient = createDatabaseClient(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.WORKER_SERVICE_NAME
  });
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);
  const redisConnection = createRedisConnection(env);
  const queueRegistry = createQueueRegistry({
    databaseClient,
    env,
    generationAdapter: createGenerationAdapter({
      env,
      logger,
      storageClient: objectStorageClient,
      targetBucketName: storageConfig.S3_BUCKET_PRIVATE
    }),
    logger,
    repositories: {
      generationRequestRepository:
        createGenerationRequestRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient)
    },
    redisConnection
  });

  await databaseClient.$connect();
  await redisConnection.ping();
  await Promise.all([
    ...Object.values(queueRegistry.queues).map(async (queue) =>
      queue.waitUntilReady()
    ),
    ...queueRegistry.workers.map(async (worker) => worker.waitUntilReady())
  ]);

  logger.info("Worker application bootstrapped", {
    queueNames: queueRegistry.queueCatalog.map((entry) => entry.queueName)
  });
  const opsObservabilityCaptureScheduler =
    startOpsObservabilityCaptureScheduler({
      capture: () =>
        captureRuntimeOpsObservabilityWithDependencies({
          databaseClient,
          env,
          logger,
          rawEnvironment,
          redisConnection
        }),
      env,
      logger,
      redisConnection
    });

  let isClosed = false;

  const close = async () => {
    if (isClosed) {
      return;
    }

    isClosed = true;

    await opsObservabilityCaptureScheduler.close();
    await Promise.all(
      queueRegistry.workers.map(async (worker) => worker.close())
    );
    await Promise.all(
      Object.values(queueRegistry.queues).map(async (queue) => queue.close())
    );
    objectStorageClient.destroy();
    await databaseClient.$disconnect();
    await redisConnection.quit();

    logger.info("Worker application stopped");
  };

  return {
    close,
    databaseClient,
    env,
    logger,
    opsObservabilityCaptureScheduler,
    queueRegistry,
    redisConnection
  };
}
