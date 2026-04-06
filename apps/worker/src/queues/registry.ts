import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import type { DatabaseClient } from "@ai-nft-forge/database";
import {
  generationJobNames,
  generationQueueNames,
  foundationJobNames,
  foundationQueueNames,
  type GenerationJobPayload,
  queueCatalog,
  type NoopJobPayload,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";
import type { GenerationAdapter } from "../generation/adapter.js";
import {
  createGenerationRequestProcessor,
  type GenerationRequestJobResult
} from "../processors/generation-request-processor.js";
import {
  createNoopProcessor,
  type NoopJobResult
} from "../processors/noop-processor.js";

type WorkerQueueRegistryOptions = {
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  generationAdapter: GenerationAdapter;
  logger: Logger;
  repositories: {
    generationRequestRepository: {
      findById(id: string): Promise<{
        id: string;
        ownerUserId: string;
        pipelineKey: string;
        requestedVariantCount: number;
        resultJson: unknown;
        sourceAssetId: string;
        status: "queued" | "running" | "succeeded" | "failed";
      } | null>;
      markFailed(input: {
        failureCode: string;
        failureMessage: string;
        failedAt: Date;
        id: string;
      }): Promise<unknown>;
      markQueuedForRetry(id: string): Promise<unknown>;
      markRunning(input: { id: string; startedAt: Date }): Promise<unknown>;
    };
    sourceAssetRepository: {
      findById(id: string): Promise<{
        contentType: string;
        id: string;
        originalFilename: string;
        ownerUserId: string;
        storageBucket: string;
        storageObjectKey: string;
        status: string;
      } | null>;
    };
  };
  redisConnection: Redis;
};

export type WorkerQueueRegistry = {
  queueCatalog: typeof queueCatalog;
  queues: {
    generationDispatch: Queue<
      GenerationJobPayload,
      GenerationRequestJobResult,
      typeof generationJobNames.processSourceAssetGeneration
    >;
    foundation: Queue<
      NoopJobPayload,
      NoopJobResult,
      typeof foundationJobNames.noop
    >;
  };
  workers: Array<
    | Worker<
        GenerationJobPayload,
        GenerationRequestJobResult,
        typeof generationJobNames.processSourceAssetGeneration
      >
    | Worker<NoopJobPayload, NoopJobResult, typeof foundationJobNames.noop>
  >;
};

export function createQueueRegistry({
  databaseClient,
  env,
  generationAdapter,
  logger,
  repositories,
  redisConnection
}: WorkerQueueRegistryOptions): WorkerQueueRegistry {
  const processGenerationRequest = createGenerationRequestProcessor({
    adapter: generationAdapter,
    databaseClient,
    logger,
    now: () => new Date(),
    repositories
  });
  const processNoopJob = createNoopProcessor({
    logger
  });
  const generationDispatchQueue = new Queue<
    GenerationJobPayload,
    GenerationRequestJobResult,
    typeof generationJobNames.processSourceAssetGeneration
  >(generationQueueNames.generationDispatch, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100
    }
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
  const generationDispatchWorker = new Worker<
    GenerationJobPayload,
    GenerationRequestJobResult,
    typeof generationJobNames.processSourceAssetGeneration
  >(
    generationQueueNames.generationDispatch,
    async (job) => {
      if (job.name !== generationJobNames.processSourceAssetGeneration) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      return processGenerationRequest(job);
    },
    {
      concurrency: env.GENERATION_QUEUE_CONCURRENCY,
      connection: redisConnection
    }
  );
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
      generationDispatch: generationDispatchQueue,
      foundation: foundationQueue
    },
    workers: [generationDispatchWorker, foundationWorker]
  };
}
