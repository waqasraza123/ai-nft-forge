import { describe, expect, it } from "vitest";

import { createWorkspaceDirectoryService } from "./directory-service";

describe("createWorkspaceDirectoryService", () => {
  it("builds accessible workspace summaries with counts and recent activity", async () => {
    const service = createWorkspaceDirectoryService({
      auditLogRepository: {
        async listByEntity(input: {
          entityId: string;
          entityType: string;
          limit?: number;
        }) {
          if (input.entityId === "workspace_1") {
            return [
              {
                createdAt: new Date("2026-04-12T03:15:00.000Z"),
                id: "audit_1"
              }
            ];
          }

          return [];
        }
      },
      brandRepository: {
        async listByWorkspaceId(workspaceId: string) {
          return workspaceId === "workspace_1"
            ? [{ id: "brand_1" }, { id: "brand_2" }]
            : [{ id: "brand_3" }];
        }
      },
      workspaceInvitationRepository: {
        async listByWorkspaceId(input: { workspaceId: string }) {
          return input.workspaceId === "workspace_1"
            ? [
                {
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  id: "invitation_expiring"
                },
                {
                  expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  id: "invitation_expired"
                }
              ]
            : [];
        }
      },
      workspaceMembershipRepository: {
        async listByWorkspaceId(workspaceId: string) {
          return workspaceId === "workspace_1"
            ? [{ id: "membership_1" }, { id: "membership_2" }]
            : [];
        }
      },
      workspaceRoleEscalationRequestRepository: {
        async countPendingByWorkspaceId(workspaceId: string) {
          return workspaceId === "workspace_1" ? 1 : 0;
        }
      }
    });

    const result = await service.listAccessibleWorkspaceDirectory({
      currentWorkspaceId: "workspace_2",
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

    expect(result.workspaces).toEqual([
      {
        brandCount: 2,
        current: false,
        expiredInvitationCount: 1,
        expiringInvitationCount: 1,
        lastActivityAt: "2026-04-12T03:15:00.000Z",
        memberCount: 3,
        pendingInvitationCount: 1,
        pendingRoleEscalationCount: 1,
        workspace: {
          id: "workspace_1",
          name: "North Studio",
          ownerUserId: "user_1",
          ownerWalletAddress: "0x1111111111111111111111111111111111111111",
          role: "owner",
          slug: "north-studio",
          status: "active"
        }
      },
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
          id: "workspace_2",
          name: "South Studio",
          ownerUserId: "user_2",
          ownerWalletAddress: "0x2222222222222222222222222222222222222222",
          role: "operator",
          slug: "south-studio",
          status: "active"
        }
      }
    ]);
  });
});
