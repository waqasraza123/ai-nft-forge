import { Queue } from "bullmq";
import IORedis from "ioredis";

import {
  parseWorkerEnv,
  workspaceLifecycleJobNames,
  workspaceLifecycleNotificationJobPayloadSchema,
  workspaceLifecycleQueueNames,
  type WorkspaceLifecycleNotificationJobPayload
} from "@ai-nft-forge/shared";

type WorkspaceLifecycleQueueGlobal = typeof globalThis & {
  __aiNftForgeWorkspaceLifecycleQueue?: Queue<
    WorkspaceLifecycleNotificationJobPayload,
    unknown,
    typeof workspaceLifecycleJobNames.processNotificationDelivery
  >;
  __aiNftForgeWorkspaceLifecycleQueueRedis?: IORedis;
};

const workspaceLifecycleQueueGlobal =
  globalThis as WorkspaceLifecycleQueueGlobal;

function createWorkspaceLifecycleQueueConnection(
  rawEnvironment: NodeJS.ProcessEnv
): IORedis {
  return new IORedis(parseWorkerEnv(rawEnvironment).REDIS_URL, {
    maxRetriesPerRequest: null
  });
}

export function getWorkspaceLifecycleNotificationQueue(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  if (!workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueueRedis) {
    workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueueRedis =
      createWorkspaceLifecycleQueueConnection(rawEnvironment);
  }

  if (!workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueue) {
    workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueue =
      new Queue<
        WorkspaceLifecycleNotificationJobPayload,
        unknown,
        typeof workspaceLifecycleJobNames.processNotificationDelivery
      >(workspaceLifecycleQueueNames.notificationDispatch, {
        connection:
          workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueueRedis,
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

  return workspaceLifecycleQueueGlobal.__aiNftForgeWorkspaceLifecycleQueue;
}

export async function enqueueWorkspaceLifecycleNotificationJob(
  payload: WorkspaceLifecycleNotificationJobPayload,
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const parsedPayload =
    workspaceLifecycleNotificationJobPayloadSchema.parse(payload);
  const queue = getWorkspaceLifecycleNotificationQueue(rawEnvironment);
  const job = await queue.add(
    workspaceLifecycleJobNames.processNotificationDelivery,
    parsedPayload,
    {
      jobId: parsedPayload.deliveryId
    }
  );

  return {
    jobId: String(job.id ?? parsedPayload.deliveryId)
  };
}
