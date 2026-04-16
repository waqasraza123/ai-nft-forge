import { describe, expect, it } from "vitest";

import { StudioSettingsServiceError } from "../studio-settings/error";

import { createWorkspaceOffboardingService } from "./offboarding-service";

function createWorkspaceOffboardingHarness() {
  const service = createWorkspaceOffboardingService({
    directoryService: {
      async listAccessibleWorkspaceDirectory(input) {
        return {
          workspaces: input.workspaces.map((workspace) => ({
            brandCount: workspace.id === "workspace_ready" ? 1 : 2,
            current: workspace.id === input.currentWorkspaceId,
            expiredInvitationCount: 0,
            expiringInvitationCount:
              workspace.id === "workspace_review" ? 1 : 0,
            lastActivityAt: "2026-04-12T04:00:00.000Z",
            memberCount: 2,
            pendingInvitationCount: workspace.id === "workspace_review" ? 1 : 0,
            pendingRoleEscalationCount:
              workspace.id === "workspace_review" ? 1 : 0,
            workspace
          }))
        };
      }
    },
    lifecycleAutomationSnapshotLoader: async () => ({
      lifecycleAutomationHealth: {
        enabled: true,
        intervalSeconds: 300,
        jitterSeconds: 15,
        lastRunAgeSeconds: 60,
        lastRunAt: "2026-04-12T04:59:00.000Z",
        latestRun: null,
        lockTtlSeconds: 600,
        message:
          "Automatic lifecycle scheduling is active and recent runs are arriving on schedule.",
        runOnStart: true,
        status: "healthy" as const
      },
      recentLifecycleAutomationRuns: []
    }),
    now: () => new Date("2026-04-12T05:00:00.000Z"),
    transportProviders: [
      {
        enabled: true,
        key: "primary",
        label: "Primary webhook"
      }
    ],
    repositories: {
      auditLogRepository: {
        async listByEntity() {
          return [
            {
              action: "workspace_created",
              actorId: "user_owner",
              createdAt: new Date("2026-04-10T00:00:00.000Z"),
              id: "audit_1",
              metadataJson: {
                actorWalletAddress: "0x1111111111111111111111111111111111111111"
              }
            }
          ];
        }
      },
      brandRepository: {
        async listByWorkspaceId(workspaceId: string) {
          if (workspaceId === "workspace_missing") {
            return [];
          }

          return [
            {
              customDomain: null,
              id: `brand_${workspaceId}`,
              name: `Brand ${workspaceId}`,
              slug: `brand-${workspaceId.replaceAll("_", "-")}`,
              themeJson: {
                accentColor: "#8b5e34"
              }
            }
          ];
        }
      },
      commerceCheckoutSessionRepository: {
        async listDetailedByWorkspaceId(workspaceId: string) {
          if (workspaceId === "workspace_blocked") {
            return [
              {
                checkoutUrl: "https://example.com/checkout/open",
                completedAt: null,
                createdAt: new Date("2026-04-11T00:00:00.000Z"),
                fulfillmentAutomationStatus: "idle" as const,
                fulfillmentStatus: "unfulfilled" as const,
                id: "checkout_open",
                providerKind: "manual" as const,
                publicId: "public_open",
                publishedCollection: {
                  id: "publication_blocked",
                  title: "Blocked Release",
                  workspaceId
                },
                status: "open" as const
              }
            ];
          }

          return [
            {
              checkoutUrl: "https://example.com/checkout/completed",
              completedAt: new Date("2026-04-11T00:00:00.000Z"),
              createdAt: new Date("2026-04-10T00:00:00.000Z"),
              fulfillmentAutomationStatus: "failed" as const,
              fulfillmentStatus: "unfulfilled" as const,
              id: "checkout_completed",
              providerKind: "stripe" as const,
              publicId: "public_completed",
              publishedCollection: {
                id: "publication_review",
                title: "Review Release",
                workspaceId
              },
              status: "completed" as const
            }
          ];
        },
        async listDetailedByWorkspaceIds(workspaceIds: string[]) {
          const checkouts: Array<{
            fulfillmentAutomationStatus: "failed" | "idle";
            fulfillmentStatus: "unfulfilled";
            id: string;
            publishedCollection: {
              workspaceId: string;
            };
            status: "completed" | "open";
          }> = [];

          for (const workspaceId of workspaceIds) {
            if (workspaceId === "workspace_blocked") {
              checkouts.push({
                fulfillmentAutomationStatus: "idle",
                fulfillmentStatus: "unfulfilled",
                id: "checkout_open",
                publishedCollection: {
                  workspaceId
                },
                status: "open"
              });
            }

            if (workspaceId === "workspace_review") {
              checkouts.push({
                fulfillmentAutomationStatus: "failed",
                fulfillmentStatus: "unfulfilled",
                id: "checkout_review",
                publishedCollection: {
                  workspaceId
                },
                status: "completed"
              });
            }
          }

          return checkouts;
        }
      },
      opsAlertStateRepository: {
        async listActiveByWorkspaceId(workspaceId: string) {
          if (workspaceId !== "workspace_blocked") {
            return [];
          }

          return [
            {
              acknowledgedAt: null,
              code: "queue_backlog",
              firstObservedAt: new Date("2026-04-11T00:00:00.000Z"),
              id: "alert_1",
              lastObservedAt: new Date("2026-04-12T00:00:00.000Z"),
              message: "Queue backlog is elevated.",
              severity: "critical" as const,
              title: "Queue backlog"
            }
          ];
        },
        async listActiveByWorkspaceIds(workspaceIds: string[]) {
          return workspaceIds.includes("workspace_blocked")
            ? [
                {
                  id: "alert_1",
                  severity: "critical" as const,
                  workspaceId: "workspace_blocked"
                }
              ]
            : [];
        }
      },
      opsReconciliationIssueRepository: {
        async listOpenByWorkspaceId(workspaceId: string) {
          if (workspaceId !== "workspace_blocked") {
            return [];
          }

          return [
            {
              firstDetectedAt: new Date("2026-04-11T00:00:00.000Z"),
              id: "issue_1",
              kind: "published_public_asset_missing" as const,
              lastDetectedAt: new Date("2026-04-12T00:00:00.000Z"),
              message: "A published asset is missing.",
              severity: "warning" as const,
              status: "open" as const,
              title: "Published asset missing"
            }
          ];
        },
        async listOpenByWorkspaceIds(workspaceIds: string[]) {
          return workspaceIds.includes("workspace_blocked")
            ? [
                {
                  id: "issue_1",
                  workspaceId: "workspace_blocked"
                }
              ]
            : [];
        }
      },
      publishedCollectionRepository: {
        async listByWorkspaceIds(workspaceIds: string[]) {
          return workspaceIds.flatMap((workspaceId) => {
            if (workspaceId === "workspace_review") {
              return [
                {
                  id: "publication_review",
                  storefrontStatus: "live" as const,
                  workspaceId
                }
              ];
            }

            return [];
          });
        },
        async listDetailedByWorkspaceId(workspaceId: string) {
          return [
            {
              brandSlug: `brand-${workspaceId}`,
              id: `publication_${workspaceId}`,
              items: [{ id: "item_1" }],
              mints: [{ id: "mint_1" }],
              publishedAt: new Date("2026-04-10T00:00:00.000Z"),
              slug: `release-${workspaceId}`,
              storefrontStatus:
                workspaceId === "workspace_review"
                  ? ("live" as const)
                  : ("ended" as const),
              title: `Release ${workspaceId}`,
              updatedAt: new Date("2026-04-11T00:00:00.000Z")
            }
          ];
        }
      },
      userRepository: {
        async findById(id: string) {
          return {
            avatarUrl: null,
            displayName: "Owner",
            id,
            walletAddress: "0x1111111111111111111111111111111111111111"
          };
        }
      },
      workspaceInvitationRepository: {
        async listByWorkspaceId(input: { workspaceId: string }) {
          return input.workspaceId === "workspace_review"
            ? [
                {
                  createdAt: new Date("2026-04-11T00:00:00.000Z"),
                  expiresAt: new Date("2026-04-25T00:00:00.000Z"),
                  id: "invitation_1",
                  invitedByUser: {
                    walletAddress: "0x1111111111111111111111111111111111111111"
                  },
                  invitedByUserId: "user_owner",
                  lastRemindedAt: new Date("2026-04-11T12:00:00.000Z"),
                  reminderCount: 1,
                  role: "operator" as const,
                  walletAddress: "0x2222222222222222222222222222222222222222"
                }
              ]
            : [];
        }
      },
      workspaceDecommissionNotificationRepository: {
        async listByRequestId(input: { requestId: string }) {
          return input.requestId === "decommission_ready"
            ? [
                {
                  id: "notification_1",
                  kind: "scheduled" as const,
                  requestId: input.requestId,
                  sentAt: new Date("2026-04-12T02:00:00.000Z"),
                  sentByUser: {
                    walletAddress: "0x1111111111111111111111111111111111111111"
                  },
                  sentByUserId: "user_owner"
                }
              ]
            : [];
        },
        async listByRequestIds(requestIds: string[]) {
          return requestIds.includes("decommission_ready")
            ? [
                {
                  id: "notification_1",
                  kind: "scheduled" as const,
                  requestId: "decommission_ready",
                  sentAt: new Date("2026-04-12T02:00:00.000Z"),
                  sentByUser: {
                    walletAddress: "0x1111111111111111111111111111111111111111"
                  },
                  sentByUserId: "user_owner"
                }
              ]
            : [];
        }
      },
      workspaceLifecycleNotificationDeliveryRepository: {
        async listByWorkspaceIds(workspaceIds: string[]) {
          return workspaceIds.flatMap((workspaceId) => {
            if (workspaceId !== "workspace_review") {
              return [];
            }

            return [
              {
                attemptCount: 1,
                createdAt: new Date("2026-04-12T03:00:00.000Z"),
                decommissionNotification: null,
                decommissionNotificationId: null,
                deliveredAt: null,
                deliveryChannel: "webhook" as const,
                deliveryState: "failed" as const,
                eventKind: "invitation_reminder" as const,
                eventOccurredAt: new Date("2026-04-12T02:55:00.000Z"),
                failedAt: new Date("2026-04-12T03:00:00.000Z"),
                failureMessage: "Webhook rejected",
                id: "delivery_1",
                invitation: {
                  id: "invitation_1",
                  walletAddress: "0x2222222222222222222222222222222222222222"
                },
                invitationId: "invitation_1",
                lastAttemptedAt: new Date("2026-04-12T03:00:00.000Z"),
                payloadJson: {},
                providerKey: "primary" as const,
                queuedAt: null,
                updatedAt: new Date("2026-04-12T03:00:00.000Z"),
                workspaceId
              }
            ];
          });
        }
      },
      workspaceDecommissionRequestRepository: {
        async findScheduledByWorkspaceId(input: { workspaceId: string }) {
          return input.workspaceId === "workspace_ready"
            ? {
                canceledAt: null,
                canceledByUser: null,
                canceledByUserId: null,
                createdAt: new Date("2026-04-12T01:00:00.000Z"),
                executeAfter: new Date("2026-04-13T01:00:00.000Z"),
                executedAt: null,
                executedByUser: null,
                executedByUserId: null,
                exportConfirmedAt: new Date("2026-04-12T01:00:00.000Z"),
                id: "decommission_ready",
                reason: "Workspace sunset",
                requestedByUser: {
                  walletAddress: "0x1111111111111111111111111111111111111111"
                },
                requestedByUserId: "user_owner",
                retentionDays: 30,
                status: "scheduled" as const,
                workspaceId: input.workspaceId
              }
            : null;
        },
        async listScheduledByWorkspaceIds(workspaceIds: string[]) {
          return workspaceIds.includes("workspace_ready")
            ? [
                {
                  canceledAt: null,
                  canceledByUser: null,
                  canceledByUserId: null,
                  createdAt: new Date("2026-04-12T01:00:00.000Z"),
                  executeAfter: new Date("2026-04-13T01:00:00.000Z"),
                  executedAt: null,
                  executedByUser: null,
                  executedByUserId: null,
                  exportConfirmedAt: new Date("2026-04-12T01:00:00.000Z"),
                  id: "decommission_ready",
                  reason: "Workspace sunset",
                  requestedByUser: {
                    walletAddress: "0x1111111111111111111111111111111111111111"
                  },
                  requestedByUserId: "user_owner",
                  retentionDays: 30,
                  status: "scheduled" as const,
                  workspaceId: "workspace_ready"
                }
              ]
            : [];
        }
      },
      workspaceMembershipRepository: {
        async listByWorkspaceId() {
          return [
            {
              createdAt: new Date("2026-04-10T00:00:00.000Z"),
              id: "membership_1",
              role: "operator" as const,
              user: {
                avatarUrl: null,
                displayName: "Operator",
                id: "user_operator",
                walletAddress: "0x3333333333333333333333333333333333333333"
              }
            }
          ];
        }
      },
      workspaceRepository: {
        async findByIdForOwner(input: { id: string; ownerUserId: string }) {
          if (input.id === "workspace_missing") {
            return null;
          }

          return {
            decommissionRetentionDaysDefault: 30,
            decommissionRetentionDaysMinimum:
              input.id === "workspace_review" ? 21 : 7,
            id: input.id,
            lifecycleAutomationDecommissionNoticesEnabled:
              input.id !== "workspace_blocked",
            lifecycleAutomationEnabled: input.id !== "workspace_blocked",
            lifecycleAutomationInvitationRemindersEnabled: true,
            lifecycleSlaAutomationMaxAgeMinutes:
              input.id === "workspace_ready" ? 120 : 180,
            lifecycleSlaEnabled: input.id !== "workspace_blocked",
            lifecycleSlaWebhookFailureThreshold:
              input.id === "workspace_review" ? 1 : 3,
            lifecycleWebhookDeliverDecommissionNotifications: true,
            lifecycleWebhookDeliverInvitationReminders:
              input.id !== "workspace_blocked",
            lifecycleWebhookEnabled: input.id !== "workspace_blocked",
            name: `Workspace ${input.id}`,
            ownerUserId: input.ownerUserId,
            requireDecommissionReason: input.id === "workspace_review",
            slug: `slug-${input.id.replaceAll("_", "-")}`,
            status: "active" as const
          };
        },
        async listByIds(workspaceIds: string[]) {
          return workspaceIds.map((workspaceId) => ({
            decommissionRetentionDaysDefault:
              workspaceId === "workspace_ready" ? 45 : 30,
            decommissionRetentionDaysMinimum:
              workspaceId === "workspace_review" ? 21 : 7,
            id: workspaceId,
            lifecycleAutomationDecommissionNoticesEnabled:
              workspaceId !== "workspace_blocked",
            lifecycleAutomationEnabled: workspaceId !== "workspace_blocked",
            lifecycleAutomationInvitationRemindersEnabled: true,
            lifecycleSlaAutomationMaxAgeMinutes:
              workspaceId === "workspace_ready" ? 120 : 180,
            lifecycleSlaEnabled: workspaceId !== "workspace_blocked",
            lifecycleSlaWebhookFailureThreshold:
              workspaceId === "workspace_review" ? 1 : 3,
            lifecycleWebhookDeliverDecommissionNotifications: true,
            lifecycleWebhookDeliverInvitationReminders:
              workspaceId !== "workspace_blocked",
            lifecycleWebhookEnabled: workspaceId !== "workspace_blocked",
            name: `Workspace ${workspaceId}`,
            ownerUserId: "user_owner",
            requireDecommissionReason: workspaceId === "workspace_review",
            slug: `slug-${workspaceId.replaceAll("_", "-")}`,
            status: "active" as const
          }));
        }
      },
      workspaceRoleEscalationRequestRepository: {
        async countPendingByWorkspaceId(workspaceId: string) {
          return workspaceId === "workspace_review" ? 1 : 0;
        },
        async listByWorkspaceId(input: {
          limit?: number;
          workspaceId: string;
        }) {
          return input.workspaceId === "workspace_review"
            ? [
                {
                  createdAt: new Date("2026-04-11T00:00:00.000Z"),
                  id: "request_1",
                  justification: "Need handoff",
                  requestedByUser: {
                    walletAddress: "0x3333333333333333333333333333333333333333"
                  },
                  requestedByUserId: "user_operator",
                  requestedRole: "owner" as const,
                  resolvedAt: null,
                  resolvedByUser: null,
                  resolvedByUserId: null,
                  status: "pending" as const,
                  targetUser: {
                    walletAddress: "0x3333333333333333333333333333333333333333"
                  },
                  targetUserId: "user_operator"
                }
              ]
            : [];
        }
      }
    }
  });

  return {
    service
  };
}

describe("createWorkspaceOffboardingService", () => {
  it("classifies accessible workspaces by archive readiness", async () => {
    const harness = createWorkspaceOffboardingHarness();

    const result =
      await harness.service.getAccessibleWorkspaceOffboardingOverview({
        currentWorkspaceId: "workspace_review",
        workspaces: [
          {
            id: "workspace_blocked",
            name: "Blocked Workspace",
            ownerUserId: "user_owner",
            ownerWalletAddress: "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "blocked-workspace",
            status: "active"
          },
          {
            id: "workspace_review",
            name: "Review Workspace",
            ownerUserId: "user_owner",
            ownerWalletAddress: "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "review-workspace",
            status: "active"
          },
          {
            id: "workspace_ready",
            name: "Ready Workspace",
            ownerUserId: "user_owner",
            ownerWalletAddress: "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "ready-workspace",
            status: "archived"
          }
        ]
      });

    expect(result.overview.summary).toEqual({
      blockedWorkspaceCount: 1,
      decommissionNoticeDueWorkspaceCount: 1,
      reasonRequiredWorkspaceCount: 1,
      readyWorkspaceCount: 1,
      reviewRequiredWorkspaceCount: 1,
      scheduledDecommissionCount: 1,
      totalWorkspaceCount: 3
    });
    expect(
      result.overview.workspaces.find(
        (workspace) => workspace.workspace.id === "workspace_blocked"
      )?.summary.readiness
    ).toBe("blocked");
    expect(
      result.overview.workspaces.find(
        (workspace) => workspace.workspace.id === "workspace_review"
      )?.summary.cautionCodes
    ).toEqual([
      "live_publications",
      "pending_invitations",
      "pending_role_escalations",
      "unfulfilled_checkouts"
    ]);
    expect(
      result.overview.workspaces.find(
        (workspace) => workspace.workspace.id === "workspace_ready"
      )
    ).toMatchObject({
      decommission: {
        id: "decommission_ready",
        retentionDays: 30,
        status: "scheduled"
      },
      decommissionWorkflow: {
        nextDueKind: "upcoming",
        notificationCount: 1
      },
      retentionPolicy: {
        defaultDecommissionRetentionDays: 45,
        minimumDecommissionRetentionDays: 7,
        requireDecommissionReason: false
      },
      lifecycleAutomationPolicy: {
        automateDecommissionNotices: true,
        automateInvitationReminders: true,
        enabled: true
      },
      lifecycleSlaPolicy: {
        automationMaxAgeMinutes: 120,
        enabled: true,
        webhookFailureThreshold: 3
      },
      lifecycleSlaSummary: {
        failedWebhookCount: 0,
        status: "healthy"
      },
      summary: {
        readiness: "ready"
      }
    });
  });

  it("exports an owned workspace and emits archive summary csv", async () => {
    const harness = createWorkspaceOffboardingHarness();
    const result = await harness.service.exportOwnedWorkspace({
      ownerUserId: "user_owner",
      workspaceId: "workspace_review"
    });
    const csv = harness.service.exportOwnedWorkspaceCsv({
      exportData: result,
      format: "csv"
    });

    expect(result.export.workspace.slug).toBe("slug-workspace-review");
    expect(result.export.offboarding.readiness).toBe("review_required");
    expect(result.export.brands).toHaveLength(1);
    expect(result.export.members).toHaveLength(2);
    expect(result.export.publications).toHaveLength(1);
    expect(result.export.checkouts).toHaveLength(1);
    expect(result.export.decommission).toBeNull();
    expect(result.export.decommissionNotifications).toEqual([]);
    expect(result.export.decommissionWorkflow).toEqual({
      latestNotification: null,
      nextDueKind: null,
      notificationCount: 0
    });
    expect(result.export.retentionPolicy).toEqual({
      defaultDecommissionRetentionDays: 30,
      minimumDecommissionRetentionDays: 21,
      requireDecommissionReason: true
    });
    expect(result.export.lifecycleAutomationPolicy).toEqual({
      automateDecommissionNotices: true,
      automateInvitationReminders: true,
      enabled: true
    });
    expect(result.export.lifecycleSlaPolicy).toEqual({
      automationMaxAgeMinutes: 180,
      enabled: true,
      webhookFailureThreshold: 1
    });
    expect(csv).toContain("workspace_slug");
    expect(csv).toContain("lifecycle_automation_enabled");
    expect(csv).toContain("lifecycle_sla_status");
    expect(csv).toContain("retention_default_days");
    expect(csv).toContain("decommission_notification_count");
    expect(csv).toContain("slug-workspace-review");
  });

  it("rejects exports for missing owned workspaces", async () => {
    const harness = createWorkspaceOffboardingHarness();

    await expect(
      harness.service.exportOwnedWorkspace({
        ownerUserId: "user_owner",
        workspaceId: "workspace_missing"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "WORKSPACE_NOT_FOUND",
        "The requested workspace was not found.",
        404
      )
    );
  });
});
