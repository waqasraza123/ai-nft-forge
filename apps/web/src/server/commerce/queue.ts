import { Queue } from "bullmq";
import IORedis from "ioredis";

import {
  commerceFulfillmentJobPayloadSchema,
  commerceJobNames,
  commerceQueueNames,
  parseWorkerEnv,
  type CommerceFulfillmentJobPayload
} from "@ai-nft-forge/shared";

type CommerceFulfillmentQueueGlobal = typeof globalThis & {
  __aiNftForgeCommerceFulfillmentQueue?: Queue<
    CommerceFulfillmentJobPayload,
    unknown,
    typeof commerceJobNames.processCheckoutFulfillment
  >;
  __aiNftForgeCommerceFulfillmentQueueRedis?: IORedis;
};

const commerceFulfillmentQueueGlobal =
  globalThis as CommerceFulfillmentQueueGlobal;

function createCommerceFulfillmentQueueConnection(
  rawEnvironment: NodeJS.ProcessEnv
): IORedis {
  return new IORedis(parseWorkerEnv(rawEnvironment).REDIS_URL, {
    maxRetriesPerRequest: null
  });
}

export function getCommerceFulfillmentQueue(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  if (
    !commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueueRedis
  ) {
    commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueueRedis =
      createCommerceFulfillmentQueueConnection(rawEnvironment);
  }

  if (!commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueue) {
    commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueue =
      new Queue<
        CommerceFulfillmentJobPayload,
        unknown,
        typeof commerceJobNames.processCheckoutFulfillment
      >(commerceQueueNames.fulfillmentDispatch, {
        connection:
          commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueueRedis,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            delay: 30000,
            type: "exponential"
          },
          removeOnComplete: 100,
          removeOnFail: 100
        }
      });
  }

  return commerceFulfillmentQueueGlobal.__aiNftForgeCommerceFulfillmentQueue;
}

export async function enqueueCommerceFulfillmentJob(
  payload: CommerceFulfillmentJobPayload,
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const parsedPayload = commerceFulfillmentJobPayloadSchema.parse(payload);
  const queue = getCommerceFulfillmentQueue(rawEnvironment);
  const job = await queue.add(
    commerceJobNames.processCheckoutFulfillment,
    parsedPayload
  );

  return {
    jobId: String(job.id ?? parsedPayload.checkoutSessionId)
  };
}
