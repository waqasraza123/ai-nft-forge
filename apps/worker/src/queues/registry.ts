import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  foundationJobNames,
  foundationQueueNames,
  queueCatalog,
  type NoopJobPayload,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";
import {
  createNoopProcessor,
  type NoopJobResult
} from "../processors/noop-processor.js";

type WorkerQueueRegistryOptions = {
  env: WorkerEnv;
  logger: Logger;
  redisConnection: Redis;
};

export type WorkerQueueRegistry = {
  queueCatalog: typeof queueCatalog;
  queues: {
    foundation: Queue<
      NoopJobPayload,
      NoopJobResult,
      typeof foundationJobNames.noop
    >;
  };
  workers: Worker<
    NoopJobPayload,
    NoopJobResult,
    typeof foundationJobNames.noop
  >[];
};

export function createQueueRegistry({
  env,
  logger,
  redisConnection
}: WorkerQueueRegistryOptions): WorkerQueueRegistry {
  const processNoopJob = createNoopProcessor({
    logger
  });
  const foundationQueue = new Queue<
    NoopJobPayload,
    NoopJobResult,
    typeof foundationJobNames.noop
  >(foundationQueueNames.foundation, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });
  const foundationWorker = new Worker<
    NoopJobPayload,
    NoopJobResult,
    typeof foundationJobNames.noop
  >(
    foundationQueueNames.foundation,
    async (job) => {
      if (job.name !== foundationJobNames.noop) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      return processNoopJob(job);
    },
    {
      concurrency: env.NOOP_QUEUE_CONCURRENCY,
      connection: redisConnection
    }
  );

  logger.info("Registered worker queues", {
    queueNames: queueCatalog.map((entry) => entry.queueName)
  });

  return {
    queueCatalog,
    queues: {
      foundation: foundationQueue
    },
    workers: [foundationWorker]
  };
}
