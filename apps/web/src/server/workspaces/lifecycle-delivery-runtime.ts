import {
  createUserRepository,
  createWorkspaceLifecycleNotificationDeliveryRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import { parseWorkerEnv } from "@ai-nft-forge/shared";

import { createWorkspaceLifecycleDeliveryService } from "./lifecycle-delivery-service";
import { enqueueWorkspaceLifecycleNotificationJob } from "./lifecycle-delivery-queue";

export function createWorkspaceLifecycleNotificationDeliveryBoundary(
  database: DatabaseExecutor
) {
  const repository =
    createWorkspaceLifecycleNotificationDeliveryRepository(database);

  return {
    create(input: {
      decommissionNotificationId?: string | null;
      deliveredAt?: Date | null;
      deliveryChannel?: "audit_log" | "webhook";
      deliveryState: "queued" | "skipped" | "delivered";
      eventKind: "invitation_reminder" | "decommission_notice";
      eventOccurredAt: Date;
      failureMessage?: string | null;
      invitationId?: string | null;
      ownerUserId: string;
      payloadJson: unknown;
      queuedAt?: Date | null;
      workspaceId: string;
    }) {
      return repository.create({
        ...input,
        payloadJson: input.payloadJson as never
      });
    },
    findById(id: string) {
      return repository.findById(id);
    },
    findByIdForWorkspace(input: { id: string; workspaceId: string }) {
      return repository.findByIdForWorkspace(input);
    },
    listByWorkspaceIds(workspaceIds: string[]) {
      return repository.listByWorkspaceIds(workspaceIds);
    },
    listRecentByWorkspaceId(input: { limit: number; workspaceId: string }) {
      return repository.listRecentByWorkspaceId(input);
    },
    updateById(input: {
      attemptCount?: number;
      deliveredAt?: Date | null;
      deliveryState?: "queued" | "processing" | "delivered" | "failed" | "skipped";
      failedAt?: Date | null;
      failureMessage?: string | null;
      id: string;
      lastAttemptedAt?: Date | null;
      queuedAt?: Date | null;
    }) {
      return repository.updateById(input);
    }
  };
}

export function createRuntimeWorkspaceLifecycleDeliveryService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const workerEnv = parseWorkerEnv(rawEnvironment);

  return createWorkspaceLifecycleDeliveryService({
    now: () => new Date(),
    queue: {
      enqueue: (input) =>
        enqueueWorkspaceLifecycleNotificationJob(
          {
            deliveryId: input.deliveryId,
            requestedAt: new Date().toISOString(),
            source: input.source
          },
          rawEnvironment
        )
    },
    repositories: {
      userRepository: createUserRepository(databaseClient),
      workspaceLifecycleNotificationDeliveryRepository:
        createWorkspaceLifecycleNotificationDeliveryBoundary(databaseClient),
      workspaceRepository: createWorkspaceRepository(databaseClient)
    },
    transport: {
      enabled:
        workerEnv.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED &&
        Boolean(workerEnv.WORKSPACE_LIFECYCLE_WEBHOOK_URL)
    }
  });
}
