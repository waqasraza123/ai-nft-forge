import { type Redis } from "ioredis";

import {
  createDatabaseClient,
  createGenerationRequestRepository,
  createSourceAssetRepository,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  createObjectStorageClient,
  parseWorkerEnv,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import { createStorageBackedGenerationAdapter } from "../generation/storage-backed-adapter.js";
import { createLogger, type Logger } from "../lib/logger.js";
import { createRedisConnection } from "../lib/redis.js";
import {
  createQueueRegistry,
  type WorkerQueueRegistry
} from "../queues/registry.js";

export type WorkerApplication = {
  close: () => Promise<void>;
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  logger: Logger;
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
  const redisConnection = createRedisConnection(env);
  const queueRegistry = createQueueRegistry({
    databaseClient,
    env,
    generationAdapter: createStorageBackedGenerationAdapter({
      logger,
      storageClient: objectStorageClient
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

  let isClosed = false;

  const close = async () => {
    if (isClosed) {
      return;
    }

    isClosed = true;

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
    queueRegistry,
    redisConnection
  };
}
