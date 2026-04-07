import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import {
  createAuditLogRepository,
  createDatabaseClient,
  createGenerationRequestRepository,
  createOpsAlertDeliveryRepository,
  createOpsAlertStateRepository,
  createOpsObservabilityCaptureRepository,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  generationBackendReadinessResponseSchema,
  generationQueueNames,
  parseWorkerEnv,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import { createLogger } from "../lib/logger.js";
import type { Logger } from "../lib/logger.js";
import { createRedisConnection } from "../lib/redis.js";
import { createOpsAlertWebhookClient } from "./alert-webhook.js";
import {
  createOpsObservabilityCaptureService,
  type OpsObservabilityCaptureService
} from "./observability-service.js";

type FetchLike = typeof fetch;

type CaptureRuntimeOpsObservabilityInput = {
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  fetchFn?: FetchLike;
  logger: Logger;
  rawEnvironment?: NodeJS.ProcessEnv;
  redisConnection: Redis;
};

function resolveGenerationBackendReadinessUrl(
  rawEnvironment: NodeJS.ProcessEnv
) {
  const generationBackendUrl = rawEnvironment.GENERATION_BACKEND_URL?.trim();

  if (!generationBackendUrl) {
    return null;
  }

  return new URL("/ready", generationBackendUrl).toString();
}

export async function captureRuntimeOpsObservabilityWithDependencies({
  databaseClient,
  env,
  fetchFn = fetch,
  logger,
  rawEnvironment = process.env,
  redisConnection
}: CaptureRuntimeOpsObservabilityInput) {
  const generationDispatchQueue = new Queue(
    generationQueueNames.generationDispatch,
    {
      connection: redisConnection
    }
  );
  const readinessUrl = resolveGenerationBackendReadinessUrl(rawEnvironment);

  const service: OpsObservabilityCaptureService =
    createOpsObservabilityCaptureService({
      alertWebhookDelivery: createOpsAlertWebhookClient({
        env,
        fetchFn
      }),
      auditLogRepository: createAuditLogRepository(databaseClient),
      generationRequestRepository:
        createGenerationRequestRepository(databaseClient),
      loadBackendReadiness: async () => {
        if (!readinessUrl) {
          return {
            message:
              "GENERATION_BACKEND_URL is not configured for the worker runtime.",
            status: "unconfigured" as const
          };
        }

        try {
          const response = await fetchFn(readinessUrl, {
            headers: {
              Accept: "application/json"
            }
          });
          const payload = generationBackendReadinessResponseSchema.parse(
            await response.json()
          );

          if (response.ok || response.status === 503) {
            return {
              message: payload.probe.message,
              status: payload.status
            };
          }

          return {
            message: `Generation backend readiness returned ${response.status}.`,
            status: "unreachable" as const
          };
        } catch (error) {
          return {
            message:
              error instanceof Error
                ? error.message
                : "Generation backend readiness probe failed.",
            status: "unreachable" as const
          };
        }
      },
      loadQueueSnapshot: async () => {
        try {
          const counts = await generationDispatchQueue.getJobCounts(
            "waiting",
            "active",
            "delayed",
            "completed",
            "failed",
            "paused"
          );

          return {
            concurrency: env.GENERATION_QUEUE_CONCURRENCY,
            counts: {
              active: counts.active ?? 0,
              completed: counts.completed ?? 0,
              delayed: counts.delayed ?? 0,
              failed: counts.failed ?? 0,
              paused: counts.paused ?? 0,
              waiting: counts.waiting ?? 0
            },
            message: "Generation dispatch queue metrics loaded from Redis.",
            status: "ok" as const,
            workerAdapter: env.GENERATION_ADAPTER_KIND
          };
        } catch (error) {
          return {
            concurrency: null,
            counts: null,
            message:
              error instanceof Error
                ? error.message
                : "Generation dispatch queue probe failed.",
            status: "unreachable" as const,
            workerAdapter: null
          };
        }
      },
      logger,
      now: () => new Date(),
      opsAlertDeliveryRepository:
        createOpsAlertDeliveryRepository(databaseClient),
      opsAlertStateRepository: createOpsAlertStateRepository(databaseClient),
      opsObservabilityCaptureRepository:
        createOpsObservabilityCaptureRepository(databaseClient)
    });

  try {
    return await service.captureAllOwnerObservability();
  } finally {
    await generationDispatchQueue.close();
  }
}

export async function captureRuntimeOpsObservability(
  rawEnvironment: NodeJS.ProcessEnv = process.env,
  fetchFn: FetchLike = fetch
) {
  const env = parseWorkerEnv(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.WORKER_SERVICE_NAME
  });
  const databaseClient = createDatabaseClient(rawEnvironment);
  const redisConnection = createRedisConnection(env);

  try {
    return await captureRuntimeOpsObservabilityWithDependencies({
      databaseClient,
      env,
      fetchFn,
      logger,
      rawEnvironment,
      redisConnection
    });
  } finally {
    await databaseClient.$disconnect();
    await redisConnection.quit();
  }
}
