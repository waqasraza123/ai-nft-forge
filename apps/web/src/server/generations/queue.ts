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
