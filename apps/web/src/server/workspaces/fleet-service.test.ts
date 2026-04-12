import { describe, expect, it } from "vitest";

import { createWorkspaceFleetService } from "./fleet-service";

describe("createWorkspaceFleetService", () => {
  it("builds fleet workspace rollups and alert queue summaries", async () => {
    const service = createWorkspaceFleetService({
      now: () => new Date("2026-04-12T06:00:00.000Z"),
      repositories: {
        commerceCheckoutSessionRepository: {
          async listDetailedByWorkspaceIds(workspaceIds: string[]) {
            expect(workspaceIds).toEqual(["workspace_1", "workspace_2"]);

            return [
              {
                fulfillmentAutomationStatus: "failed" as const,
                fulfillmentStatus: "unfulfilled" as const,
                id: "checkout_1",
                publishedCollection: {
                  workspaceId: "workspace_1"
                },
                status: "completed" as const
              },
              {
                fulfillmentAutomationStatus: "idle" as const,
                fulfillmentStatus: "fulfilled" as const,
                id: "checkout_2",
                publishedCollection: {
                  workspaceId: "workspace_1"
                },
                status: "open" as const
              }
            ];
          }
        },
        opsAlertStateRepository: {
          async listActiveByWorkspaceIds() {
            return [
              {
                acknowledgedAt: null,
                code: "backend_not_ready",
                firstObservedAt: new Date("2026-04-12T05:00:00.000Z"),
                id: "alert_1",
                lastObservedAt: new Date("2026-04-12T05:50:00.000Z"),
                message: "Backend is not ready.",
                severity: "critical" as const,
                title: "Backend readiness degraded",
                workspaceId: "workspace_1"
              },
              {
                acknowledgedAt: null,
                code: "queue_backlog",
                firstObservedAt: new Date("2026-04-12T04:00:00.000Z"),
                id: "alert_2",
                lastObservedAt: new Date("2026-04-12T04:50:00.000Z"),
                message: "Queue waiting depth is elevated.",
                severity: "warning" as const,
                title: "Queue backlog",
                workspaceId: "workspace_2"
              }
            ];
          }
        },
        opsReconciliationIssueRepository: {
          async listOpenByWorkspaceIds() {
            return [
              {
                id: "issue_1",
                workspaceId: "workspace_1"
              }
            ];
          }
        },
        publishedCollectionRepository: {
          async listByWorkspaceIds() {
            return [
              {
                id: "publication_1",
                storefrontStatus: "live" as const,
                workspaceId: "workspace_1"
              },
              {
                id: "publication_2",
                storefrontStatus: "upcoming" as const,
                workspaceId: "workspace_2"
              }
            ];
          }
        }
      },
      workspaceDirectoryService: {
        async listAccessibleWorkspaceDirectory() {
          return {
            workspaces: [
              {
                brandCount: 2,
                current: true,
                expiredInvitationCount: 0,
                expiringInvitationCount: 1,
                lastActivityAt: "2026-04-12T05:55:00.000Z",
                memberCount: 3,
                pendingInvitationCount: 1,
                pendingRoleEscalationCount: 0,
                workspace: {
                  id: "workspace_1",
                  name: "North Studio",
                  ownerUserId: "user_1",
                  ownerWalletAddress:
                    "0x1111111111111111111111111111111111111111",
                  role: "owner" as const,
                  slug: "north-studio",
                  status: "active" as const
                }
              },
              {
                brandCount: 1,
                current: false,
                expiredInvitationCount: 0,
                expiringInvitationCount: 0,
                lastActivityAt: "2026-04-12T04:55:00.000Z",
                memberCount: 1,
                pendingInvitationCount: 0,
                pendingRoleEscalationCount: 0,
                workspace: {
                  id: "workspace_2",
                  name: "South Studio",
                  ownerUserId: "user_2",
                  ownerWalletAddress:
                    "0x2222222222222222222222222222222222222222",
                  role: "operator" as const,
                  slug: "south-studio",
                  status: "active" as const
                }
              }
            ]
          };
        }
      }
    });

    const result = await service.getAccessibleWorkspaceFleet({
      currentWorkspaceId: "workspace_1",
      workspaces: [
        {
          id: "workspace_1",
          name: "North Studio",
          ownerUserId: "user_1",
          ownerWalletAddress: "0x1111111111111111111111111111111111111111",
          role: "owner",
          slug: "north-studio",
          status: "active"
        },
        {
          id: "workspace_2",
          name: "South Studio",
          ownerUserId: "user_2",
          ownerWalletAddress: "0x2222222222222222222222222222222222222222",
          role: "operator",
          slug: "south-studio",
          status: "active"
        }
      ]
    });

    expect(result.fleet.summary).toMatchObject({
      activeAlertCount: 2,
      completedCheckoutCount: 1,
      criticalAlertCount: 1,
      openCheckoutCount: 1,
      openReconciliationIssueCount: 1,
      totalCheckoutCount: 2,
      totalWorkspaceCount: 2,
      unfulfilledCheckoutCount: 1
    });
    expect(result.fleet.workspaces[0]).toMatchObject({
      commerce: {
        automationFailedCheckoutCount: 1,
        completedCheckoutCount: 1,
        openCheckoutCount: 1,
        totalCheckoutCount: 2,
        unfulfilledCheckoutCount: 1
      },
      ops: {
        activeAlertCount: 1,
        criticalAlertCount: 1,
        openReconciliationIssueCount: 1,
        warningAlertCount: 0
      },
      publications: {
        livePublicationCount: 1,
        totalPublicationCount: 1
      }
    });
    expect(result.fleet.alertQueue[0]).toMatchObject({
      alertStateId: "alert_1",
      severity: "critical",
      workspace: {
        id: "workspace_1"
      }
    });
  });

  it("exports a workspace commerce fleet csv", async () => {
    const service = createWorkspaceFleetService({
      now: () => new Date("2026-04-12T06:00:00.000Z"),
      repositories: {
        commerceCheckoutSessionRepository: {
          async listDetailedByWorkspaceIds() {
            return [];
          }
        },
        opsAlertStateRepository: {
          async listActiveByWorkspaceIds() {
            return [];
          }
        },
        opsReconciliationIssueRepository: {
          async listOpenByWorkspaceIds() {
            return [];
          }
        },
        publishedCollectionRepository: {
          async listByWorkspaceIds() {
            return [];
          }
        }
      },
      workspaceDirectoryService: {
        async listAccessibleWorkspaceDirectory() {
          return {
            workspaces: [
              {
                brandCount: 1,
                current: true,
                expiredInvitationCount: 0,
                expiringInvitationCount: 0,
                lastActivityAt: null,
                memberCount: 1,
                pendingInvitationCount: 0,
                pendingRoleEscalationCount: 0,
                workspace: {
                  id: "workspace_1",
                  name: "North Studio",
                  ownerUserId: "user_1",
                  ownerWalletAddress:
                    "0x1111111111111111111111111111111111111111",
                  role: "owner" as const,
                  slug: "north-studio",
                  status: "active" as const
                }
              }
            ]
          };
        }
      }
    });

    const result = await service.exportAccessibleCommerceFleetCsv({
      currentWorkspaceId: "workspace_1",
      workspaces: [
        {
          id: "workspace_1",
          name: "North Studio",
          ownerUserId: "user_1",
          ownerWalletAddress: "0x1111111111111111111111111111111111111111",
          role: "owner",
          slug: "north-studio",
          status: "active"
        }
      ]
    });

    expect(result.filename).toBe("workspace-commerce-fleet.csv");
    expect(result.csv).toContain("workspace_slug,workspace_name");
    expect(result.csv).toContain("north-studio,North Studio");
  });
});
