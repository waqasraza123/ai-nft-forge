import {
  createAuditLogRepository,
  createWorkspaceDecommissionNotificationRepository,
  createWorkspaceDecommissionRequestRepository,
  createWorkspaceRepository,
  createUserRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  workspaceDecommissionExecutionResponseSchema,
  workspaceDecommissionNotificationRecordResponseSchema,
  workspaceDecommissionResponseSchema,
  type WorkspaceDecommissionNotificationKind,
  type WorkspaceDecommissionSummary
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "../studio-settings/error";
import { createRuntimeWorkspaceOffboardingService } from "./offboarding-service";
import {
  createWorkspaceDecommissionWorkflowSummary,
  getNextWorkspaceDecommissionNotificationKind,
  serializeWorkspaceDecommissionNotification
} from "./decommission-workflow";
import {
  createRuntimeWorkspaceLifecycleDeliveryService,
  createWorkspaceLifecycleNotificationDeliveryBoundary
} from "./lifecycle-delivery-runtime";
import {
  type WorkspaceLifecycleOwnerRecord,
  type WorkspaceLifecyclePolicyWorkspaceRecord
} from "./lifecycle-delivery-service";

type WorkspaceDecommissionRepositorySet = {
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
  userRepository: {
    findById(id: string): Promise<WorkspaceLifecycleOwnerRecord | null>;
  };
  workspaceDecommissionNotificationRepository: {
    create(input: {
      kind: WorkspaceDecommissionNotificationKind;
      requestId: string;
      sentAt: Date;
      sentByUserId: string;
    }): Promise<{
      id: string;
      kind: WorkspaceDecommissionNotificationKind;
      sentAt: Date;
      sentByUserId: string;
    }>;
    listByRequestId(input: {
      requestId: string;
    }): Promise<
      Array<{
        id: string;
        kind: WorkspaceDecommissionNotificationKind;
        requestId: string;
        sentAt: Date;
        sentByUser: {
          walletAddress: string;
        };
        sentByUserId: string;
      }>
    >;
  };
  workspaceDecommissionRequestRepository: {
    create(input: {
      executeAfter: Date;
      exportConfirmedAt: Date;
      reason?: string | null;
      requestedByUserId: string;
      retentionDays: number;
      workspaceId: string;
    }): Promise<{ id: string }>;
    findScheduledByWorkspaceId(input: {
      workspaceId: string;
    }): Promise<{
      canceledAt: Date | null;
      canceledByUser: {
        walletAddress: string;
      } | null;
      canceledByUserId: string | null;
      createdAt: Date;
      executeAfter: Date;
      executedAt: Date | null;
      executedByUser: {
        walletAddress: string;
      } | null;
      executedByUserId: string | null;
      exportConfirmedAt: Date;
      id: string;
      reason: string | null;
      requestedByUser: {
        walletAddress: string;
      };
      requestedByUserId: string;
      retentionDays: number;
      status: "canceled" | "executed" | "scheduled";
      workspaceId: string;
    } | null>;
    cancelById(input: {
      canceledAt: Date;
      canceledByUserId: string;
      id: string;
    }): Promise<{ id: string }>;
    markExecutedById(input: {
      executedAt: Date;
      executedByUserId: string;
      id: string;
    }): Promise<{ id: string }>;
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
    }): Promise<{
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
      queuedAt: Date | null;
      updatedAt: Date;
      workspaceId: string;
    }>;
    findById(id: string): Promise<{
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
      queuedAt: Date | null;
      updatedAt: Date;
      workspaceId: string;
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
    }): Promise<{
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
      queuedAt: Date | null;
      updatedAt: Date;
      workspaceId: string;
    }>;
  };
  workspaceRepository: {
    deleteByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<{ count: number }>;
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<WorkspaceLifecyclePolicyWorkspaceRecord & {
      decommissionRetentionDaysDefault: number;
      decommissionRetentionDaysMinimum: number;
      requireDecommissionReason: boolean;
    } | null>;
  };
};

type WorkspaceDecommissionOffboardingDependency = {
  exportOwnedWorkspace(input: {
    ownerUserId: string;
    workspaceId: string;
  }): Promise<{
    export: {
      offboarding: {
        blockerCodes: string[];
        cautionCodes: string[];
        readiness: "blocked" | "ready" | "review_required";
      };
      workspace: {
        id: string;
        name: string;
        slug: string;
        status: "active" | "archived" | "suspended";
      };
    };
  }>;
};

type WorkspaceDecommissionServiceDependencies = {
  createTransactionalRepositories?: (
    executor: DatabaseExecutor
  ) => WorkspaceDecommissionRepositorySet;
  lifecycleDeliveryService?: {
    recordDecommissionNoticeDelivery(input: {
      actor: WorkspaceLifecycleOwnerRecord;
      notification: {
        id: string;
        kind: "ready" | "scheduled" | "upcoming";
        sentAt: Date;
      };
      owner: WorkspaceLifecycleOwnerRecord;
      request: {
        executeAfter: Date;
        id: string;
        reason: string | null;
        retentionDays: number;
      };
      workspace: WorkspaceLifecyclePolicyWorkspaceRecord;
    }): Promise<{
      attemptCount: number;
      createdAt: string;
      decommissionNotificationId: string | null;
      decommissionNotificationKind: "ready" | "scheduled" | "upcoming" | null;
      deliveredAt: string | null;
      deliveryChannel: "audit_log" | "webhook";
      deliveryState: "queued" | "processing" | "delivered" | "failed" | "skipped";
      eventKind: "invitation_reminder" | "decommission_notice";
      eventOccurredAt: string;
      failedAt: string | null;
      failureMessage: string | null;
      id: string;
      invitationId: string | null;
      invitationWalletAddress: string | null;
      lastAttemptedAt: string | null;
      queuedAt: string | null;
      updatedAt: string;
    }>;
  };
  now: () => Date;
  offboardingService: WorkspaceDecommissionOffboardingDependency;
  repositories: WorkspaceDecommissionRepositorySet;
  runInTransaction: <T>(
    callback: (repositories: WorkspaceDecommissionRepositorySet) => Promise<T>
  ) => Promise<T>;
};

function createWorkspaceDecommissionRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    workspaceDecommissionNotificationRepository:
      createWorkspaceDecommissionNotificationRepository(database),
    workspaceLifecycleNotificationDeliveryRepository:
      createWorkspaceLifecycleNotificationDeliveryBoundary(database),
    userRepository: createUserRepository(database),
    workspaceDecommissionRequestRepository:
      createWorkspaceDecommissionRequestRepository(database),
    workspaceRepository: createWorkspaceRepository(database)
  };
}

function serializeWorkspaceDecommission(input: {
  canceledAt: Date | null;
  canceledByUser: {
    walletAddress: string;
  } | null;
  canceledByUserId: string | null;
  createdAt: Date;
  executeAfter: Date;
  executedAt: Date | null;
  executedByUser: {
    walletAddress: string;
  } | null;
  executedByUserId: string | null;
  exportConfirmedAt: Date;
  id: string;
  reason: string | null;
  requestedByUser: {
    walletAddress: string;
  };
  requestedByUserId: string;
  retentionDays: number;
  status: "canceled" | "executed" | "scheduled";
}): WorkspaceDecommissionSummary {
  return workspaceDecommissionResponseSchema.shape.decommission.parse({
    canceledAt: input.canceledAt?.toISOString() ?? null,
    canceledByUserId: input.canceledByUserId,
    canceledByWalletAddress: input.canceledByUser?.walletAddress ?? null,
    createdAt: input.createdAt.toISOString(),
    executeAfter: input.executeAfter.toISOString(),
    executedAt: input.executedAt?.toISOString() ?? null,
    executedByUserId: input.executedByUserId,
    executedByWalletAddress: input.executedByUser?.walletAddress ?? null,
    exportConfirmedAt: input.exportConfirmedAt.toISOString(),
    id: input.id,
    reason: input.reason,
    requestedByUserId: input.requestedByUserId,
    requestedByWalletAddress: input.requestedByUser.walletAddress,
    retentionDays: input.retentionDays,
    status: input.status
  });
}

async function requireOwnedWorkspace(input: {
  ownerUserId: string;
  repositories: Pick<
    WorkspaceDecommissionRepositorySet,
    "userRepository" | "workspaceRepository"
  >;
  workspaceId: string;
}) {
  const [owner, workspace] = await Promise.all([
    input.repositories.userRepository.findById(input.ownerUserId),
    input.repositories.workspaceRepository.findByIdForOwner({
      id: input.workspaceId,
      ownerUserId: input.ownerUserId
    })
  ]);

  if (!workspace) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_NOT_FOUND",
      "The requested workspace was not found.",
      404
    );
  }

  if (!owner) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_REQUIRED",
      "Workspace ownership could not be resolved.",
      409
    );
  }

  return {
    owner,
    workspace
  };
}

function assertWorkspaceSlugConfirmation(input: {
  confirmWorkspaceSlug: string;
  workspaceSlug: string;
}) {
  if (input.confirmWorkspaceSlug !== input.workspaceSlug) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_CONFIRMATION_MISMATCH",
      "Confirm the exact workspace slug before scheduling or executing decommission.",
      409
    );
  }
}

function assertWorkspaceArchived(input: {
  workspace: {
    status: "active" | "archived" | "suspended";
  };
}) {
  if (input.workspace.status !== "archived") {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_REQUIRES_ARCHIVE",
      "Archive the workspace before scheduling or executing decommission.",
      409
    );
  }
}

function assertOffboardingReady(input: {
  offboarding: {
    blockerCodes: string[];
    cautionCodes: string[];
    readiness: "blocked" | "ready" | "review_required";
  };
}) {
  if (input.offboarding.readiness === "ready") {
    return;
  }

  const unresolvedCodes =
    input.offboarding.readiness === "blocked"
      ? input.offboarding.blockerCodes
      : input.offboarding.cautionCodes;

  throw new StudioSettingsServiceError(
    "WORKSPACE_DECOMMISSION_NOT_READY",
    `Resolve ${unresolvedCodes.join(", ")} before scheduling or executing decommission.`,
    409
  );
}

function assertWorkspaceRetentionPolicy(input: {
  reason?: string | null | undefined;
  retentionDays: number;
  workspace: {
    decommissionRetentionDaysMinimum: number;
    requireDecommissionReason: boolean;
  };
}) {
  if (
    input.retentionDays < input.workspace.decommissionRetentionDaysMinimum
  ) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_RETENTION_POLICY_VIOLATION",
      `Retention window must be at least ${input.workspace.decommissionRetentionDaysMinimum} day(s) for this workspace.`,
      409
    );
  }

  if (
    input.workspace.requireDecommissionReason &&
    (!input.reason || input.reason.trim().length === 0)
  ) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_REASON_REQUIRED",
      "This workspace requires a decommission reason before scheduling cleanup.",
      409
    );
  }
}

async function recordWorkspaceDecommissionAuditLog(input: {
  action:
    | "workspace_decommission_canceled"
    | "workspace_decommission_executed"
    | "workspace_decommission_notification_recorded"
    | "workspace_decommission_scheduled";
  actor: {
    id: string;
    walletAddress: string;
  };
  notificationKind?: WorkspaceDecommissionNotificationKind;
  executeAfter?: Date;
  exportConfirmedAt?: Date;
  reason?: string | null;
  repositories: Pick<WorkspaceDecommissionRepositorySet, "auditLogRepository">;
  requestId: string;
  retentionDays?: number;
  workspaceId: string;
}) {
  await input.repositories.auditLogRepository.create({
    action: input.action,
    actorId: input.actor.id,
    actorType: "user",
    entityId: input.workspaceId,
    entityType: "workspace",
    metadataJson: {
      actorWalletAddress: input.actor.walletAddress,
      requestId: input.requestId,
      ...(input.executeAfter
        ? {
            executeAfter: input.executeAfter.toISOString()
          }
        : {}),
      ...(input.exportConfirmedAt
        ? {
            exportConfirmedAt: input.exportConfirmedAt.toISOString()
          }
        : {}),
      ...(input.reason
        ? {
            reason: input.reason
          }
        : {}),
      ...(typeof input.retentionDays === "number"
        ? {
            retentionDays: input.retentionDays
          }
        : {}),
      ...(input.notificationKind
        ? {
            notificationKind: input.notificationKind
          }
        : {})
    }
  });
}

export function createWorkspaceDecommissionService(
  dependencies: WorkspaceDecommissionServiceDependencies
) {
  return {
    async scheduleWorkspaceDecommission(input: {
      confirmWorkspaceSlug: string;
      exportConfirmed: true;
      ownerUserId: string;
      reason?: string | null | undefined;
      retentionDays?: number | null | undefined;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      assertWorkspaceArchived({
        workspace
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      assertWorkspaceSlugConfirmation({
        confirmWorkspaceSlug: input.confirmWorkspaceSlug,
        workspaceSlug: workspace.slug
      });
      assertWorkspaceArchived({
        workspace
      });

      const retentionDays =
        input.retentionDays ?? workspace.decommissionRetentionDaysDefault;
      const reason = input.reason?.trim() ? input.reason.trim() : null;
      assertWorkspaceRetentionPolicy({
        reason,
        retentionDays,
        workspace
      });

      if (scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_ALREADY_SCHEDULED",
          "A decommission schedule already exists for this workspace.",
          409
        );
      }

      const offboardingExport =
        await dependencies.offboardingService.exportOwnedWorkspace({
          ownerUserId: input.ownerUserId,
          workspaceId: workspace.id
        });

      assertOffboardingReady({
        offboarding: offboardingExport.export.offboarding
      });

      const executeAfter = new Date(
        now.getTime() + retentionDays * 24 * 60 * 60 * 1000
      );

      await dependencies.repositories.workspaceDecommissionRequestRepository.create(
        {
          executeAfter,
          exportConfirmedAt: now,
          reason,
          requestedByUserId: owner.id,
          retentionDays,
          workspaceId: workspace.id
        }
      );

      const createdRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      if (!createdRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_CREATE_FAILED",
          "The decommission schedule could not be loaded after creation.",
          500
        );
      }

      await recordWorkspaceDecommissionAuditLog({
        action: "workspace_decommission_scheduled",
        actor: owner,
        executeAfter,
        exportConfirmedAt: now,
        reason,
        repositories: dependencies.repositories,
        requestId: createdRequest.id,
        retentionDays,
        workspaceId: workspace.id
      });

      return workspaceDecommissionResponseSchema.parse({
        decommission: serializeWorkspaceDecommission(createdRequest)
      });
    },

    async cancelWorkspaceDecommission(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      if (!scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
          "No pending decommission schedule exists for this workspace.",
          404
        );
      }

      await dependencies.repositories.workspaceDecommissionRequestRepository.cancelById(
        {
          canceledAt: now,
          canceledByUserId: owner.id,
          id: scheduledRequest.id
        }
      );

      await recordWorkspaceDecommissionAuditLog({
        action: "workspace_decommission_canceled",
        actor: owner,
        repositories: dependencies.repositories,
        requestId: scheduledRequest.id,
        workspaceId: workspace.id
      });

      return workspaceDecommissionResponseSchema.parse({
        decommission: serializeWorkspaceDecommission({
          ...scheduledRequest,
          canceledAt: now,
          canceledByUser: {
            walletAddress: owner.walletAddress
          },
          canceledByUserId: owner.id,
          status: "canceled"
        })
      });
    },

    async recordWorkspaceDecommissionNotification(input: {
      kind: WorkspaceDecommissionNotificationKind;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      if (!scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
          "No pending decommission schedule exists for this workspace.",
          404
        );
      }

      const existingNotifications =
        await dependencies.repositories.workspaceDecommissionNotificationRepository.listByRequestId(
          {
            requestId: scheduledRequest.id
          }
        );
      const nextDueKind = getNextWorkspaceDecommissionNotificationKind({
        executeAfter: scheduledRequest.executeAfter,
        existingNotificationKinds: existingNotifications.map(
          (notification) => notification.kind
        ),
        now
      });

      if (nextDueKind !== input.kind) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOTIFICATION_NOT_DUE",
          nextDueKind
            ? `The next due decommission notification is ${nextDueKind}.`
            : "There is no due decommission notification for this workspace.",
          409
        );
      }

      const { recordedNotification, recordedNotifications } =
        await dependencies.runInTransaction(async (repositories) => {
          await repositories.workspaceDecommissionNotificationRepository.create({
            kind: input.kind,
            requestId: scheduledRequest.id,
            sentAt: now,
            sentByUserId: owner.id
          });

          await recordWorkspaceDecommissionAuditLog({
            action: "workspace_decommission_notification_recorded",
            actor: owner,
            notificationKind: input.kind,
            repositories,
            requestId: scheduledRequest.id,
            workspaceId: workspace.id
          });

          const nextRecordedNotifications =
            await repositories.workspaceDecommissionNotificationRepository.listByRequestId(
              {
                requestId: scheduledRequest.id
              }
            );
          const nextRecordedNotification = nextRecordedNotifications.find(
            (notification) =>
              notification.kind === input.kind &&
              notification.sentByUserId === owner.id &&
              notification.sentAt.getTime() === now.getTime()
          );

          if (!nextRecordedNotification) {
            throw new StudioSettingsServiceError(
              "INTERNAL_SERVER_ERROR",
              "The decommission notification could not be loaded after recording.",
              500
            );
          }

          return {
            recordedNotification: nextRecordedNotification,
            recordedNotifications: nextRecordedNotifications
          };
        });

      const delivery = dependencies.lifecycleDeliveryService
        ? await dependencies.lifecycleDeliveryService.recordDecommissionNoticeDelivery(
            {
              actor: owner,
              notification: {
                id: recordedNotification.id,
                kind: recordedNotification.kind,
                sentAt: recordedNotification.sentAt
              },
              owner,
              request: {
                executeAfter: scheduledRequest.executeAfter,
                id: scheduledRequest.id,
                reason: scheduledRequest.reason,
                retentionDays: scheduledRequest.retentionDays
              },
              workspace
            }
          )
        : {
            attemptCount: 0,
            createdAt: now.toISOString(),
            decommissionNotificationId: recordedNotification.id,
            decommissionNotificationKind: recordedNotification.kind,
            deliveredAt: null,
            deliveryChannel: "webhook" as const,
            deliveryState: "skipped" as const,
            eventKind: "decommission_notice" as const,
            eventOccurredAt: recordedNotification.sentAt.toISOString(),
            failedAt: now.toISOString(),
            failureMessage:
              "Lifecycle delivery orchestration is not configured for this service instance.",
            id: `local:${recordedNotification.id}`,
            invitationId: null,
            invitationWalletAddress: null,
            lastAttemptedAt: null,
            queuedAt: null,
            updatedAt: now.toISOString()
          };

      return workspaceDecommissionNotificationRecordResponseSchema.parse({
        delivery,
        notification:
          serializeWorkspaceDecommissionNotification(recordedNotification),
        workflow: createWorkspaceDecommissionWorkflowSummary({
          executeAfter: scheduledRequest.executeAfter,
          notifications: recordedNotifications,
          now
        })
      });
    },

    async executeWorkspaceDecommission(input: {
      confirmWorkspaceSlug: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const offboardingExport =
        await dependencies.offboardingService.exportOwnedWorkspace({
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        });
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      assertWorkspaceSlugConfirmation({
        confirmWorkspaceSlug: input.confirmWorkspaceSlug,
        workspaceSlug: workspace.slug
      });
      assertWorkspaceArchived({
        workspace
      });

      if (!scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
          "No pending decommission schedule exists for this workspace.",
          404
        );
      }

      if (scheduledRequest.executeAfter.getTime() > now.getTime()) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_RETENTION_PENDING",
          `This workspace cannot be decommissioned before ${scheduledRequest.executeAfter.toISOString()}.`,
          409
        );
      }

      assertOffboardingReady({
        offboarding: offboardingExport.export.offboarding
      });

      await dependencies.runInTransaction(async (repositories) => {
        const currentWorkspace =
          await repositories.workspaceRepository.findByIdForOwner({
            id: workspace.id,
            ownerUserId: input.ownerUserId
          });
        const currentRequest =
          await repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
            {
              workspaceId: workspace.id
            }
          );

        if (!currentWorkspace || !currentRequest) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
            "The decommission schedule could not be resolved for execution.",
            404
          );
        }

        await recordWorkspaceDecommissionAuditLog({
          action: "workspace_decommission_executed",
          actor: owner,
          repositories,
          requestId: currentRequest.id,
          workspaceId: workspace.id
        });
        await repositories.workspaceDecommissionRequestRepository.markExecutedById(
          {
            executedAt: now,
            executedByUserId: owner.id,
            id: currentRequest.id
          }
        );
        const deletedWorkspace = await repositories.workspaceRepository.deleteByIdForOwner(
          {
            id: workspace.id,
            ownerUserId: input.ownerUserId
          }
        );

        if (deletedWorkspace.count !== 1) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_DECOMMISSION_DELETE_FAILED",
            "The workspace could not be decommissioned.",
            500
          );
        }
      });

      return workspaceDecommissionExecutionResponseSchema.parse({
        executedAt: now.toISOString(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          status: workspace.status
        }
      });
    }
  };
}

export function createRuntimeWorkspaceDecommissionService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const database = getDatabaseClient(rawEnvironment);

  return createWorkspaceDecommissionService({
    createTransactionalRepositories: createWorkspaceDecommissionRepositories,
    lifecycleDeliveryService:
      createRuntimeWorkspaceLifecycleDeliveryService(rawEnvironment),
    now: () => new Date(),
    offboardingService: createRuntimeWorkspaceOffboardingService(rawEnvironment),
    repositories: createWorkspaceDecommissionRepositories(database),
    runInTransaction: async (callback) =>
      database.$transaction(async (transaction) =>
        callback(createWorkspaceDecommissionRepositories(transaction))
      )
  });
}
