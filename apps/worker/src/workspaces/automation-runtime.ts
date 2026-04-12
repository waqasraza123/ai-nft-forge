import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import {
  createAuditLogRepository,
  createDatabaseClient,
  createWorkspaceDecommissionNotificationRepository,
  createWorkspaceDecommissionRequestRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceLifecycleAutomationRunRepository,
  createWorkspaceLifecycleNotificationDeliveryRepository,
  createWorkspaceRepository,
  type DatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  parseWorkerEnv,
  workspaceLifecycleJobNames,
  workspaceLifecycleQueueNames,
  type WorkerEnv,
  type WorkspaceLifecycleAutomationRunTriggerSource,
  type WorkspaceLifecycleNotificationJobPayload
} from "@ai-nft-forge/shared";

import { createLogger, type Logger } from "../lib/logger.js";
import { createRedisConnection } from "../lib/redis.js";
import {
  createWorkspaceLifecycleAutomationService,
  type WorkspaceLifecycleAutomationSummary
} from "./automation-service.js";

type RunWorkspaceLifecycleAutomationInput = {
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  logger: Logger;
  redisConnection: Redis;
  triggerSource: WorkspaceLifecycleAutomationRunTriggerSource;
};

function createTransactionalRepositories(database: DatabaseExecutor) {
  const workspaceLifecycleNotificationDeliveryRepository =
    createWorkspaceLifecycleNotificationDeliveryRepository(database);

  return {
    auditLogRepository: createAuditLogRepository(database),
    workspaceDecommissionNotificationRepository:
      createWorkspaceDecommissionNotificationRepository(database),
    workspaceDecommissionRequestRepository:
      createWorkspaceDecommissionRequestRepository(database),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(database),
    workspaceLifecycleNotificationDeliveryRepository:
      {
        create(input: {
          decommissionNotificationId?: string | null;
          deliveredAt?: Date | null;
          deliveryChannel?: "audit_log" | "webhook";
          deliveryState: "queued" | "delivered";
          eventKind: "invitation_reminder" | "decommission_notice";
          eventOccurredAt: Date;
          failureMessage?: string | null;
          invitationId?: string | null;
          ownerUserId: string;
          payloadJson: unknown;
          queuedAt?: Date | null;
          workspaceId: string;
        }) {
          return workspaceLifecycleNotificationDeliveryRepository.create({
            ...input,
            payloadJson: input.payloadJson as never
          });
        },
        updateById: workspaceLifecycleNotificationDeliveryRepository.updateById
      },
    workspaceRepository: createWorkspaceRepository(database)
  };
}

export async function runWorkspaceLifecycleAutomationWithDependencies({
  databaseClient,
  env,
  logger,
  redisConnection,
  triggerSource
}: RunWorkspaceLifecycleAutomationInput): Promise<WorkspaceLifecycleAutomationSummary> {
  const queue = new Queue<
    WorkspaceLifecycleNotificationJobPayload,
    unknown,
    typeof workspaceLifecycleJobNames.processNotificationDelivery
  >(workspaceLifecycleQueueNames.notificationDispatch, {
    connection: redisConnection
  });
  const repositories = createTransactionalRepositories(databaseClient);
  const automationRunRepository =
    createWorkspaceLifecycleAutomationRunRepository(databaseClient);
  const service = createWorkspaceLifecycleAutomationService({
    logger,
    now: () => new Date(),
    queue: {
      enqueue: async (input) => {
        const job = await queue.add(
          workspaceLifecycleJobNames.processNotificationDelivery,
          {
            deliveryId: input.deliveryId,
            requestedAt: new Date().toISOString(),
            source: input.source
          }
        );

        return {
          jobId: job.id ?? `${workspaceLifecycleQueueNames.notificationDispatch}:${input.deliveryId}`
        };
      }
    },
    repositories,
    runInTransaction: (callback) =>
      databaseClient.$transaction((executor) =>
        callback(createTransactionalRepositories(executor))
      ),
    transport: {
      enabled:
        env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED &&
        Boolean(env.WORKSPACE_LIFECYCLE_WEBHOOK_URL)
    }
  });
  const startedAt = new Date();
  const automationRun = await automationRunRepository.create({
    startedAt,
    triggerSource,
    status: "running"
  });

  try {
    const summary = await service.run();

    await automationRunRepository.updateById({
      auditLogDeliveryCount: summary.auditLogDeliveryCount,
      completedAt: new Date(),
      decommissionNoticeCount: summary.decommissionNoticeCount,
      failedWorkspaceCount: summary.failedWorkspaceCount,
      id: automationRun.id,
      invitationReminderCount: summary.invitationReminderCount,
      status: "succeeded",
      webhookQueuedCount: summary.webhookQueuedCount,
      workspaceCount: summary.workspaceCount
    });

    return summary;
  } catch (error) {
    await automationRunRepository.updateById({
      completedAt: new Date(),
      failureMessage:
        error instanceof Error && error.message.trim().length > 0
          ? error.message.trim()
          : "Workspace lifecycle automation failed.",
      id: automationRun.id,
      status: "failed"
    });

    throw error;
  } finally {
    await queue.close();
  }
}

export async function runWorkspaceLifecycleAutomation(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const env = parseWorkerEnv(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.WORKER_SERVICE_NAME
  });
  const databaseClient = createDatabaseClient(rawEnvironment);
  const redisConnection = createRedisConnection(env);

  try {
    return await runWorkspaceLifecycleAutomationWithDependencies({
      databaseClient,
      env,
      logger,
      redisConnection,
      triggerSource: "manual"
    });
  } finally {
    await databaseClient.$disconnect();
    await redisConnection.quit();
  }
}
