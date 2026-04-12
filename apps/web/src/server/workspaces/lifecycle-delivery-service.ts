import {
  resolveWorkspaceLifecycleDeliveryDecision,
  workspaceLifecycleDeliveryPolicySchema,
  workspaceLifecycleNotificationDeliveryOverviewSchema,
  workspaceLifecycleNotificationDeliverySummarySchema,
  type WorkspaceLifecycleDeliveryPolicy,
  type WorkspaceLifecycleNotificationDeliverySummary,
  type WorkspaceLifecycleNotificationEventKind
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "../studio-settings/error";

export type WorkspaceLifecyclePolicyWorkspaceRecord = {
  id: string;
  lifecycleWebhookDeliverDecommissionNotifications: boolean;
  lifecycleWebhookDeliverInvitationReminders: boolean;
  lifecycleWebhookEnabled: boolean;
  name: string;
  ownerUserId: string;
  slug: string;
  status: "active" | "archived" | "suspended";
};

export type WorkspaceLifecycleOwnerRecord = {
  id: string;
  walletAddress: string;
};

type WorkspaceLifecycleInvitationRecord = {
  expiresAt: Date;
  id: string;
  lastRemindedAt: Date | null;
  reminderCount: number;
  role: "operator" | "owner";
  walletAddress: string;
};

type WorkspaceLifecycleDecommissionNotificationRecord = {
  id: string;
  kind: "ready" | "scheduled" | "upcoming";
  sentAt: Date;
};

type WorkspaceLifecycleDecommissionRequestRecord = {
  executeAfter: Date;
  id: string;
  reason: string | null;
  retentionDays: number;
};

type WorkspaceLifecycleDeliveryRecord = {
  attemptCount: number;
  createdAt: Date;
  decommissionNotification: {
    id: string;
    kind: "ready" | "scheduled" | "upcoming";
  } | null;
  decommissionNotificationId: string | null;
  deliveredAt: Date | null;
  deliveryChannel: "webhook";
  deliveryState: "queued" | "processing" | "delivered" | "failed" | "skipped";
  eventKind: "invitation_reminder" | "decommission_notice";
  eventOccurredAt: Date;
  failedAt: Date | null;
  failureMessage: string | null;
  id: string;
  invitation: {
    id: string;
    walletAddress: string;
  } | null;
  invitationId: string | null;
  lastAttemptedAt: Date | null;
  payloadJson: unknown;
  queuedAt: Date | null;
  updatedAt: Date;
  workspaceId: string;
};

type WorkspaceLifecycleDeliveryServiceDependencies = {
  now: () => Date;
  queue: {
    enqueue(input: {
      deliveryId: string;
      source: "automatic" | "manual_retry";
    }): Promise<{ jobId: string }>;
  };
  repositories: {
    userRepository: {
      findById(id: string): Promise<WorkspaceLifecycleOwnerRecord | null>;
    };
    workspaceLifecycleNotificationDeliveryRepository: {
      create(input: {
        decommissionNotificationId?: string | null;
        deliveryState: "queued" | "skipped";
        eventKind: "invitation_reminder" | "decommission_notice";
        eventOccurredAt: Date;
        failureMessage?: string | null;
        invitationId?: string | null;
        ownerUserId: string;
        payloadJson: unknown;
        queuedAt?: Date | null;
        workspaceId: string;
      }): Promise<WorkspaceLifecycleDeliveryRecord>;
      findById(id: string): Promise<WorkspaceLifecycleDeliveryRecord | null>;
      findByIdForWorkspace(input: {
        id: string;
        workspaceId: string;
      }): Promise<WorkspaceLifecycleDeliveryRecord | null>;
      listRecentByWorkspaceId(input: {
        limit: number;
        workspaceId: string;
      }): Promise<WorkspaceLifecycleDeliveryRecord[]>;
      updateById(input: {
        attemptCount?: number;
        deliveredAt?: Date | null;
        deliveryState?: "queued" | "processing" | "delivered" | "failed" | "skipped";
        failedAt?: Date | null;
        failureMessage?: string | null;
        id: string;
        lastAttemptedAt?: Date | null;
        queuedAt?: Date | null;
      }): Promise<WorkspaceLifecycleDeliveryRecord>;
    };
    workspaceRepository: {
      findByIdForOwner(input: {
        id: string;
        ownerUserId: string;
      }): Promise<WorkspaceLifecyclePolicyWorkspaceRecord | null>;
    };
  };
  transport: {
    enabled: boolean;
  };
};

function normalizeQueueFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return "The lifecycle notification could not be queued.";
}

function buildInvitationReminderPayload(input: {
  actor: WorkspaceLifecycleOwnerRecord;
  invitation: WorkspaceLifecycleInvitationRecord;
  occurredAt: Date;
  owner: WorkspaceLifecycleOwnerRecord;
  workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
}): unknown {
  return {
    actor: {
      userId: input.actor.id,
      walletAddress: input.actor.walletAddress
    },
    event: "workspace.lifecycle_notification",
    kind: "invitation_reminder",
    occurredAt: input.occurredAt.toISOString(),
    ownerUserId: input.owner.id,
    ownerWalletAddress: input.owner.walletAddress,
    invitation: {
      expiresAt: input.invitation.expiresAt.toISOString(),
      id: input.invitation.id,
      lastRemindedAt: input.invitation.lastRemindedAt?.toISOString() ?? null,
      reminderCount: input.invitation.reminderCount,
      role: input.invitation.role,
      walletAddress: input.invitation.walletAddress
    },
    workspace: {
      id: input.workspace.id,
      name: input.workspace.name,
      slug: input.workspace.slug,
      status: input.workspace.status
    }
  };
}

function buildDecommissionNoticePayload(input: {
  actor: WorkspaceLifecycleOwnerRecord;
  notification: WorkspaceLifecycleDecommissionNotificationRecord;
  owner: WorkspaceLifecycleOwnerRecord;
  request: WorkspaceLifecycleDecommissionRequestRecord;
  workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
}): unknown {
  return {
    actor: {
      userId: input.actor.id,
      walletAddress: input.actor.walletAddress
    },
    decommissionNotice: {
      executeAfter: input.request.executeAfter.toISOString(),
      id: input.notification.id,
      kind: input.notification.kind,
      reason: input.request.reason,
      requestId: input.request.id,
      retentionDays: input.request.retentionDays,
      sentAt: input.notification.sentAt.toISOString()
    },
    event: "workspace.lifecycle_notification",
    kind: "decommission_notice",
    occurredAt: input.notification.sentAt.toISOString(),
    ownerUserId: input.owner.id,
    ownerWalletAddress: input.owner.walletAddress,
    workspace: {
      id: input.workspace.id,
      name: input.workspace.name,
      slug: input.workspace.slug,
      status: input.workspace.status
    }
  };
}

export function serializeWorkspaceLifecycleDeliveryPolicy(
  workspace: WorkspaceLifecyclePolicyWorkspaceRecord
): WorkspaceLifecycleDeliveryPolicy {
  return workspaceLifecycleDeliveryPolicySchema.parse({
    deliverDecommissionNotifications:
      workspace.lifecycleWebhookDeliverDecommissionNotifications,
    deliverInvitationReminders:
      workspace.lifecycleWebhookDeliverInvitationReminders,
    webhookEnabled: workspace.lifecycleWebhookEnabled
  });
}

export function serializeWorkspaceLifecycleNotificationDelivery(
  delivery: WorkspaceLifecycleDeliveryRecord
): WorkspaceLifecycleNotificationDeliverySummary {
  return workspaceLifecycleNotificationDeliverySummarySchema.parse({
    attemptCount: delivery.attemptCount,
    createdAt: delivery.createdAt.toISOString(),
    decommissionNotificationId: delivery.decommissionNotificationId,
    decommissionNotificationKind: delivery.decommissionNotification?.kind ?? null,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    deliveryChannel: delivery.deliveryChannel,
    deliveryState: delivery.deliveryState,
    eventKind: delivery.eventKind,
    eventOccurredAt: delivery.eventOccurredAt.toISOString(),
    failedAt: delivery.failedAt?.toISOString() ?? null,
    failureMessage: delivery.failureMessage,
    id: delivery.id,
    invitationId: delivery.invitationId,
    invitationWalletAddress: delivery.invitation?.walletAddress ?? null,
    lastAttemptedAt: delivery.lastAttemptedAt?.toISOString() ?? null,
    queuedAt: delivery.queuedAt?.toISOString() ?? null,
    updatedAt: delivery.updatedAt.toISOString()
  });
}

export function createWorkspaceLifecycleDeliveryOverview(input: {
  deliveries: WorkspaceLifecycleDeliveryRecord[];
}) {
  const sortedDeliveries = [...input.deliveries].sort((left, right) => {
    const createdAtDifference =
      right.createdAt.getTime() - left.createdAt.getTime();

    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }

    return right.id.localeCompare(left.id);
  });

  return workspaceLifecycleNotificationDeliveryOverviewSchema.parse({
    deliveredCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "delivered"
    ).length,
    failedCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "failed"
    ).length,
    latestDelivery: sortedDeliveries[0]
      ? serializeWorkspaceLifecycleNotificationDelivery(sortedDeliveries[0])
      : null,
    queuedCount: input.deliveries.filter(
      (delivery) =>
        delivery.deliveryState === "queued" ||
        delivery.deliveryState === "processing"
    ).length,
    skippedCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "skipped"
    ).length
  });
}

async function queueLifecycleDelivery(input: {
  dependencies: WorkspaceLifecycleDeliveryServiceDependencies;
  deliveryId: string;
  source: "automatic" | "manual_retry";
}) {
  try {
    await input.dependencies.queue.enqueue({
      deliveryId: input.deliveryId,
      source: input.source
    });
  } catch (error) {
    return input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
      {
        deliveryState: "failed",
        failedAt: input.dependencies.now(),
        failureMessage: normalizeQueueFailureMessage(error),
        id: input.deliveryId,
        queuedAt: null
      }
    );
  }

  return input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.findById(
    input.deliveryId
  );
}

export function createWorkspaceLifecycleDeliveryService(
  dependencies: WorkspaceLifecycleDeliveryServiceDependencies
) {
  return {
    async getRecentWorkspaceLifecycleDeliveries(input: {
      limit: number;
      workspaceId: string;
    }) {
      const deliveries =
        await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.listRecentByWorkspaceId(
          input
        );

      return deliveries.map((delivery) =>
        serializeWorkspaceLifecycleNotificationDelivery(delivery)
      );
    },

    async recordDecommissionNoticeDelivery(input: {
      actor: WorkspaceLifecycleOwnerRecord;
      notification: WorkspaceLifecycleDecommissionNotificationRecord;
      owner: WorkspaceLifecycleOwnerRecord;
      request: WorkspaceLifecycleDecommissionRequestRecord;
      workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
    }) {
      const decision = resolveWorkspaceLifecycleDeliveryDecision({
        eventKind: "decommission_notice",
        transportEnabled: dependencies.transport.enabled,
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(
          input.workspace
        )
      });
      const delivery =
        await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
          {
            decommissionNotificationId: input.notification.id,
            deliveryState: decision.shouldQueue ? "queued" : "skipped",
            eventKind: "decommission_notice",
            eventOccurredAt: input.notification.sentAt,
            failureMessage: decision.failureMessage,
            ownerUserId: input.owner.id,
            payloadJson: buildDecommissionNoticePayload(input),
            queuedAt: decision.shouldQueue ? dependencies.now() : null,
            workspaceId: input.workspace.id
          }
        );
      const queuedDelivery = decision.shouldQueue
        ? await queueLifecycleDelivery({
            deliveryId: delivery.id,
            dependencies,
            source: "automatic"
          })
        : delivery;

      return serializeWorkspaceLifecycleNotificationDelivery(
        queuedDelivery ?? delivery
      );
    },

    async recordInvitationReminderDelivery(input: {
      actor: WorkspaceLifecycleOwnerRecord;
      invitation: WorkspaceLifecycleInvitationRecord;
      owner: WorkspaceLifecycleOwnerRecord;
      occurredAt: Date;
      workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
    }) {
      const decision = resolveWorkspaceLifecycleDeliveryDecision({
        eventKind: "invitation_reminder",
        transportEnabled: dependencies.transport.enabled,
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(
          input.workspace
        )
      });
      const delivery =
        await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
          {
            deliveryState: decision.shouldQueue ? "queued" : "skipped",
            eventKind: "invitation_reminder",
            eventOccurredAt: input.occurredAt,
            failureMessage: decision.failureMessage,
            invitationId: input.invitation.id,
            ownerUserId: input.owner.id,
            payloadJson: buildInvitationReminderPayload(input),
            queuedAt: decision.shouldQueue ? dependencies.now() : null,
            workspaceId: input.workspace.id
          }
        );
      const queuedDelivery = decision.shouldQueue
        ? await queueLifecycleDelivery({
            deliveryId: delivery.id,
            dependencies,
            source: "automatic"
          })
        : delivery;

      return serializeWorkspaceLifecycleNotificationDelivery(
        queuedDelivery ?? delivery
      );
    },

    async retryWorkspaceLifecycleDelivery(input: {
      deliveryId: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const [owner, workspace, delivery] = await Promise.all([
        dependencies.repositories.userRepository.findById(input.ownerUserId),
        dependencies.repositories.workspaceRepository.findByIdForOwner({
          id: input.workspaceId,
          ownerUserId: input.ownerUserId
        }),
        dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.findByIdForWorkspace(
          {
            id: input.deliveryId,
            workspaceId: input.workspaceId
          }
        )
      ]);

      if (!workspace || !owner) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_NOT_FOUND",
          "The requested workspace was not found.",
          404
        );
      }

      if (!delivery) {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_FOUND",
          "The requested lifecycle delivery record was not found.",
          404
        );
      }

      if (
        delivery.deliveryState === "queued" ||
        delivery.deliveryState === "processing"
      ) {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          "This lifecycle delivery is already queued for dispatch.",
          409
        );
      }

      if (delivery.deliveryState === "delivered") {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          "Delivered lifecycle notifications do not need a retry.",
          409
        );
      }

      const decision = resolveWorkspaceLifecycleDeliveryDecision({
        eventKind: delivery.eventKind,
        transportEnabled: dependencies.transport.enabled,
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(workspace)
      });

      if (!decision.shouldQueue) {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          decision.failureMessage ?? "Lifecycle delivery is not retryable.",
          409
        );
      }

      const queuedDelivery =
        await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
          {
            deliveryState: "queued",
            failedAt: null,
            failureMessage: null,
            id: delivery.id,
            queuedAt: dependencies.now()
          }
        );
      const requeuedDelivery = await queueLifecycleDelivery({
        deliveryId: queuedDelivery.id,
        dependencies,
        source: "manual_retry"
      });

      return serializeWorkspaceLifecycleNotificationDelivery(
        requeuedDelivery ?? queuedDelivery
      );
    }
  };
}
