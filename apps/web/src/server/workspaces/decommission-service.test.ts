import { describe, expect, it } from "vitest";

import { StudioSettingsServiceError } from "../studio-settings/error";

import { createWorkspaceDecommissionService } from "./decommission-service";

function createWorkspaceDecommissionHarness(input?: {
  now?: Date;
  offboardingReadiness?: "blocked" | "ready" | "review_required";
  scheduledExecuteAfter?: Date | null;
  workspaceStatus?: "active" | "archived" | "suspended";
}) {
  const now = input?.now ?? new Date("2026-04-12T05:00:00.000Z");
  let workspaceDeleted = false;
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
            input.scheduledExecuteAfter ??
            new Date("2026-04-20T05:00:00.000Z"),
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
          id: "workspace_1",
          name: "Workspace One",
          ownerUserId: "user_owner",
          slug: "workspace-one",
          status: input?.workspaceStatus ?? "archived"
        };
      }
    }
  };

  const service = createWorkspaceDecommissionService({
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
});
