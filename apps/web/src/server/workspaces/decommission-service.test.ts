import { describe, expect, it } from "vitest";

import { StudioSettingsServiceError } from "../studio-settings/error";

import { createWorkspaceDecommissionService } from "./decommission-service";

function createWorkspaceDecommissionHarness(input?: {
  requireDecommissionReason?: boolean;
  retentionDaysDefault?: number;
  retentionDaysMinimum?: number;
  now?: Date;
  offboardingReadiness?: "blocked" | "ready" | "review_required";
  scheduledExecuteAfter?: Date | null;
  workspaceStatus?: "active" | "archived" | "suspended";
}) {
  const now = input?.now ?? new Date("2026-04-12T05:00:00.000Z");
  let workspaceDeleted = false;
  let notificationIndex = 0;
  const lifecycleDeliveries: Array<{
    deliveryState: "queued" | "processing" | "delivered" | "failed" | "skipped";
    id: string;
    providerKey?: "primary" | "secondary" | null;
  }> = [];
  let scheduledRequest: {
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
  } | null =
    input?.scheduledExecuteAfter === undefined
      ? null
      : {
          canceledAt: null,
          canceledByUser: null,
          canceledByUserId: null,
          createdAt: new Date("2026-04-12T01:00:00.000Z"),
          executeAfter:
            input.scheduledExecuteAfter ?? new Date("2026-04-20T05:00:00.000Z"),
          executedAt: null,
          executedByUser: null,
          executedByUserId: null,
          exportConfirmedAt: new Date("2026-04-12T01:00:00.000Z"),
          id: "request_1",
          reason: "Workspace sunset",
          requestedByUser: {
            walletAddress: "0x1111111111111111111111111111111111111111"
          },
          requestedByUserId: "user_owner",
          retentionDays: 30,
          status: "scheduled" as const,
          workspaceId: "workspace_1"
        };
  const auditActions: string[] = [];
  const notifications: Array<{
    id: string;
    kind: "ready" | "scheduled" | "upcoming";
    requestId: string;
    sentAt: Date;
    sentByUser: {
      walletAddress: string;
    };
    sentByUserId: string;
  }> = [];

  const repositories = {
    auditLogRepository: {
      async create(inputRecord: {
        action: string;
        actorId: string;
        actorType: string;
        entityId: string;
        entityType: string;
        metadataJson: unknown;
      }) {
        auditActions.push(inputRecord.action);

        return {
          id: `audit_${auditActions.length}`
        };
      }
    },
    userRepository: {
      async findById(id: string) {
        return {
          id,
          walletAddress: "0x1111111111111111111111111111111111111111"
        };
      }
    },
    workspaceDecommissionNotificationRepository: {
      async create(inputRecord: {
        kind: "ready" | "scheduled" | "upcoming";
        requestId: string;
        sentAt: Date;
        sentByUserId: string;
      }) {
        notificationIndex += 1;
        notifications.push({
          id: `notification_${notificationIndex}`,
          kind: inputRecord.kind,
          requestId: inputRecord.requestId,
          sentAt: inputRecord.sentAt,
          sentByUser: {
            walletAddress: "0x1111111111111111111111111111111111111111"
          },
          sentByUserId: inputRecord.sentByUserId
        });

        return {
          id: `notification_${notificationIndex}`,
          kind: inputRecord.kind,
          sentAt: inputRecord.sentAt,
          sentByUserId: inputRecord.sentByUserId
        };
      },
      async listByRequestId(inputRecord: { requestId: string }) {
        return notifications.filter(
          (notification) => notification.requestId === inputRecord.requestId
        );
      }
    },
    workspaceDecommissionRequestRepository: {
      async create(inputRecord: {
        executeAfter: Date;
        exportConfirmedAt: Date;
        reason?: string | null;
        requestedByUserId: string;
        retentionDays: number;
        workspaceId: string;
      }) {
        scheduledRequest = {
          canceledAt: null,
          canceledByUser: null,
          canceledByUserId: null,
          createdAt: now,
          executeAfter: inputRecord.executeAfter,
          executedAt: null,
          executedByUser: null,
          executedByUserId: null,
          exportConfirmedAt: inputRecord.exportConfirmedAt,
          id: "request_created",
          reason: inputRecord.reason ?? null,
          requestedByUser: {
            walletAddress: "0x1111111111111111111111111111111111111111"
          },
          requestedByUserId: inputRecord.requestedByUserId,
          retentionDays: inputRecord.retentionDays,
          status: "scheduled",
          workspaceId: inputRecord.workspaceId
        };

        return {
          id: scheduledRequest.id
        };
      },
      async findScheduledByWorkspaceId(inputRecord: { workspaceId: string }) {
        if (
          !scheduledRequest ||
          scheduledRequest.workspaceId !== inputRecord.workspaceId ||
          scheduledRequest.status !== "scheduled"
        ) {
          return null;
        }

        return {
          ...scheduledRequest
        };
      },
      async cancelById(inputRecord: {
        canceledAt: Date;
        canceledByUserId: string;
        id: string;
      }) {
        if (scheduledRequest?.id === inputRecord.id) {
          scheduledRequest = {
            ...scheduledRequest,
            canceledAt: inputRecord.canceledAt,
            canceledByUser: {
              walletAddress: "0x1111111111111111111111111111111111111111"
            },
            canceledByUserId: inputRecord.canceledByUserId,
            status: "canceled"
          };
        }

        return {
          id: inputRecord.id
        };
      },
      async markExecutedById(inputRecord: {
        executedAt: Date;
        executedByUserId: string;
        id: string;
      }) {
        if (scheduledRequest?.id === inputRecord.id) {
          scheduledRequest = {
            ...scheduledRequest,
            executedAt: inputRecord.executedAt,
            executedByUser: {
              walletAddress: "0x1111111111111111111111111111111111111111"
            },
            executedByUserId: inputRecord.executedByUserId,
            status: "executed"
          };
        }

        return {
          id: inputRecord.id
        };
      }
    },
    workspaceLifecycleNotificationDeliveryRepository: {
      async create() {
        return {
          attemptCount: 0,
          createdAt: now,
          decommissionNotification: null,
          decommissionNotificationId: null,
          deliveredAt: null,
          deliveryChannel: "webhook" as const,
          deliveryState: "queued" as const,
          eventKind: "decommission_notice" as const,
          eventOccurredAt: now,
          failedAt: null,
          failureMessage: null,
          id: `delivery_${lifecycleDeliveries.length + 1}`,
          invitation: null,
          invitationId: null,
          lastAttemptedAt: null,
          payloadJson: {},
          queuedAt: now,
          updatedAt: now,
          workspaceId: "workspace_1"
        };
      },
      async findById() {
        return null;
      },
      async updateById() {
        return {
          attemptCount: 0,
          createdAt: now,
          decommissionNotification: null,
          decommissionNotificationId: null,
          deliveredAt: null,
          deliveryChannel: "webhook" as const,
          deliveryState: "queued" as const,
          eventKind: "decommission_notice" as const,
          eventOccurredAt: now,
          failedAt: null,
          failureMessage: null,
          id: "delivery_1",
          invitation: null,
          invitationId: null,
          lastAttemptedAt: null,
          payloadJson: {},
          queuedAt: now,
          updatedAt: now,
          workspaceId: "workspace_1"
        };
      }
    },
    workspaceRepository: {
      async deleteByIdForOwner(inputRecord: {
        id: string;
        ownerUserId: string;
      }) {
        workspaceDeleted = true;

        return {
          count:
            inputRecord.id === "workspace_1" &&
            inputRecord.ownerUserId === "user_owner"
              ? 1
              : 0
        };
      },
      async findByIdForOwner(inputRecord: { id: string; ownerUserId: string }) {
        if (
          workspaceDeleted ||
          inputRecord.id !== "workspace_1" ||
          inputRecord.ownerUserId !== "user_owner"
        ) {
          return null;
        }

        return {
          decommissionRetentionDaysDefault: input?.retentionDaysDefault ?? 30,
          decommissionRetentionDaysMinimum: input?.retentionDaysMinimum ?? 7,
          id: "workspace_1",
          lifecycleWebhookDeliverDecommissionNotifications: true,
          lifecycleWebhookDeliverInvitationReminders: true,
          lifecycleWebhookEnabled: true,
          name: "Workspace One",
          ownerUserId: "user_owner",
          requireDecommissionReason: input?.requireDecommissionReason ?? false,
          slug: "workspace-one",
          status: input?.workspaceStatus ?? "archived"
        };
      }
    }
  };

  const service = createWorkspaceDecommissionService({
    lifecycleDeliveryService: {
      async recordDecommissionNoticeDelivery(inputRecord) {
        lifecycleDeliveries.push({
          deliveryState: "queued",
          id: `delivery_${lifecycleDeliveries.length + 1}`,
          providerKey: "primary"
        });

        return [
          {
            attemptCount: 0,
            createdAt: inputRecord.notification.sentAt.toISOString(),
            decommissionNotificationId: inputRecord.notification.id,
            decommissionNotificationKind: inputRecord.notification.kind,
            deliveredAt: null,
            deliveryChannel: "webhook" as const,
            deliveryState: "queued" as const,
            eventKind: "decommission_notice" as const,
            eventOccurredAt: inputRecord.notification.sentAt.toISOString(),
            failedAt: null,
            failureMessage: null,
            id: `delivery_${lifecycleDeliveries.length}`,
            invitationId: null,
            invitationWalletAddress: null,
            lastAttemptedAt: null,
            providerKey: "primary" as const,
            queuedAt: inputRecord.notification.sentAt.toISOString(),
            updatedAt: inputRecord.notification.sentAt.toISOString()
          }
        ];
      }
    },
    now: () => now,
    offboardingService: {
      async exportOwnedWorkspace() {
        return {
          export: {
            offboarding: {
              blockerCodes:
                input?.offboardingReadiness === "blocked"
                  ? ["active_alerts"]
                  : [],
              cautionCodes:
                input?.offboardingReadiness === "review_required"
                  ? ["unfulfilled_checkouts"]
                  : [],
              readiness: input?.offboardingReadiness ?? "ready"
            },
            accessReview: {
              attestationStatus: "current" as const,
              currentEvidenceHash:
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              generatedAt: now.toISOString(),
              latestAttestation: {
                actorUserId: "user_owner",
                actorWalletAddress:
                  "0x1111111111111111111111111111111111111111",
                auditEntryId: "audit_access_review",
                createdAt: now.toISOString(),
                reviewGeneratedAt: now.toISOString(),
                reviewHash:
                  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                summary: {
                  auditEntryCount: 1,
                  invitationCount: 0,
                  memberCount: 1,
                  pendingRoleEscalationCount: 0,
                  roleEscalationCount: 0
                },
                workspace: {
                  id: "workspace_1",
                  name: "Workspace One",
                  ownerUserId: "user_owner",
                  ownerWalletAddress:
                    "0x1111111111111111111111111111111111111111",
                  slug: "workspace-one",
                  status: input?.workspaceStatus ?? "archived"
                }
              },
              summaryDelta: null
            },
            workspace: {
              id: "workspace_1",
              name: "Workspace One",
              slug: "workspace-one",
              status: input?.workspaceStatus ?? "archived"
            }
          }
        };
      }
    },
    repositories,
    runInTransaction: async (callback) => callback(repositories)
  });

  return {
    auditActions,
    getNotifications() {
      return notifications;
    },
    getLifecycleDeliveries() {
      return lifecycleDeliveries;
    },
    getScheduledRequest() {
      return scheduledRequest;
    },
    service,
    wasWorkspaceDeleted() {
      return workspaceDeleted;
    }
  };
}

describe("createWorkspaceDecommissionService", () => {
  it("schedules decommission for archived ready workspaces", async () => {
    const harness = createWorkspaceDecommissionHarness();

    const result = await harness.service.scheduleWorkspaceDecommission({
      confirmWorkspaceSlug: "workspace-one",
      exportConfirmed: true,
      ownerUserId: "user_owner",
      reason: "Workspace sunset",
      retentionDays: 30,
      workspaceId: "workspace_1"
    });

    expect(result.decommission.status).toBe("scheduled");
    expect(result.decommission.retentionDays).toBe(30);
    expect(result.decommission.executeAfter).toBe("2026-05-12T05:00:00.000Z");
    expect(harness.auditActions).toContain("workspace_decommission_scheduled");
  });

  it("uses the workspace default retention window when none is provided", async () => {
    const harness = createWorkspaceDecommissionHarness({
      retentionDaysDefault: 45
    });

    const result = await harness.service.scheduleWorkspaceDecommission({
      confirmWorkspaceSlug: "workspace-one",
      exportConfirmed: true,
      ownerUserId: "user_owner",
      workspaceId: "workspace_1"
    });

    expect(result.decommission.retentionDays).toBe(45);
    expect(result.decommission.executeAfter).toBe("2026-05-27T05:00:00.000Z");
  });

  it("rejects scheduling below the workspace minimum retention policy", async () => {
    const harness = createWorkspaceDecommissionHarness({
      retentionDaysMinimum: 21
    });

    await expect(
      harness.service.scheduleWorkspaceDecommission({
        confirmWorkspaceSlug: "workspace-one",
        exportConfirmed: true,
        ownerUserId: "user_owner",
        retentionDays: 14,
        workspaceId: "workspace_1"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "WORKSPACE_DECOMMISSION_RETENTION_POLICY_VIOLATION",
        "Retention window must be at least 21 day(s) for this workspace.",
        409
      )
    );
  });

  it("rejects scheduling without a reason when the workspace policy requires one", async () => {
    const harness = createWorkspaceDecommissionHarness({
      requireDecommissionReason: true
    });

    await expect(
      harness.service.scheduleWorkspaceDecommission({
        confirmWorkspaceSlug: "workspace-one",
        exportConfirmed: true,
        ownerUserId: "user_owner",
        retentionDays: 30,
        workspaceId: "workspace_1"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "WORKSPACE_DECOMMISSION_REASON_REQUIRED",
        "This workspace requires a decommission reason before scheduling cleanup.",
        409
      )
    );
  });

  it("records the next due decommission notification", async () => {
    const harness = createWorkspaceDecommissionHarness({
      scheduledExecuteAfter: new Date("2026-04-20T05:00:00.000Z")
    });

    const result =
      await harness.service.recordWorkspaceDecommissionNotification({
        kind: "scheduled",
        ownerUserId: "user_owner",
        workspaceId: "workspace_1"
      });

    expect(result.deliveries[0]?.deliveryState).toBe("queued");
    expect(result.notification.kind).toBe("scheduled");
    expect(result.workflow.notificationCount).toBe(1);
    expect(result.workflow.nextDueKind).toBeNull();
    expect(harness.auditActions).toContain(
      "workspace_decommission_notification_recorded"
    );
  });

  it("cancels an active decommission schedule", async () => {
    const harness = createWorkspaceDecommissionHarness({
      scheduledExecuteAfter: new Date("2026-05-12T05:00:00.000Z")
    });

    const result = await harness.service.cancelWorkspaceDecommission({
      ownerUserId: "user_owner",
      workspaceId: "workspace_1"
    });

    expect(result.decommission.status).toBe("canceled");
    expect(result.decommission.canceledByUserId).toBe("user_owner");
    expect(harness.auditActions).toContain("workspace_decommission_canceled");
  });

  it("executes decommission after retention expires", async () => {
    const harness = createWorkspaceDecommissionHarness({
      now: new Date("2026-05-12T05:00:00.000Z"),
      scheduledExecuteAfter: new Date("2026-05-01T05:00:00.000Z")
    });

    const result = await harness.service.executeWorkspaceDecommission({
      confirmWorkspaceSlug: "workspace-one",
      ownerUserId: "user_owner",
      workspaceId: "workspace_1"
    });

    expect(result.workspace.slug).toBe("workspace-one");
    expect(result.executedAt).toBe("2026-05-12T05:00:00.000Z");
    expect(harness.wasWorkspaceDeleted()).toBe(true);
    expect(harness.auditActions).toContain("workspace_decommission_executed");
  });

  it("rejects execution before the retention window ends", async () => {
    const harness = createWorkspaceDecommissionHarness({
      scheduledExecuteAfter: new Date("2026-05-12T05:00:00.000Z")
    });

    await expect(
      harness.service.executeWorkspaceDecommission({
        confirmWorkspaceSlug: "workspace-one",
        ownerUserId: "user_owner",
        workspaceId: "workspace_1"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "WORKSPACE_DECOMMISSION_RETENTION_PENDING",
        "This workspace cannot be decommissioned before 2026-05-12T05:00:00.000Z.",
        409
      )
    );
  });

  it("rejects decommission notification records when the requested notice is not due", async () => {
    const harness = createWorkspaceDecommissionHarness({
      scheduledExecuteAfter: new Date("2026-04-14T05:00:00.000Z")
    });

    await expect(
      harness.service.recordWorkspaceDecommissionNotification({
        kind: "scheduled",
        ownerUserId: "user_owner",
        workspaceId: "workspace_1"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "WORKSPACE_DECOMMISSION_NOTIFICATION_NOT_DUE",
        "The next due decommission notification is upcoming.",
        409
      )
    );
  });
});
