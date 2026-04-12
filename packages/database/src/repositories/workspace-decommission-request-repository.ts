import type {
  Prisma,
  WorkspaceDecommissionRequest,
  WorkspaceDecommissionRequestStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceDecommissionRequestRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceDecommissionRequest"
>;

type CreateWorkspaceDecommissionRequestInput = {
  executeAfter: Date;
  exportConfirmedAt: Date;
  reason?: string | null;
  requestedByUserId: string;
  retentionDays: number;
  workspaceId: string;
};

type WorkspaceDecommissionRequestWithRelations = WorkspaceDecommissionRequest & {
  canceledByUser: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  } | null;
  executedByUser: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  } | null;
  requestedByUser: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  };
};

const userSelect = {
  avatarUrl: true,
  displayName: true,
  id: true,
  walletAddress: true
} satisfies Prisma.UserSelect;

export function createWorkspaceDecommissionRequestRepository(
  database: WorkspaceDecommissionRequestRepositoryDatabase
) {
  return {
    create(
      input: CreateWorkspaceDecommissionRequestInput
    ): Promise<WorkspaceDecommissionRequest> {
      return database.workspaceDecommissionRequest.create({
        data: {
          executeAfter: input.executeAfter,
          exportConfirmedAt: input.exportConfirmedAt,
          reason: input.reason ?? null,
          requestedByUserId: input.requestedByUserId,
          retentionDays: input.retentionDays,
          workspaceId: input.workspaceId
        }
      });
    },

    findScheduledByWorkspaceId(input: {
      workspaceId: string;
    }): Promise<WorkspaceDecommissionRequestWithRelations | null> {
      return database.workspaceDecommissionRequest.findFirst({
        include: {
          canceledByUser: {
            select: userSelect
          },
          executedByUser: {
            select: userSelect
          },
          requestedByUser: {
            select: userSelect
          }
        },
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          status: "scheduled",
          workspaceId: input.workspaceId
        }
      });
    },

    listScheduledByWorkspaceIds(workspaceIds: string[]) {
      if (workspaceIds.length === 0) {
        return Promise.resolve([] as WorkspaceDecommissionRequestWithRelations[]);
      }

      return database.workspaceDecommissionRequest.findMany({
        include: {
          canceledByUser: {
            select: userSelect
          },
          executedByUser: {
            select: userSelect
          },
          requestedByUser: {
            select: userSelect
          }
        },
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          status: "scheduled",
          workspaceId: {
            in: workspaceIds
          }
        }
      });
    },

    cancelById(input: {
      canceledAt: Date;
      canceledByUserId: string;
      id: string;
    }): Promise<WorkspaceDecommissionRequest> {
      return database.workspaceDecommissionRequest.update({
        data: {
          canceledAt: input.canceledAt,
          canceledByUserId: input.canceledByUserId,
          status: "canceled"
        },
        where: {
          id: input.id
        }
      });
    },

    markExecutedById(input: {
      executedAt: Date;
      executedByUserId: string;
      id: string;
    }): Promise<WorkspaceDecommissionRequest> {
      return database.workspaceDecommissionRequest.update({
        data: {
          executedAt: input.executedAt,
          executedByUserId: input.executedByUserId,
          status: "executed"
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type WorkspaceDecommissionRequestRepository = ReturnType<
  typeof createWorkspaceDecommissionRequestRepository
>;
