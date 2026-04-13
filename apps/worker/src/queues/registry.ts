import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import type { DatabaseClient } from "@ai-nft-forge/database";
import {
  commerceJobNames,
  commerceQueueNames,
  type CommerceFulfillmentAutomationStatus,
  type CommerceFulfillmentJobPayload,
  generationJobNames,
  generationQueueNames,
  foundationJobNames,
  foundationQueueNames,
  type GenerationJobPayload,
  queueCatalog,
  workspaceLifecycleJobNames,
  workspaceLifecycleQueueNames,
  type WorkspaceLifecycleNotificationJobPayload,
  type WorkspaceLifecycleNotificationProviderKey,
  type NoopJobPayload,
  type WorkerEnv
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";
import type { CheckoutFulfillmentWebhookBoundary } from "../commerce/fulfillment-webhook.js";
import type { GenerationAdapter } from "../generation/adapter.js";
import {
  createCommerceFulfillmentProcessor,
  type CommerceFulfillmentJobResult
} from "../processors/commerce-fulfillment-processor.js";
import {
  createGenerationRequestProcessor,
  type GenerationRequestJobResult
} from "../processors/generation-request-processor.js";
import {
  createNoopProcessor,
  type NoopJobResult
} from "../processors/noop-processor.js";
import {
  createWorkspaceLifecycleNotificationProcessor,
  type WorkspaceLifecycleNotificationJobResult
} from "../processors/workspace-lifecycle-notification-processor.js";
import type { WorkspaceLifecycleWebhookProviderRegistry } from "../workspaces/lifecycle-webhook.js";

type WorkerQueueRegistryOptions = {
  databaseClient: DatabaseClient;
  env: WorkerEnv;
  fulfillmentWebhook: CheckoutFulfillmentWebhookBoundary;
  generationAdapter: GenerationAdapter;
  lifecycleWebhookRegistry: WorkspaceLifecycleWebhookProviderRegistry;
  logger: Logger;
  repositories: {
    commerceCheckoutSessionRepository: {
      findByPublicId(publicId: string): Promise<{
        brandName: string;
        brandSlug: string;
        buyerDisplayName: string | null;
        buyerEmail: string;
        buyerWalletAddress: string | null;
        checkoutSessionId: string;
        collectionSlug: string;
        completedAt: string | null;
        editionNumber: number;
        fulfillmentAutomationAttemptCount: number;
        fulfillmentAutomationExternalReference: string | null;
        fulfillmentAutomationStatus: CommerceFulfillmentAutomationStatus;
        fulfillmentStatus: "unfulfilled" | "fulfilled";
        id: string;
        priceLabel: string | null;
        providerKind: "manual" | "stripe";
        status: "open" | "completed" | "expired" | "canceled";
        title: string;
      } | null>;
      updateFulfillmentAutomationById(input: {
        fulfillmentAutomationAttemptCount?: number;
        fulfillmentAutomationErrorCode?: string | null;
        fulfillmentAutomationErrorMessage?: string | null;
        fulfillmentAutomationExternalReference?: string | null;
        fulfillmentAutomationLastAttemptedAt?: Date | null;
        fulfillmentAutomationLastSucceededAt?: Date | null;
        fulfillmentAutomationNextRetryAt?: Date | null;
        fulfillmentAutomationQueuedAt?: Date | null;
        fulfillmentAutomationStatus?: CommerceFulfillmentAutomationStatus;
        fulfillmentProviderKind?: "manual" | "webhook";
        id: string;
      }): Promise<unknown>;
    };
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
    workspaceLifecycleNotificationDeliveryRepository: {
      findById(id: string): Promise<{
        attemptCount: number;
        deliveryChannel: "audit_log" | "webhook";
        deliveredAt: Date | null;
        deliveryState: "queued" | "processing" | "delivered" | "failed" | "skipped";
        id: string;
        payloadJson: unknown;
        providerKey: WorkspaceLifecycleNotificationProviderKey | null;
      } | null>;
      updateById(input: {
        attemptCount?: number;
        deliveredAt?: Date | null;
        deliveryState?: "queued" | "processing" | "delivered" | "failed" | "skipped";
        failedAt?: Date | null;
        failureMessage?: string | null;
        id: string;
        lastAttemptedAt?: Date | null;
        providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
        queuedAt?: Date | null;
      }): Promise<unknown>;
    };
  };
  redisConnection: Redis;
};

export type WorkerQueueRegistry = {
  queueCatalog: typeof queueCatalog;
  queues: {
    fulfillmentDispatch: Queue<
      CommerceFulfillmentJobPayload,
      CommerceFulfillmentJobResult,
      typeof commerceJobNames.processCheckoutFulfillment
    >;
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
    workspaceLifecycleDispatch: Queue<
      WorkspaceLifecycleNotificationJobPayload,
      WorkspaceLifecycleNotificationJobResult,
      typeof workspaceLifecycleJobNames.processNotificationDelivery
    >;
  };
  workers: Array<
    | Worker<
        CommerceFulfillmentJobPayload,
        CommerceFulfillmentJobResult,
        typeof commerceJobNames.processCheckoutFulfillment
      >
    | Worker<
        GenerationJobPayload,
        GenerationRequestJobResult,
        typeof generationJobNames.processSourceAssetGeneration
      >
    | Worker<
        WorkspaceLifecycleNotificationJobPayload,
        WorkspaceLifecycleNotificationJobResult,
        typeof workspaceLifecycleJobNames.processNotificationDelivery
      >
    | Worker<NoopJobPayload, NoopJobResult, typeof foundationJobNames.noop>
  >;
};

export function createQueueRegistry({
  databaseClient,
  env,
  fulfillmentWebhook,
  generationAdapter,
  lifecycleWebhookRegistry,
  logger,
  repositories,
  redisConnection
}: WorkerQueueRegistryOptions): WorkerQueueRegistry {
  const processCommerceFulfillment = createCommerceFulfillmentProcessor({
    now: () => new Date(),
    repositories: {
      commerceCheckoutSessionRepository:
        repositories.commerceCheckoutSessionRepository
    },
    webhook: fulfillmentWebhook
  });
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
  const processWorkspaceLifecycleNotification =
    createWorkspaceLifecycleNotificationProcessor({
      now: () => new Date(),
      repositories: {
        workspaceLifecycleNotificationDeliveryRepository:
          repositories.workspaceLifecycleNotificationDeliveryRepository
      },
      transportRegistry: lifecycleWebhookRegistry
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
  const fulfillmentDispatchQueue = new Queue<
    CommerceFulfillmentJobPayload,
    CommerceFulfillmentJobResult,
    typeof commerceJobNames.processCheckoutFulfillment
  >(commerceQueueNames.fulfillmentDispatch, {
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
  const workspaceLifecycleDispatchQueue = new Queue<
    WorkspaceLifecycleNotificationJobPayload,
    WorkspaceLifecycleNotificationJobResult,
    typeof workspaceLifecycleJobNames.processNotificationDelivery
  >(workspaceLifecycleQueueNames.notificationDispatch, {
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
  const fulfillmentDispatchWorker = new Worker<
    CommerceFulfillmentJobPayload,
    CommerceFulfillmentJobResult,
    typeof commerceJobNames.processCheckoutFulfillment
  >(
    commerceQueueNames.fulfillmentDispatch,
    async (job) => {
      if (job.name !== commerceJobNames.processCheckoutFulfillment) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      return processCommerceFulfillment(job);
    },
    {
      concurrency: env.COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY,
      connection: redisConnection
    }
  );
  const workspaceLifecycleDispatchWorker = new Worker<
    WorkspaceLifecycleNotificationJobPayload,
    WorkspaceLifecycleNotificationJobResult,
    typeof workspaceLifecycleJobNames.processNotificationDelivery
  >(
    workspaceLifecycleQueueNames.notificationDispatch,
    async (job) => {
      if (job.name !== workspaceLifecycleJobNames.processNotificationDelivery) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      return processWorkspaceLifecycleNotification(job);
    },
    {
      concurrency: env.WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY,
      connection: redisConnection
    }
  );

  logger.info("Registered worker queues", {
    queueNames: queueCatalog.map((entry) => entry.queueName)
  });

  return {
    queueCatalog,
    queues: {
      fulfillmentDispatch: fulfillmentDispatchQueue,
      generationDispatch: generationDispatchQueue,
      foundation: foundationQueue,
      workspaceLifecycleDispatch: workspaceLifecycleDispatchQueue
    },
    workers: [
      fulfillmentDispatchWorker,
      generationDispatchWorker,
      foundationWorker,
      workspaceLifecycleDispatchWorker
    ]
  };
}
