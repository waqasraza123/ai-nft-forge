import {
  getNextWorkspaceDecommissionNotificationKind,
  resolveWorkspaceLifecycleDeliveryDecision,
  workspaceInvitationReminderCooldownMilliseconds,
  type WorkspaceLifecycleDecommissionNotificationKind,
  type WorkspaceLifecycleNotificationProviderKey
} from "@ai-nft-forge/shared";

type WorkspaceAutomationOwnerRecord = {
  id: string;
  walletAddress: string;
};

type WorkspaceAutomationWorkspaceRecord = {
  id: string;
  lifecycleAutomationDecommissionNoticesEnabled: boolean;
  lifecycleAutomationEnabled: boolean;
  lifecycleAutomationInvitationRemindersEnabled: boolean;
  lifecycleWebhookDeliverDecommissionNotifications: boolean;
  lifecycleWebhookDeliverInvitationReminders: boolean;
  lifecycleWebhookEnabled: boolean;
  name: string;
  owner: WorkspaceAutomationOwnerRecord;
  ownerUserId: string;
  slug: string;
  status: "active" | "archived" | "suspended";
};

type WorkspaceAutomationInvitationRecord = {
  expiresAt: Date;
  id: string;
  lastRemindedAt: Date | null;
  reminderCount: number;
  role: "owner" | "operator";
  walletAddress: string;
  workspaceId: string;
};

type WorkspaceAutomationDecommissionRequestRecord = {
  executeAfter: Date;
  id: string;
  reason: string | null;
  retentionDays: number;
  workspaceId: string;
};

type WorkspaceAutomationDecommissionNotificationRecord = {
  id: string;
  kind: WorkspaceLifecycleDecommissionNotificationKind;
  requestId: string;
  sentAt: Date;
};

type WorkspaceAutomationDeliveryRecord = {
  deliveryChannel: "audit_log" | "webhook";
  id: string;
};

type WorkspaceAutomationServiceDependencies = {
  logger: {
    error(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
  };
  now: () => Date;
  queue: {
    enqueue(input: {
      deliveryId: string;
      source: "automatic";
    }): Promise<{ jobId: string }>;
  };
  repositories: {
    auditLogRepository: {
      create(input: {
        action: string;
        actorId: string;
        actorType: string;
        entityId: string;
        entityType: string;
        metadataJson: unknown;
      }): Promise<{ id: string }>;
    };
    workspaceDecommissionNotificationRepository: {
      listByRequestIds(
        requestIds: string[]
      ): Promise<WorkspaceAutomationDecommissionNotificationRecord[]>;
    };
    workspaceDecommissionRequestRepository: {
      listScheduledByWorkspaceIds(
        workspaceIds: string[]
      ): Promise<WorkspaceAutomationDecommissionRequestRecord[]>;
    };
    workspaceInvitationRepository: {
      listReminderReadyByWorkspaceIds(input: {
        now: Date;
        reminderReadyBefore: Date;
        workspaceIds: string[];
      }): Promise<WorkspaceAutomationInvitationRecord[]>;
    };
    workspaceLifecycleNotificationDeliveryRepository: {
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
        providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
        queuedAt?: Date | null;
        workspaceId: string;
      }): Promise<WorkspaceAutomationDeliveryRecord>;
      updateById(input: {
        deliveryState?:
          | "queued"
          | "processing"
          | "delivered"
          | "failed"
          | "skipped";
        failedAt?: Date | null;
        failureMessage?: string | null;
        id: string;
        providerKey?: WorkspaceLifecycleNotificationProviderKey | null;
        queuedAt?: Date | null;
      }): Promise<unknown>;
    };
    workspaceRepository: {
      listLifecycleAutomationEligible(): Promise<
        WorkspaceAutomationWorkspaceRecord[]
      >;
    };
  };
  runInTransaction: <T>(
    callback: (
      repositories: WorkspaceAutomationTransactionalRepositories
    ) => Promise<T>
  ) => Promise<T>;
  transport: {
    availableProviderKeys: WorkspaceLifecycleNotificationProviderKey[];
  };
};

type WorkspaceAutomationTransactionalRepositories = {
  auditLogRepository: {
    create(input: {
      action: string;
      actorId: string;
      actorType: string;
      entityId: string;
      entityType: string;
      metadataJson: unknown;
    }): Promise<{ id: string }>;
  };
  workspaceDecommissionNotificationRepository: {
    create(input: {
      kind: WorkspaceLifecycleDecommissionNotificationKind;
      requestId: string;
      sentAt: Date;
      sentByUserId: string;
    }): Promise<WorkspaceAutomationDecommissionNotificationRecord>;
  };
  workspaceInvitationRepository: {
    touchReminderById(input: { id: string; lastRemindedAt: Date }): Promise<{
      id: string;
      lastRemindedAt: Date | null;
      reminderCount: number;
    }>;
  };
};

export type WorkspaceLifecycleAutomationSummary = {
  auditLogDeliveryCount: number;
  decommissionNoticeCount: number;
  failedWorkspaceCount: number;
  invitationReminderCount: number;
  webhookQueuedCount: number;
  workspaceCount: number;
};

function normalizeQueueFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return "The lifecycle notification could not be queued.";
}

function buildInvitationReminderPayload(input: {
  invitation: WorkspaceAutomationInvitationRecord & {
    lastRemindedAt: Date | null;
    reminderCount: number;
  };
  occurredAt: Date;
  owner: WorkspaceAutomationOwnerRecord;
  workspace: WorkspaceAutomationWorkspaceRecord;
}) {
  return {
    actor: {
      userId: input.owner.id,
      walletAddress: input.owner.walletAddress
    },
    event: "workspace.lifecycle_notification",
    invitation: {
      expiresAt: input.invitation.expiresAt.toISOString(),
      id: input.invitation.id,
      lastRemindedAt: input.invitation.lastRemindedAt?.toISOString() ?? null,
      reminderCount: input.invitation.reminderCount,
      role: input.invitation.role,
      walletAddress: input.invitation.walletAddress
    },
    kind: "invitation_reminder" as const,
    occurredAt: input.occurredAt.toISOString(),
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

function buildDecommissionNoticePayload(input: {
  notification: WorkspaceAutomationDecommissionNotificationRecord;
  owner: WorkspaceAutomationOwnerRecord;
  request: WorkspaceAutomationDecommissionRequestRecord;
  workspace: WorkspaceAutomationWorkspaceRecord;
}) {
  return {
    actor: {
      userId: input.owner.id,
      walletAddress: input.owner.walletAddress
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
    kind: "decommission_notice" as const,
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

async function createAuditLogLifecycleDelivery(input: {
  createRecord: {
    decommissionNotificationId?: string | null;
    eventKind: "invitation_reminder" | "decommission_notice";
    eventOccurredAt: Date;
    invitationId?: string | null;
    ownerUserId: string;
    payloadJson: unknown;
    workspaceId: string;
  };
  dependencies: WorkspaceAutomationServiceDependencies;
}) {
  await input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
    {
      ...input.createRecord,
      deliveredAt: input.createRecord.eventOccurredAt,
      deliveryChannel: "audit_log",
      deliveryState: "delivered"
    }
  );
}

async function createQueuedLifecycleDelivery(input: {
  createRecord: {
    decommissionNotificationId?: string | null;
    eventKind: "invitation_reminder" | "decommission_notice";
    eventOccurredAt: Date;
    invitationId?: string | null;
    ownerUserId: string;
    payloadJson: unknown;
    providerKey: WorkspaceLifecycleNotificationProviderKey;
    workspaceId: string;
  };
  dependencies: WorkspaceAutomationServiceDependencies;
}) {
  const queuedAt = input.dependencies.now();
  const delivery =
    await input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.create(
      {
        ...input.createRecord,
        deliveryChannel: "webhook",
        deliveryState: "queued",
        queuedAt
      }
    );

  try {
    await input.dependencies.queue.enqueue({
      deliveryId: delivery.id,
      source: "automatic"
    });
  } catch (error) {
    await input.dependencies.repositories.workspaceLifecycleNotificationDeliveryRepository.updateById(
      {
        deliveryState: "failed",
        failedAt: input.dependencies.now(),
        failureMessage: normalizeQueueFailureMessage(error),
        id: delivery.id,
        queuedAt: null
      }
    );

    throw error;
  }
}

function createWorkspaceAuditMetadata(input: {
  automation: true;
  owner: WorkspaceAutomationOwnerRecord;
  role?: "owner" | "operator";
  targetWalletAddress?: string;
  workspaceId: string;
}) {
  return {
    actorWalletAddress: input.owner.walletAddress,
    automated: input.automation,
    automationKey: "workspace_lifecycle_automation",
    ...(input.role
      ? {
          role: input.role
        }
      : {}),
    ...(input.targetWalletAddress
      ? {
          targetWalletAddress: input.targetWalletAddress
        }
      : {}),
    workspaceId: input.workspaceId
  };
}

export function createWorkspaceLifecycleAutomationService(
  dependencies: WorkspaceAutomationServiceDependencies
) {
  return {
    async run(): Promise<WorkspaceLifecycleAutomationSummary> {
      const now = dependencies.now();
      const eligibleWorkspaces =
        await dependencies.repositories.workspaceRepository.listLifecycleAutomationEligible();
      const workspacesById = new Map(
        eligibleWorkspaces.map((workspace) => [workspace.id, workspace])
      );
      const reminderReadyBefore = new Date(
        now.getTime() - workspaceInvitationReminderCooldownMilliseconds
      );
      const invitationWorkspaceIds = eligibleWorkspaces
        .filter(
          (workspace) =>
            workspace.lifecycleAutomationEnabled &&
            workspace.lifecycleAutomationInvitationRemindersEnabled
        )
        .map((workspace) => workspace.id);
      const decommissionWorkspaceIds = eligibleWorkspaces
        .filter(
          (workspace) =>
            workspace.lifecycleAutomationEnabled &&
            workspace.lifecycleAutomationDecommissionNoticesEnabled
        )
        .map((workspace) => workspace.id);
      const [dueInvitations, scheduledDecommissionRequests] = await Promise.all(
        [
          dependencies.repositories.workspaceInvitationRepository.listReminderReadyByWorkspaceIds(
            {
              now,
              reminderReadyBefore,
              workspaceIds: invitationWorkspaceIds
            }
          ),
          dependencies.repositories.workspaceDecommissionRequestRepository.listScheduledByWorkspaceIds(
            decommissionWorkspaceIds
          )
        ]
      );
      const existingNotifications =
        await dependencies.repositories.workspaceDecommissionNotificationRepository.listByRequestIds(
          scheduledDecommissionRequests.map((request) => request.id)
        );
      const notificationsByRequestId = new Map<
        string,
        WorkspaceAutomationDecommissionNotificationRecord[]
      >();

      for (const notification of existingNotifications) {
        const requestNotifications =
          notificationsByRequestId.get(notification.requestId) ?? [];

        requestNotifications.push(notification);
        notificationsByRequestId.set(
          notification.requestId,
          requestNotifications
        );
      }

      let invitationReminderCount = 0;
      let decommissionNoticeCount = 0;
      let failedWorkspaceCount = 0;
      let auditLogDeliveryCount = 0;
      let webhookQueuedCount = 0;

      for (const invitation of dueInvitations) {
        const workspace = workspacesById.get(invitation.workspaceId);

        if (!workspace) {
          continue;
        }

        const decision = resolveWorkspaceLifecycleDeliveryDecision({
          availableProviderKeys: dependencies.transport.availableProviderKeys,
          eventKind: "invitation_reminder",
          workspacePolicy: {
            deliverDecommissionNotifications:
              workspace.lifecycleWebhookDeliverDecommissionNotifications,
            deliverInvitationReminders:
              workspace.lifecycleWebhookDeliverInvitationReminders,
            webhookEnabled: workspace.lifecycleWebhookEnabled
          }
        });

        if (!decision.shouldQueue) {
          continue;
        }

        try {
          const updatedInvitation = await dependencies.runInTransaction(
            async (repositories) => {
              const touchedInvitation =
                await repositories.workspaceInvitationRepository.touchReminderById(
                  {
                    id: invitation.id,
                    lastRemindedAt: now
                  }
                );

              await repositories.auditLogRepository.create({
                action: "workspace_invitation_reminder_sent",
                actorId: workspace.owner.id,
                actorType: "user",
                entityId: workspace.id,
                entityType: "workspace",
                metadataJson: createWorkspaceAuditMetadata({
                  automation: true,
                  owner: workspace.owner,
                  role: invitation.role,
                  targetWalletAddress: invitation.walletAddress,
                  workspaceId: workspace.id
                })
              });

              return touchedInvitation;
            }
          );

          const createRecord = {
            eventKind: "invitation_reminder" as const,
            eventOccurredAt: now,
            invitationId: invitation.id,
            ownerUserId: workspace.owner.id,
            payloadJson: buildInvitationReminderPayload({
              invitation: {
                ...invitation,
                lastRemindedAt: updatedInvitation.lastRemindedAt,
                reminderCount: updatedInvitation.reminderCount
              },
              occurredAt: now,
              owner: workspace.owner,
              workspace
            }),
            workspaceId: workspace.id
          };

          await createAuditLogLifecycleDelivery({
            createRecord: {
              ...createRecord
            },
            dependencies
          });
          for (const providerKey of decision.providerKeys) {
            await createQueuedLifecycleDelivery({
              createRecord: {
                ...createRecord,
                providerKey
              },
              dependencies
            });
          }
          auditLogDeliveryCount += 1;
          webhookQueuedCount += decision.providerKeys.length;
          invitationReminderCount += 1;
        } catch (error) {
          failedWorkspaceCount += 1;
          dependencies.logger.error(
            "Workspace invitation reminder automation failed",
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown workspace invitation reminder automation error",
              invitationId: invitation.id,
              workspaceId: workspace.id
            }
          );
        }
      }

      for (const request of scheduledDecommissionRequests) {
        const workspace = workspacesById.get(request.workspaceId);

        if (!workspace) {
          continue;
        }

        const nextDueKind = getNextWorkspaceDecommissionNotificationKind({
          executeAfter: request.executeAfter,
          existingNotificationKinds: (
            notificationsByRequestId.get(request.id) ?? []
          ).map((notification) => notification.kind),
          now
        });

        if (!nextDueKind) {
          continue;
        }

        const decision = resolveWorkspaceLifecycleDeliveryDecision({
          availableProviderKeys: dependencies.transport.availableProviderKeys,
          eventKind: "decommission_notice",
          workspacePolicy: {
            deliverDecommissionNotifications:
              workspace.lifecycleWebhookDeliverDecommissionNotifications,
            deliverInvitationReminders:
              workspace.lifecycleWebhookDeliverInvitationReminders,
            webhookEnabled: workspace.lifecycleWebhookEnabled
          }
        });

        if (!decision.shouldQueue) {
          continue;
        }

        try {
          const notification = await dependencies.runInTransaction(
            async (repositories) => {
              const createdNotification =
                await repositories.workspaceDecommissionNotificationRepository.create(
                  {
                    kind: nextDueKind,
                    requestId: request.id,
                    sentAt: now,
                    sentByUserId: workspace.owner.id
                  }
                );

              await repositories.auditLogRepository.create({
                action: "workspace_decommission_notification_recorded",
                actorId: workspace.owner.id,
                actorType: "user",
                entityId: workspace.id,
                entityType: "workspace",
                metadataJson: {
                  ...createWorkspaceAuditMetadata({
                    automation: true,
                    owner: workspace.owner,
                    workspaceId: workspace.id
                  }),
                  notificationKind: nextDueKind,
                  requestId: request.id
                }
              });

              return createdNotification;
            }
          );

          const createRecord = {
            decommissionNotificationId: notification.id,
            eventKind: "decommission_notice" as const,
            eventOccurredAt: notification.sentAt,
            ownerUserId: workspace.owner.id,
            payloadJson: buildDecommissionNoticePayload({
              notification,
              owner: workspace.owner,
              request,
              workspace
            }),
            workspaceId: workspace.id
          };

          await createAuditLogLifecycleDelivery({
            createRecord: {
              ...createRecord
            },
            dependencies
          });
          for (const providerKey of decision.providerKeys) {
            await createQueuedLifecycleDelivery({
              createRecord: {
                ...createRecord,
                providerKey
              },
              dependencies
            });
          }
          auditLogDeliveryCount += 1;
          webhookQueuedCount += decision.providerKeys.length;
          decommissionNoticeCount += 1;
        } catch (error) {
          failedWorkspaceCount += 1;
          dependencies.logger.error(
            "Workspace decommission notice automation failed",
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown workspace decommission notice automation error",
              requestId: request.id,
              workspaceId: workspace.id
            }
          );
        }
      }

      const summary = {
        auditLogDeliveryCount,
        decommissionNoticeCount,
        failedWorkspaceCount,
        invitationReminderCount,
        webhookQueuedCount,
        workspaceCount: eligibleWorkspaces.length
      };

      dependencies.logger.info(
        "Workspace lifecycle automation completed",
        summary
      );

      return summary;
    }
  };
}
