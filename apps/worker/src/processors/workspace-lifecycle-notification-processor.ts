import type { Job } from "bullmq";

import {
  workspaceLifecycleNotificationJobPayloadSchema,
  type WorkspaceLifecycleNotificationJobPayload
} from "@ai-nft-forge/shared";

type WorkspaceLifecycleNotificationProcessorDependencies = {
  now: () => Date;
  repositories: {
    workspaceLifecycleNotificationDeliveryRepository: {
      findById(id: string): Promise<{
        attemptCount: number;
        deliveredAt: Date | null;
        deliveryState: "queued" | "processing" | "delivered" | "failed" | "skipped";
        id: string;
        payloadJson: unknown;
      } | null>;
      updateById(input: {
        attemptCount?: number;
        deliveredAt?: Date | null;
        deliveryState?: "queued" | "processing" | "delivered" | "failed" | "skipped";
        failedAt?: Date | null;
        failureMessage?: string | null;
        id: string;
        lastAttemptedAt?: Date | null;
        queuedAt?: Date | null;
      }): Promise<unknown>;
    };
  };
  webhook: {
    deliver(input: { deliveryId: string; payload: unknown }): Promise<void>;
  };
};

export type WorkspaceLifecycleNotificationJobResult = {
  deliveryId: string;
  queueName: string;
  status: "delivered" | "skipped";
};

type WorkspaceLifecycleNotificationJob = Pick<
  Job<WorkspaceLifecycleNotificationJobPayload>,
  "data" | "id" | "name" | "queueName"
>;

export function createWorkspaceLifecycleNotificationProcessor(
  dependencies: WorkspaceLifecycleNotificationProcessorDependencies
) {
  return async (
    job: WorkspaceLifecycleNotificationJob
  ): Promise<WorkspaceLifecycleNotificationJobResult> => {
    const payload = workspaceLifecycleNotificationJobPayloadSchema.parse(job.data);
    const delivery =
      await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.findById(
        payload.deliveryId
      );

    if (!delivery) {
      throw new Error(
        `Workspace lifecycle delivery ${payload.deliveryId} was not found.`
      );
    }

    if (
      delivery.deliveryState === "delivered" ||
      delivery.deliveryState === "skipped"
    ) {
      return {
        deliveryId: payload.deliveryId,
        queueName: job.queueName,
        status: "skipped"
      };
    }

    const attemptedAt = dependencies.now();

    await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
      {
        attemptCount: delivery.attemptCount + 1,
        deliveryState: "processing",
        failedAt: null,
        failureMessage: null,
        id: delivery.id,
        lastAttemptedAt: attemptedAt
      }
    );

    try {
      await dependencies.webhook.deliver({
        deliveryId: delivery.id,
        payload: delivery.payloadJson
      });
    } catch (error) {
      const failureMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message.trim()
          : "Workspace lifecycle delivery failed.";

      await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
        {
          deliveryState: "failed",
          failedAt: dependencies.now(),
          failureMessage,
          id: delivery.id,
          queuedAt: null
        }
      );

      throw error;
    }

    await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
      {
        deliveredAt: dependencies.now(),
        deliveryState: "delivered",
        failedAt: null,
        failureMessage: null,
        id: delivery.id,
        queuedAt: null
      }
    );

    return {
      deliveryId: payload.deliveryId,
      queueName: job.queueName,
      status: "delivered"
    };
  };
}
