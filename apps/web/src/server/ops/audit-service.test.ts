import { describe, expect, it } from "vitest";

import { createOpsAuditService } from "./audit-service";
import { OpsServiceError } from "./error";

function createOpsAuditHarness() {
  const auditLogs = [
    {
      action: "workspace_owner_transferred",
      actorId: "user_owner",
      actorType: "user",
      createdAt: new Date("2026-04-11T10:03:00.000Z"),
      entityId: "workspace_1",
      entityType: "workspace",
      id: "audit_3",
      metadataJson: {
        actorWalletAddress: "0x1111111111111111111111111111111111111111",
        requestId: "request_1",
        role: "owner",
        targetUserId: "user_operator",
        targetWalletAddress: "0x2222222222222222222222222222222222222222"
      }
    },
    {
      action: "workspace_role_escalation_requested",
      actorId: "user_operator",
      actorType: "user",
      createdAt: new Date("2026-04-11T10:02:00.000Z"),
      entityId: "workspace_1",
      entityType: "workspace",
      id: "audit_2",
      metadataJson: {
        actorWalletAddress: "0x2222222222222222222222222222222222222222",
        requestId: "request_1",
        role: "owner",
        targetUserId: "user_operator",
        targetWalletAddress: "0x2222222222222222222222222222222222222222"
      }
    },
    {
      action: "workspace_member_added",
      actorId: "user_owner",
      actorType: "user",
      createdAt: new Date("2026-04-11T10:01:00.000Z"),
      entityId: "workspace_1",
      entityType: "workspace",
      id: "audit_1",
      metadataJson: {
        actorWalletAddress: "0x1111111111111111111111111111111111111111",
        membershipId: "membership_1",
        role: "operator",
        targetUserId: "user_operator",
        targetWalletAddress: "0x2222222222222222222222222222222222222222"
      }
    },
    {
      action: "unrelated_action",
      actorId: "user_owner",
      actorType: "user",
      createdAt: new Date("2026-04-11T09:59:00.000Z"),
      entityId: "workspace_1",
      entityType: "workspace",
      id: "audit_0",
      metadataJson: {}
    }
  ];

  const service = createOpsAuditService({
    repositories: {
      auditLogRepository: {
        async listByEntity(input: {
          actions?: string[];
          cursor?: string;
          entityId: string;
          entityType: string;
          limit?: number;
        }) {
          const matchingLogs = auditLogs.filter(
            (auditLog) =>
              auditLog.entityId === input.entityId &&
              auditLog.entityType === input.entityType &&
              (input.actions && input.actions.length > 0
                ? input.actions.includes(auditLog.action)
                : true)
          );
          const cursorIndex = input.cursor
            ? matchingLogs.findIndex((auditLog) => auditLog.id === input.cursor)
            : -1;

          return matchingLogs.slice(
            cursorIndex >= 0 ? cursorIndex + 1 : 0,
            (cursorIndex >= 0 ? cursorIndex + 1 : 0) + (input.limit ?? 50)
          );
        }
      }
    }
  });

  return {
    auditLogs,
    service
  };
}

describe("createOpsAuditService", () => {
  it("returns paginated workspace audit activity", async () => {
    const harness = createOpsAuditHarness();

    const result = await harness.service.getWorkspaceAudit({
      limit: 2,
      workspaceId: "workspace_1"
    });

    expect(result.audit.entries).toHaveLength(2);
    expect(result.audit.entries[0]).toMatchObject({
      action: "workspace_owner_transferred",
      category: "ownership_transfer"
    });
    expect(result.audit.entries[1]).toMatchObject({
      action: "workspace_role_escalation_requested",
      category: "ownership_transfer"
    });
    expect(result.audit.nextCursor).toBe("audit_2");
  });

  it("filters workspace audit activity by category", async () => {
    const harness = createOpsAuditHarness();

    const result = await harness.service.getWorkspaceAudit({
      category: "workspace_access",
      workspaceId: "workspace_1"
    });

    expect(result.audit.entries).toHaveLength(1);
    expect(result.audit.entries[0]?.action).toBe("workspace_member_added");
    expect(result.audit.entries[0]?.category).toBe("workspace_access");
  });

  it("exports workspace audit activity as csv", async () => {
    const harness = createOpsAuditHarness();

    const result = await harness.service.exportWorkspaceAuditCsv({
      category: "ownership_transfer",
      workspaceId: "workspace_1"
    });

    expect(result.filename).toBe("workspace-audit-workspace_1.csv");
    expect(result.csv).toContain("created_at,category,action");
    expect(result.csv).toContain("workspace_owner_transferred");
    expect(result.csv).toContain("workspace_role_escalation_requested");
  });

  it("rejects csv export when no audit entries match the filter", async () => {
    const harness = createOpsAuditHarness();

    await expect(
      harness.service.exportWorkspaceAuditCsv({
        action: "workspace_invitation_created",
        workspaceId: "workspace_1"
      })
    ).rejects.toEqual(
      new OpsServiceError(
        "INVALID_REQUEST",
        "No workspace audit events matched the requested export filter.",
        404
      )
    );
  });
});
