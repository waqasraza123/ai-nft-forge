import type {
  Prisma,
  WorkspaceLifecycleNotificationDelivery,
  WorkspaceLifecycleNotificationDeliveryChannel,
  WorkspaceLifecycleNotificationDeliveryKind,
  WorkspaceLifecycleNotificationDeliveryState
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceLifecycleNotificationDeliveryRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceLifecycleNotificationDelivery"
>;

type WorkspaceLifecycleNotificationDeliveryWithRelations =
  WorkspaceLifecycleNotificationDelivery & {
    decommissionNotification: {
      id: string;
      kind: "ready" | "scheduled" | "upcoming";
    } | null;
    invitation: {
      id: string;
      walletAddress: string;
    } | null;
  };

const deliveryRelations = {
  decommissionNotification: {
    select: {
      id: true,
      kind: true
    }
  },
  invitation: {
    select: {
      id: true,
      walletAddress: true
    }
  }
} satisfies Prisma.WorkspaceLifecycleNotificationDeliveryInclude;

export function createWorkspaceLifecycleNotificationDeliveryRepository(
  database: WorkspaceLifecycleNotificationDeliveryRepositoryDatabase
) {
  return {
    create(input: {
      decommissionNotificationId?: string | null;
      deliveredAt?: Date | null;
      deliveryChannel?: WorkspaceLifecycleNotificationDeliveryChannel;
      deliveryState: WorkspaceLifecycleNotificationDeliveryState;
      eventKind: WorkspaceLifecycleNotificationDeliveryKind;
      eventOccurredAt: Date;
      failureMessage?: string | null;
      invitationId?: string | null;
      ownerUserId: string;
      payloadJson: Prisma.InputJsonValue;
      queuedAt?: Date | null;
      workspaceId: string;
    }): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations> {
      return database.workspaceLifecycleNotificationDelivery.create({
        data: {
          ...(input.decommissionNotificationId
            ? {
                decommissionNotificationId: input.decommissionNotificationId
              }
            : {}),
          deliveredAt: input.deliveredAt ?? null,
          deliveryChannel: input.deliveryChannel ?? "webhook",
          deliveryState: input.deliveryState,
          eventKind: input.eventKind,
          eventOccurredAt: input.eventOccurredAt,
          failureMessage: input.failureMessage ?? null,
          ...(input.invitationId ? { invitationId: input.invitationId } : {}),
          ownerUserId: input.ownerUserId,
          payloadJson: input.payloadJson,
          queuedAt: input.queuedAt ?? null,
          workspaceId: input.workspaceId
        },
        include: deliveryRelations
      });
    },

    findById(id: string): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations | null> {
      return database.workspaceLifecycleNotificationDelivery.findUnique({
        include: deliveryRelations,
        where: {
          id
        }
      });
    },

    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations | null> {
      return database.workspaceLifecycleNotificationDelivery.findFirst({
        include: deliveryRelations,
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    listByWorkspaceIds(
      workspaceIds: string[]
    ): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations[]> {
      if (workspaceIds.length === 0) {
        return Promise.resolve([]);
      }

      return database.workspaceLifecycleNotificationDelivery.findMany({
        include: deliveryRelations,
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId: {
            in: workspaceIds
          }
        }
      });
    },

    listRecentByWorkspaceId(input: {
      limit: number;
      workspaceId: string;
    }): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations[]> {
      return database.workspaceLifecycleNotificationDelivery.findMany({
        include: deliveryRelations,
        orderBy: [
          {
            createdAt: "desc"
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
    },

    updateById(input: {
      attemptCount?: number;
      deliveredAt?: Date | null;
      deliveryState?: WorkspaceLifecycleNotificationDeliveryState;
      failedAt?: Date | null;
      failureMessage?: string | null;
      id: string;
      lastAttemptedAt?: Date | null;
      payloadJson?: Prisma.InputJsonValue;
      queuedAt?: Date | null;
    }): Promise<WorkspaceLifecycleNotificationDeliveryWithRelations> {
      return database.workspaceLifecycleNotificationDelivery.update({
        data: {
          ...(input.attemptCount !== undefined
            ? {
                attemptCount: input.attemptCount
              }
            : {}),
          ...(input.deliveredAt !== undefined
            ? {
                deliveredAt: input.deliveredAt
              }
            : {}),
          ...(input.deliveryState !== undefined
            ? {
                deliveryState: input.deliveryState
              }
            : {}),
          ...(input.failedAt !== undefined
            ? {
                failedAt: input.failedAt
              }
            : {}),
          ...(input.failureMessage !== undefined
            ? {
                failureMessage: input.failureMessage
              }
            : {}),
          ...(input.lastAttemptedAt !== undefined
            ? {
                lastAttemptedAt: input.lastAttemptedAt
              }
            : {}),
          ...(input.payloadJson !== undefined
            ? {
                payloadJson: input.payloadJson
              }
            : {}),
          ...(input.queuedAt !== undefined
            ? {
                queuedAt: input.queuedAt
              }
            : {})
        },
        include: deliveryRelations,
        where: {
          id: input.id
        }
      });
    }
  };
}

export type WorkspaceLifecycleNotificationDeliveryRepository = ReturnType<
  typeof createWorkspaceLifecycleNotificationDeliveryRepository
>;
