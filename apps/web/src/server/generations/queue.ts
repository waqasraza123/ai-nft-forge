import { Queue } from "bullmq";
import IORedis from "ioredis";

import {
  generationJobNames,
  generationJobPayloadSchema,
  generationQueueNames,
  parseWorkerEnv,
  type GenerationJobPayload
} from "@ai-nft-forge/shared";

type GenerationQueueGlobal = typeof globalThis & {
  __aiNftForgeGenerationQueue?: Queue<
    GenerationJobPayload,
    unknown,
    typeof generationJobNames.processSourceAssetGeneration
  >;
  __aiNftForgeGenerationQueueRedis?: IORedis;
};

const generationQueueGlobal = globalThis as GenerationQueueGlobal;

export type GenerationDispatchQueueCounts = {
  active: number;
  completed: number;
  delayed: number;
  failed: number;
  paused: number;
  waiting: number;
};

function createGenerationQueueConnection(
  rawEnvironment: NodeJS.ProcessEnv
): IORedis {
  return new IORedis(parseWorkerEnv(rawEnvironment).REDIS_URL, {
    maxRetriesPerRequest: null
  });
}

export function getGenerationDispatchQueue(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  if (!generationQueueGlobal.__aiNftForgeGenerationQueueRedis) {
    generationQueueGlobal.__aiNftForgeGenerationQueueRedis =
      createGenerationQueueConnection(rawEnvironment);
  }

  if (!generationQueueGlobal.__aiNftForgeGenerationQueue) {
    generationQueueGlobal.__aiNftForgeGenerationQueue = new Queue<
      GenerationJobPayload,
      unknown,
      typeof generationJobNames.processSourceAssetGeneration
    >(generationQueueNames.generationDispatch, {
      connection: generationQueueGlobal.__aiNftForgeGenerationQueueRedis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          delay: 1000,
          type: "exponential"
        },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    });
  }

  return generationQueueGlobal.__aiNftForgeGenerationQueue;
}

export async function enqueueGenerationRequest(
  payload: GenerationJobPayload,
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const parsedPayload = generationJobPayloadSchema.parse(payload);
  const queue = getGenerationDispatchQueue(rawEnvironment);
  const job = await queue.add(
    generationJobNames.processSourceAssetGeneration,
    parsedPayload,
    {
      jobId: parsedPayload.generationRequestId
    }
  );

  return {
    jobId: String(job.id ?? parsedPayload.generationRequestId)
  };
}

export async function getGenerationDispatchQueueCounts(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): Promise<GenerationDispatchQueueCounts> {
  const queue = getGenerationDispatchQueue(rawEnvironment);
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "delayed",
    "completed",
    "failed",
    "paused"
  );

  return {
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    delayed: counts.delayed ?? 0,
    failed: counts.failed ?? 0,
    paused: counts.paused ?? 0,
    waiting: counts.waiting ?? 0
  };
}
