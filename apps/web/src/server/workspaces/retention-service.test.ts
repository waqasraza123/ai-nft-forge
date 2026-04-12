import { describe, expect, it } from "vitest";

import { createWorkspaceRetentionService } from "./retention-service";

function createWorkspaceRetentionHarness() {
  const canceledWorkspaceIds: string[] = [];

  const service = createWorkspaceRetentionService({
    decommissionService: {
      async cancelWorkspaceDecommission(input) {
        if (input.workspaceId === "workspace_not_scheduled") {
          const { StudioSettingsServiceError } = await import(
            "../studio-settings/error"
          );

          throw new StudioSettingsServiceError(
            "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
            "No pending decommission schedule exists for this workspace.",
            404
          );
        }

        canceledWorkspaceIds.push(input.workspaceId);
      }
    },
    now: () => new Date("2026-04-12T07:00:00.000Z"),
    offboardingService: {
      async getAccessibleWorkspaceOffboardingOverview(input) {
        return {
          overview: {
            generatedAt: "2026-04-12T07:00:00.000Z",
            summary: {
              blockedWorkspaceCount: 1,
              decommissionNoticeDueWorkspaceCount: 1,
              reasonRequiredWorkspaceCount: 1,
              readyWorkspaceCount: 1,
              reviewRequiredWorkspaceCount: 1,
              scheduledDecommissionCount: 1,
              totalWorkspaceCount: input.workspaces.length
            },
            workspaces: input.workspaces.map((workspace) => ({
              current: workspace.id === input.currentWorkspaceId,
              decommission:
                workspace.id === "workspace_ready"
                  ? {
                      canceledAt: null,
                      canceledByUserId: null,
                      canceledByWalletAddress: null,
                      createdAt: "2026-04-12T01:00:00.000Z",
                      executeAfter: "2026-05-12T01:00:00.000Z",
                      executedAt: null,
                      executedByUserId: null,
                      executedByWalletAddress: null,
                      exportConfirmedAt: "2026-04-12T01:00:00.000Z",
                      id: "decommission_1",
                      reason: "Workspace sunset",
                      requestedByUserId: "user_owner",
                      requestedByWalletAddress:
                        "0x1111111111111111111111111111111111111111",
                      retentionDays: 30,
                      status: "scheduled" as const
                    }
                  : null,
              decommissionWorkflow:
                workspace.id === "workspace_ready"
                  ? {
                      latestNotification: {
                        id: "notification_1",
                        kind: "scheduled" as const,
                        sentAt: "2026-04-12T02:00:00.000Z",
                        sentByUserId: "user_owner",
                        sentByWalletAddress:
                          "0x1111111111111111111111111111111111111111"
                      },
                      nextDueKind: "upcoming" as const,
                      notificationCount: 1
                    }
                  : {
                      latestNotification: null,
                      nextDueKind: null,
                      notificationCount: 0
                    },
              directory: {
                brandCount: 1,
                current: workspace.id === input.currentWorkspaceId,
                expiredInvitationCount: 0,
                expiringInvitationCount:
                  workspace.id === "workspace_review" ? 1 : 0,
                lastActivityAt: "2026-04-12T06:00:00.000Z",
                memberCount: 2,
                pendingInvitationCount:
                  workspace.id === "workspace_review" ? 1 : 0,
                pendingRoleEscalationCount: 0,
                workspace
              },
              lifecycleDelivery: {
                deliveredCount: workspace.id === "workspace_ready" ? 1 : 0,
                failedCount: workspace.id === "workspace_review" ? 1 : 0,
                latestDelivery:
                  workspace.id === "workspace_review"
                    ? {
                        attemptCount: 1,
                        createdAt: "2026-04-12T06:05:00.000Z",
                        decommissionNotificationId: null,
                        decommissionNotificationKind: null,
                        deliveredAt: null,
                        deliveryChannel: "webhook" as const,
                        deliveryState: "failed" as const,
                        eventKind: "invitation_reminder" as const,
                        eventOccurredAt: "2026-04-12T06:00:00.000Z",
                        failedAt: "2026-04-12T06:05:00.000Z",
                        failureMessage: "Webhook rejected",
                        id: "delivery_1",
                        invitationId: "invitation_1",
                        invitationWalletAddress:
                          "0x2222222222222222222222222222222222222222",
                        lastAttemptedAt: "2026-04-12T06:05:00.000Z",
                        queuedAt: null,
                        updatedAt: "2026-04-12T06:05:00.000Z"
                      }
                    : null,
                queuedCount: 0,
                skippedCount: workspace.id === "workspace_blocked" ? 1 : 0
              },
              lifecycleDeliveryPolicy: {
                deliverDecommissionNotifications: true,
                deliverInvitationReminders: workspace.id !== "workspace_blocked",
                webhookEnabled: workspace.id !== "workspace_blocked"
              },
              retentionPolicy: {
                defaultDecommissionRetentionDays:
                  workspace.id === "workspace_ready" ? 45 : 30,
                minimumDecommissionRetentionDays:
                  workspace.id === "workspace_review" ? 21 : 7,
                requireDecommissionReason: workspace.id === "workspace_review"
              },
              summary: {
                activeAlertCount: workspace.id === "workspace_blocked" ? 1 : 0,
                blockerCodes:
                  workspace.id === "workspace_blocked"
                    ? (["active_alerts"] as const)
                    : [],
                cautionCodes:
                  workspace.id === "workspace_review"
                    ? (["pending_invitations"] as const)
                    : [],
                livePublicationCount: 0,
                openCheckoutCount: 0,
                openReconciliationIssueCount: 0,
                pendingInvitationCount:
                  workspace.id === "workspace_review" ? 1 : 0,
                pendingRoleEscalationCount: 0,
                readiness:
                  workspace.id === "workspace_blocked"
                    ? ("blocked" as const)
                    : workspace.id === "workspace_review"
                      ? ("review_required" as const)
                      : ("ready" as const),
                unfulfilledCheckoutCount: 0
              },
              workspace
            }))
          }
        };
      }
    }
  });

  return {
    canceledWorkspaceIds,
    service
  };
}

describe("createWorkspaceRetentionService", () => {
  it("builds an accessible retention report and emits csv", async () => {
    const harness = createWorkspaceRetentionHarness();
    const report =
      await harness.service.getAccessibleWorkspaceRetentionReport({
        currentWorkspaceId: "workspace_ready",
        workspaces: [
          {
            id: "workspace_blocked",
            name: "Blocked",
            ownerUserId: "user_owner",
            ownerWalletAddress:
              "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "blocked",
            status: "active"
          },
          {
            id: "workspace_review",
            name: "Review",
            ownerUserId: "user_owner",
            ownerWalletAddress:
              "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "review",
            status: "archived"
          },
          {
            id: "workspace_ready",
            name: "Ready",
            ownerUserId: "user_owner",
            ownerWalletAddress:
              "0x1111111111111111111111111111111111111111",
            role: "owner",
            slug: "ready",
            status: "archived"
          }
        ]
      });
    const csv = harness.service.exportAccessibleWorkspaceRetentionReportCsv({
      format: "csv",
      reportData: report
    });

    expect(report.report.summary.scheduledDecommissionCount).toBe(1);
    expect(report.report.summary.decommissionNoticeDueWorkspaceCount).toBe(1);
    expect(report.report.summary.reasonRequiredWorkspaceCount).toBe(1);
    expect(report.report.workspaces).toHaveLength(3);
    expect(report.report.workspaces[2]?.retentionPolicy).toEqual({
      defaultDecommissionRetentionDays: 45,
      minimumDecommissionRetentionDays: 7,
      requireDecommissionReason: false
    });
    expect(csv).toContain("decommission_status");
    expect(csv).toContain("decommission_next_due_kind");
    expect(csv).toContain("retention_default_days");
    expect(csv).toContain("workspace_ready");
  });

  it("bulk cancels only owned scheduled workspaces and reports outcomes", async () => {
    const harness = createWorkspaceRetentionHarness();

    const result = await harness.service.cancelScheduledWorkspaceDecommissions({
      actorUserId: "user_owner",
      workspaceIds: [
        "workspace_ready",
        "workspace_not_scheduled",
        "workspace_operator_only",
        "workspace_missing"
      ],
      workspaces: [
        {
          id: "workspace_ready",
          name: "Ready",
          ownerUserId: "user_owner",
          ownerWalletAddress:
            "0x1111111111111111111111111111111111111111",
          role: "owner",
          slug: "ready",
          status: "archived"
        },
        {
          id: "workspace_not_scheduled",
          name: "Not Scheduled",
          ownerUserId: "user_owner",
          ownerWalletAddress:
            "0x1111111111111111111111111111111111111111",
          role: "owner",
          slug: "not-scheduled",
          status: "archived"
        },
        {
          id: "workspace_operator_only",
          name: "Operator Only",
          ownerUserId: "user_another_owner",
          ownerWalletAddress:
            "0x2222222222222222222222222222222222222222",
          role: "operator",
          slug: "operator-only",
          status: "archived"
        }
      ]
    });

    expect(result.summary).toEqual({
      canceledCount: 1,
      forbiddenCount: 1,
      notFoundCount: 1,
      notScheduledCount: 1,
      requestedCount: 4
    });
    expect(harness.canceledWorkspaceIds).toEqual(["workspace_ready"]);
  });
});
