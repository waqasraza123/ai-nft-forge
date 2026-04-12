import type {
  Prisma,
  WorkspaceDecommissionNotification,
  WorkspaceDecommissionNotificationKind
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceDecommissionNotificationRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceDecommissionNotification"
>;

type WorkspaceDecommissionNotificationWithSender =
  WorkspaceDecommissionNotification & {
    sentByUser: {
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

export function createWorkspaceDecommissionNotificationRepository(
  database: WorkspaceDecommissionNotificationRepositoryDatabase
) {
  return {
    create(input: {
      kind: WorkspaceDecommissionNotificationKind;
      requestId: string;
      sentAt: Date;
      sentByUserId: string;
    }): Promise<WorkspaceDecommissionNotification> {
      return database.workspaceDecommissionNotification.create({
        data: {
          kind: input.kind,
          requestId: input.requestId,
          sentAt: input.sentAt,
          sentByUserId: input.sentByUserId
        }
      });
    },

    async listByRequestIds(
      requestIds: string[]
    ): Promise<WorkspaceDecommissionNotificationWithSender[]> {
      if (requestIds.length === 0) {
        return [];
      }

      return database.workspaceDecommissionNotification.findMany({
        include: {
          sentByUser: {
            select: userSelect
          }
        },
        orderBy: [
          {
            sentAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          requestId: {
            in: requestIds
          }
        }
      });
    },

    listByRequestId(input: {
      requestId: string;
    }): Promise<WorkspaceDecommissionNotificationWithSender[]> {
      return database.workspaceDecommissionNotification.findMany({
        include: {
          sentByUser: {
            select: userSelect
          }
        },
        orderBy: [
          {
            sentAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          requestId: input.requestId
        }
      });
    }
  };
}

export type WorkspaceDecommissionNotificationRepository = ReturnType<
  typeof createWorkspaceDecommissionNotificationRepository
>;
