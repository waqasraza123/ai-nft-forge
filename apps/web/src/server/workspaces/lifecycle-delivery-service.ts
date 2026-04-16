import {
  resolveWorkspaceLifecycleDeliveryDecision,
  workspaceLifecycleNotificationProviderLabels,
  workspaceLifecycleNotificationTransportProviderSchema,
  workspaceLifecycleDeliveryPolicySchema,
  workspaceLifecycleNotificationDeliveryOverviewSchema,
  workspaceLifecycleNotificationDeliverySummarySchema,
  type WorkspaceLifecycleDeliveryPolicy,
  type WorkspaceLifecycleNotificationDeliverySummary,
  type WorkspaceLifecycleNotificationEventKind,
  type WorkspaceLifecycleNotificationProviderKey,
  type WorkspaceLifecycleNotificationTransportProvider
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
  deliveryChannel: "audit_log" | "webhook";
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
  providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
  queuedAt: Date | null;
  updatedAt: Date;
  workspaceId: string;
};

type WorkspaceLifecycleTransportProviderRecord = {
  enabled: boolean;
  key: WorkspaceLifecycleNotificationProviderKey;
  label: string;
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
        deliveredAt?: Date | null;
        deliveryChannel?: "audit_log" | "webhook";
        deliveryState: "queued" | "skipped" | "delivered";
        eventKind: "invitation_reminder" | "decommission_notice";
        eventOccurredAt: Date;
        failureMessage?: string | null;
        invitationId?: string | null;
        ownerUserId: string;
        payloadJson: unknown;
        providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
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
        deliveryState?:
          | "queued"
          | "processing"
          | "delivered"
          | "failed"
          | "skipped";
        failedAt?: Date | null;
        failureMessage?: string | null;
        id: string;
        lastAttemptedAt?: Date | null;
        providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
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
    providers: WorkspaceLifecycleTransportProviderRecord[];
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

export function getWorkspaceLifecycleTransportProviders(input: {
  providers: WorkspaceLifecycleTransportProviderRecord[];
}) {
  return input.providers.map((provider) =>
    serializeWorkspaceLifecycleTransportProvider(provider)
  );
}

export function serializeWorkspaceLifecycleNotificationDelivery(
  delivery: WorkspaceLifecycleDeliveryRecord
): WorkspaceLifecycleNotificationDeliverySummary {
  return workspaceLifecycleNotificationDeliverySummarySchema.parse({
    attemptCount: delivery.attemptCount,
    createdAt: delivery.createdAt.toISOString(),
    decommissionNotificationId: delivery.decommissionNotificationId,
    decommissionNotificationKind:
      delivery.decommissionNotification?.kind ?? null,
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
    providerKey: delivery.providerKey,
    queuedAt: delivery.queuedAt?.toISOString() ?? null,
    updatedAt: delivery.updatedAt.toISOString()
  });
}

export function serializeWorkspaceLifecycleTransportProvider(
  provider: WorkspaceLifecycleTransportProviderRecord
): WorkspaceLifecycleNotificationTransportProvider {
  return workspaceLifecycleNotificationTransportProviderSchema.parse(provider);
}

export function createWorkspaceLifecycleDeliveryOverview(input: {
  providers: WorkspaceLifecycleTransportProviderRecord[];
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
  const deliveriesByChannel = {
    audit_log: input.deliveries.filter(
      (delivery) => delivery.deliveryChannel === "audit_log"
    ),
    webhook: input.deliveries.filter(
      (delivery) => delivery.deliveryChannel === "webhook"
    )
  } as const;
  const providerOverviews = input.providers.map((provider) => {
    const providerDeliveries = input.deliveries.filter(
      (delivery) =>
        delivery.deliveryChannel === "webhook" &&
        delivery.providerKey === provider.key
    );
    const latestDelivery = [...providerDeliveries].sort((left, right) => {
      const createdAtDifference =
        right.createdAt.getTime() - left.createdAt.getTime();

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return right.id.localeCompare(left.id);
    })[0];

    return {
      deliveredCount: providerDeliveries.filter(
        (delivery) => delivery.deliveryState === "delivered"
      ).length,
      failedCount: providerDeliveries.filter(
        (delivery) => delivery.deliveryState === "failed"
      ).length,
      key: provider.key,
      label: provider.label,
      latestDelivery: latestDelivery
        ? serializeWorkspaceLifecycleNotificationDelivery(latestDelivery)
        : null,
      queuedCount: providerDeliveries.filter(
        (delivery) =>
          delivery.deliveryState === "queued" ||
          delivery.deliveryState === "processing"
      ).length,
      skippedCount: providerDeliveries.filter(
        (delivery) => delivery.deliveryState === "skipped"
      ).length
    };
  });

  const createChannelOverview = (
    deliveries: WorkspaceLifecycleDeliveryRecord[]
  ) => {
    const latestDelivery = [...deliveries].sort((left, right) => {
      const createdAtDifference =
        right.createdAt.getTime() - left.createdAt.getTime();

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return right.id.localeCompare(left.id);
    })[0];

    return {
      deliveredCount: deliveries.filter(
        (delivery) => delivery.deliveryState === "delivered"
      ).length,
      failedCount: deliveries.filter(
        (delivery) => delivery.deliveryState === "failed"
      ).length,
      latestDelivery: latestDelivery
        ? serializeWorkspaceLifecycleNotificationDelivery(latestDelivery)
        : null,
      queuedCount: deliveries.filter(
        (delivery) =>
          delivery.deliveryState === "queued" ||
          delivery.deliveryState === "processing"
      ).length,
      skippedCount: deliveries.filter(
        (delivery) => delivery.deliveryState === "skipped"
      ).length
    };
  };

  return workspaceLifecycleNotificationDeliveryOverviewSchema.parse({
    auditLog: createChannelOverview(deliveriesByChannel.audit_log),
    deliveredCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "delivered"
    ).length,
    failedCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "failed"
    ).length,
    latestDelivery: sortedDeliveries[0]
      ? serializeWorkspaceLifecycleNotificationDelivery(sortedDeliveries[0])
      : null,
    providers: providerOverviews,
    queuedCount: input.deliveries.filter(
      (delivery) =>
        delivery.deliveryState === "queued" ||
        delivery.deliveryState === "processing"
    ).length,
    skippedCount: input.deliveries.filter(
      (delivery) => delivery.deliveryState === "skipped"
    ).length,
    webhook: createChannelOverview(deliveriesByChannel.webhook)
  });
}

async function recordWorkspaceLifecycleAuditDelivery(input: {
  createRecord: {
    decommissionNotificationId?: string | null;
    eventKind: "invitation_reminder" | "decommission_notice";
    eventOccurredAt: Date;
    invitationId?: string | null;
    ownerUserId: string;
    payloadJson: unknown;
    workspaceId: string;
  };
  dependencies: WorkspaceLifecycleDeliveryServiceDependencies;
}) {
  return input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
    {
      ...input.createRecord,
      deliveredAt: input.createRecord.eventOccurredAt,
      deliveryChannel: "audit_log",
      deliveryState: "delivered"
    }
  );
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

function getAvailableLifecycleProviderKeys(
  dependencies: WorkspaceLifecycleDeliveryServiceDependencies
) {
  return dependencies.transport.providers
    .filter((provider) => provider.enabled)
    .map((provider) => provider.key);
}

export function createWorkspaceLifecycleDeliveryService(
  dependencies: WorkspaceLifecycleDeliveryServiceDependencies
) {
  return {
    getTransportProviders() {
      return getWorkspaceLifecycleTransportProviders({
        providers: dependencies.transport.providers
      });
    },

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
        availableProviderKeys: getAvailableLifecycleProviderKeys(dependencies),
        eventKind: "decommission_notice",
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(
          input.workspace
        )
      });
      const createRecord = {
        decommissionNotificationId: input.notification.id,
        eventKind: "decommission_notice" as const,
        eventOccurredAt: input.notification.sentAt,
        ownerUserId: input.owner.id,
        payloadJson: buildDecommissionNoticePayload(input),
        workspaceId: input.workspace.id
      };

      await recordWorkspaceLifecycleAuditDelivery({
        createRecord,
        dependencies
      });
      if (!decision.shouldQueue) {
        const skippedDelivery =
          await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
            {
              ...createRecord,
              deliveryChannel: "webhook",
              deliveryState: "skipped",
              failureMessage: decision.failureMessage,
              queuedAt: null
            }
          );

        return [
          serializeWorkspaceLifecycleNotificationDelivery(skippedDelivery)
        ];
      }

      const deliveries: WorkspaceLifecycleNotificationDeliverySummary[] = [];

      for (const providerKey of decision.providerKeys) {
        const delivery =
          await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
            {
              ...createRecord,
              deliveryChannel: "webhook",
              deliveryState: "queued",
              providerKey,
              queuedAt: dependencies.now()
            }
          );
        const queuedDelivery = await queueLifecycleDelivery({
          deliveryId: delivery.id,
          dependencies,
          source: "automatic"
        });

        deliveries.push(
          serializeWorkspaceLifecycleNotificationDelivery(
            queuedDelivery ?? delivery
          )
        );
      }

      return deliveries;
    },

    async recordInvitationReminderDelivery(input: {
      actor: WorkspaceLifecycleOwnerRecord;
      invitation: WorkspaceLifecycleInvitationRecord;
      owner: WorkspaceLifecycleOwnerRecord;
      occurredAt: Date;
      workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
    }) {
      const decision = resolveWorkspaceLifecycleDeliveryDecision({
        availableProviderKeys: getAvailableLifecycleProviderKeys(dependencies),
        eventKind: "invitation_reminder",
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(
          input.workspace
        )
      });
      const createRecord = {
        eventKind: "invitation_reminder" as const,
        eventOccurredAt: input.occurredAt,
        invitationId: input.invitation.id,
        ownerUserId: input.owner.id,
        payloadJson: buildInvitationReminderPayload(input),
        workspaceId: input.workspace.id
      };

      await recordWorkspaceLifecycleAuditDelivery({
        createRecord,
        dependencies
      });
      if (!decision.shouldQueue) {
        const skippedDelivery =
          await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
            {
              ...createRecord,
              deliveryChannel: "webhook",
              deliveryState: "skipped",
              failureMessage: decision.failureMessage,
              queuedAt: null
            }
          );

        return [
          serializeWorkspaceLifecycleNotificationDelivery(skippedDelivery)
        ];
      }

      const deliveries: WorkspaceLifecycleNotificationDeliverySummary[] = [];

      for (const providerKey of decision.providerKeys) {
        const delivery =
          await dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
            {
              ...createRecord,
              deliveryChannel: "webhook",
              deliveryState: "queued",
              providerKey,
              queuedAt: dependencies.now()
            }
          );
        const queuedDelivery = await queueLifecycleDelivery({
          deliveryId: delivery.id,
          dependencies,
          source: "automatic"
        });

        deliveries.push(
          serializeWorkspaceLifecycleNotificationDelivery(
            queuedDelivery ?? delivery
          )
        );
      }

      return deliveries;
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

      if (delivery.deliveryChannel !== "webhook") {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          "Audit-log lifecycle deliveries do not need a retry.",
          409
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
        availableProviderKeys: getAvailableLifecycleProviderKeys(dependencies),
        eventKind: delivery.eventKind,
        workspacePolicy: serializeWorkspaceLifecycleDeliveryPolicy(workspace)
      });

      if (!decision.shouldQueue) {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          decision.failureMessage ?? "Lifecycle delivery is not retryable.",
          409
        );
      }

      if (
        delivery.providerKey &&
        !decision.providerKeys.includes(delivery.providerKey)
      ) {
        throw new StudioSettingsServiceError(
          "LIFECYCLE_DELIVERY_NOT_RETRYABLE",
          `${
            workspaceLifecycleNotificationProviderLabels[delivery.providerKey]
          } is not configured for retry on this service instance.`,
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
            providerKey:
              delivery.providerKey ?? decision.providerKeys[0] ?? null,
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
