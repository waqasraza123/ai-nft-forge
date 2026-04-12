import type {
  WorkspaceLifecycleAutomationRun,
  WorkspaceLifecycleAutomationRunStatus,
  WorkspaceLifecycleAutomationRunTriggerSource
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceLifecycleAutomationRunRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceLifecycleAutomationRun"
>;

export function createWorkspaceLifecycleAutomationRunRepository(
  database: WorkspaceLifecycleAutomationRunRepositoryDatabase
) {
  return {
    create(input: {
      auditLogDeliveryCount?: number;
      completedAt?: Date | null;
      decommissionNoticeCount?: number;
      failedWorkspaceCount?: number;
      failureMessage?: string | null;
      invitationReminderCount?: number;
      startedAt: Date;
      status?: WorkspaceLifecycleAutomationRunStatus;
      triggerSource: WorkspaceLifecycleAutomationRunTriggerSource;
      webhookQueuedCount?: number;
      workspaceCount?: number;
    }): Promise<WorkspaceLifecycleAutomationRun> {
      return database.workspaceLifecycleAutomationRun.create({
        data: {
          auditLogDeliveryCount: input.auditLogDeliveryCount ?? 0,
          completedAt: input.completedAt ?? null,
          decommissionNoticeCount: input.decommissionNoticeCount ?? 0,
          failedWorkspaceCount: input.failedWorkspaceCount ?? 0,
          failureMessage: input.failureMessage ?? null,
          invitationReminderCount: input.invitationReminderCount ?? 0,
          startedAt: input.startedAt,
          status: input.status ?? "running",
          triggerSource: input.triggerSource,
          webhookQueuedCount: input.webhookQueuedCount ?? 0,
          workspaceCount: input.workspaceCount ?? 0
        }
      });
    },

    findLatest(): Promise<WorkspaceLifecycleAutomationRun | null> {
      return database.workspaceLifecycleAutomationRun.findFirst({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ]
      });
    },

    listRecent(input: { limit: number }): Promise<WorkspaceLifecycleAutomationRun[]> {
      return database.workspaceLifecycleAutomationRun.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit
      });
    },

    updateById(input: {
      auditLogDeliveryCount?: number;
      completedAt?: Date | null;
      decommissionNoticeCount?: number;
      failedWorkspaceCount?: number;
      failureMessage?: string | null;
      id: string;
      invitationReminderCount?: number;
      startedAt?: Date;
      status?: WorkspaceLifecycleAutomationRunStatus;
      webhookQueuedCount?: number;
      workspaceCount?: number;
    }): Promise<WorkspaceLifecycleAutomationRun> {
      return database.workspaceLifecycleAutomationRun.update({
        data: {
          ...(input.auditLogDeliveryCount !== undefined
            ? {
                auditLogDeliveryCount: input.auditLogDeliveryCount
              }
            : {}),
          ...(input.completedAt !== undefined
            ? {
                completedAt: input.completedAt
              }
            : {}),
          ...(input.decommissionNoticeCount !== undefined
            ? {
                decommissionNoticeCount: input.decommissionNoticeCount
              }
            : {}),
          ...(input.failedWorkspaceCount !== undefined
            ? {
                failedWorkspaceCount: input.failedWorkspaceCount
              }
            : {}),
          ...(input.failureMessage !== undefined
            ? {
                failureMessage: input.failureMessage
              }
            : {}),
          ...(input.invitationReminderCount !== undefined
            ? {
                invitationReminderCount: input.invitationReminderCount
              }
            : {}),
          ...(input.startedAt !== undefined
            ? {
                startedAt: input.startedAt
              }
            : {}),
          ...(input.status !== undefined
            ? {
                status: input.status
              }
            : {}),
          ...(input.webhookQueuedCount !== undefined
            ? {
                webhookQueuedCount: input.webhookQueuedCount
              }
            : {}),
          ...(input.workspaceCount !== undefined
            ? {
                workspaceCount: input.workspaceCount
              }
            : {})
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type WorkspaceLifecycleAutomationRunRepository = ReturnType<
  typeof createWorkspaceLifecycleAutomationRunRepository
>;
