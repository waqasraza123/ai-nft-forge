import type {
  OpsReconciliationRun,
  OpsReconciliationRunStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsReconciliationRunRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsReconciliationRun"
>;

export function createOpsReconciliationRunRepository(
  database: OpsReconciliationRunRepositoryDatabase
) {
  return {
    create(input: {
      completedAt: Date;
      criticalIssueCount: number;
      issueCount: number;
      message?: string | null;
      ownerUserId: string;
      startedAt: Date;
      status: OpsReconciliationRunStatus;
      warningIssueCount: number;
      workspaceId: string;
    }): Promise<OpsReconciliationRun> {
      return database.opsReconciliationRun.create({
        data: input
      });
    },

    findLatestByOwnerUserId(ownerUserId: string): Promise<OpsReconciliationRun | null> {
      return database.opsReconciliationRun.findFirst({
        orderBy: [
          {
            completedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    findLatestByWorkspaceId(workspaceId: string): Promise<OpsReconciliationRun | null> {
      return database.opsReconciliationRun.findFirst({
        orderBy: [
          {
            completedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId
        }
      });
    },

    listRecentByOwnerUserId(input: { limit: number; ownerUserId: string }) {
      return database.opsReconciliationRun.findMany({
        orderBy: [
          {
            completedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit,
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    },

    listRecentByWorkspaceId(input: { limit: number; workspaceId: string }) {
      return database.opsReconciliationRun.findMany({
        orderBy: [
          {
            completedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit,
        where: {
          workspaceId: input.workspaceId
        }
      });
    }
  };
}

export type OpsReconciliationRunRepository = ReturnType<
  typeof createOpsReconciliationRunRepository
>;
