import { type Redis } from "ioredis";

import {
  createDatabaseClient,
  createCommerceCheckoutSessionRepository,
  createGenerationRequestRepository,
  createSourceAssetRepository,
  createWorkspaceLifecycleNotificationDeliveryRepository,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  parseCommerceEnv,
  createObjectStorageClient,
  getStorageConfig,
  parseWorkerEnv,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import { createCheckoutFulfillmentWebhookBoundary } from "../commerce/fulfillment-webhook.js";
import { createGenerationAdapter } from "../generation/factory.js";
import { createLogger, type Logger } from "../lib/logger.js";
import { createRedisConnection } from "../lib/redis.js";
import { captureRuntimeOpsObservabilityWithDependencies } from "../ops/runtime.js";
import { reconcileRuntimeOpsWithDependencies } from "../ops/reconciliation-runtime.js";
import {
  startOpsObservabilityCaptureScheduler,
  startOpsReconciliationScheduler
} from "../ops/scheduler.js";
import {
  createQueueRegistry,
  type WorkerQueueRegistry
} from "../queues/registry.js";
import { startWorkspaceLifecycleAutomationScheduler } from "../workspaces/automation-scheduler.js";
import { runWorkspaceLifecycleAutomationWithDependencies } from "../workspaces/automation-runtime.js";
import { createWorkspaceLifecycleWebhookProviderRegistry } from "../workspaces/lifecycle-webhook.js";

export type WorkerApplication = {
  close: () => Promise<void>;
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  logger: Logger;
  opsObservabilityCaptureScheduler: {
    close: () => Promise<void>;
  };
  opsReconciliationScheduler: {
    close: () => Promise<void>;
  };
  workspaceLifecycleAutomationScheduler: {
    close: () => Promise<void>;
  };
  queueRegistry: WorkerQueueRegistry;
  redisConnection: Redis;
};

export async function bootstrapWorkerApplication(
  rawEnvironment: NodeJS.ProcessEnv
): Promise<WorkerApplication> {
  const env = parseWorkerEnv(rawEnvironment);
  const commerceEnv = parseCommerceEnv(rawEnvironment);
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
    fulfillmentWebhook: createCheckoutFulfillmentWebhookBoundary({
      callbackBaseUrl: commerceEnv.COMMERCE_FULFILLMENT_CALLBACK_BASE_URL ?? "",
      callbackBearerToken:
        commerceEnv.COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN ?? "",
      timeoutMs: commerceEnv.COMMERCE_FULFILLMENT_WEBHOOK_TIMEOUT_MS,
      ...(commerceEnv.COMMERCE_FULFILLMENT_WEBHOOK_BEARER_TOKEN
        ? {
            webhookBearerToken:
              commerceEnv.COMMERCE_FULFILLMENT_WEBHOOK_BEARER_TOKEN
          }
        : {}),
      webhookUrl: commerceEnv.COMMERCE_FULFILLMENT_WEBHOOK_URL ?? ""
    }),
    generationAdapter: createGenerationAdapter({
      env,
      logger,
      storageClient: objectStorageClient,
      targetBucketName: storageConfig.S3_BUCKET_PRIVATE
    }),
    lifecycleWebhookRegistry: createWorkspaceLifecycleWebhookProviderRegistry({
      env
    }),
    logger,
    repositories: {
      commerceCheckoutSessionRepository: {
        findByPublicId: async (publicId) => {
          const session =
            await createCommerceCheckoutSessionRepository(
              databaseClient
            ).findByPublicId(publicId);

          if (!session) {
            return null;
          }

          return {
            brandName: session.publishedCollection.brandName,
            brandSlug: session.publishedCollection.brandSlug,
            buyerDisplayName: session.reservation.buyerDisplayName,
            buyerEmail: session.reservation.buyerEmail,
            buyerWalletAddress: session.reservation.buyerWalletAddress,
            checkoutSessionId: session.publicId,
            collectionSlug: session.publishedCollection.slug,
            completedAt: session.completedAt?.toISOString() ?? null,
            editionNumber: session.reservation.publishedCollectionItem.position,
            fulfillmentAutomationAttemptCount:
              session.fulfillmentAutomationAttemptCount,
            fulfillmentAutomationExternalReference:
              session.fulfillmentAutomationExternalReference,
            fulfillmentAutomationStatus: session.fulfillmentAutomationStatus,
            fulfillmentStatus: session.fulfillmentStatus,
            id: session.id,
            priceLabel: session.publishedCollection.priceLabel,
            providerKind: session.providerKind,
            status: session.status,
            title: session.publishedCollection.title
          };
        },
        updateFulfillmentAutomationById: (input) =>
          createCommerceCheckoutSessionRepository(
            databaseClient
          ).updateFulfillmentAutomationById(input)
      },
      generationRequestRepository:
        createGenerationRequestRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient),
      workspaceLifecycleNotificationDeliveryRepository:
        createWorkspaceLifecycleNotificationDeliveryRepository(databaseClient)
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
  const opsReconciliationScheduler = startOpsReconciliationScheduler({
    env,
    logger,
    reconcile: () =>
      reconcileRuntimeOpsWithDependencies({
        databaseClient,
        logger,
        rawEnvironment
      }),
    redisConnection
  });
  const workspaceLifecycleAutomationScheduler =
    startWorkspaceLifecycleAutomationScheduler({
      env,
      logger,
      redisConnection,
      runAutomation: () =>
        runWorkspaceLifecycleAutomationWithDependencies({
          databaseClient,
          env,
          logger,
          redisConnection,
          triggerSource: "scheduled"
        })
    });

  let isClosed = false;

  const close = async () => {
    if (isClosed) {
      return;
    }

    isClosed = true;

    await opsObservabilityCaptureScheduler.close();
    await opsReconciliationScheduler.close();
    await workspaceLifecycleAutomationScheduler.close();
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
    opsReconciliationScheduler,
    workspaceLifecycleAutomationScheduler,
    queueRegistry,
    redisConnection
  };
}
