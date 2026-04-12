import type {
  OpsAlertSeverity,
  OpsAlertState,
  OpsAlertStateStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertStateRepositoryDatabase = Pick<DatabaseExecutor, "opsAlertState">;

export function createOpsAlertStateRepository(
  database: OpsAlertStateRepositoryDatabase
) {
  return {
    acknowledge(input: {
      acknowledgedAt: Date;
      acknowledgedByUserId: string;
      id: string;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.update({
        data: {
          acknowledgedAt: input.acknowledgedAt,
          acknowledgedByUserId: input.acknowledgedByUserId
        },
        where: {
          id: input.id
        }
      });
    },

    createActive(input: {
      code: string;
      message: string;
      observedAt: Date;
      ownerUserId: string;
      severity: OpsAlertSeverity;
      title: string;
      workspaceId: string;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.create({
        data: {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          code: input.code,
          firstWebhookDeliveredAt: null,
          firstObservedAt: input.observedAt,
          lastAuditLogDeliveredAt: null,
          lastObservedAt: input.observedAt,
          message: input.message,
          lastWebhookDeliveredAt: null,
          ownerUserId: input.ownerUserId,
          severity: input.severity,
          status: "active",
          title: input.title,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<OpsAlertState | null> {
      return database.opsAlertState.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<OpsAlertState | null> {
      return database.opsAlertState.findFirst({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    listActiveByOwnerUserId(ownerUserId: string): Promise<OpsAlertState[]> {
      return database.opsAlertState.findMany({
        orderBy: [
          {
            lastObservedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId,
          status: "active"
        }
      });
    },

    listActiveByWorkspaceId(workspaceId: string): Promise<OpsAlertState[]> {
      return database.opsAlertState.findMany({
        orderBy: [
          {
            lastObservedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          status: "active",
          workspaceId
        }
      });
    },

    listByOwnerUserIdAndCodes(input: {
      codes: string[];
      ownerUserId: string;
    }): Promise<OpsAlertState[]> {
      if (input.codes.length === 0) {
        return Promise.resolve([]);
      }

      return database.opsAlertState.findMany({
        where: {
          code: {
            in: input.codes
          },
          ownerUserId: input.ownerUserId
        }
      });
    },

    listByWorkspaceIdAndCodes(input: {
      codes: string[];
      workspaceId: string;
    }): Promise<OpsAlertState[]> {
      if (input.codes.length === 0) {
        return Promise.resolve([]);
      }

      return database.opsAlertState.findMany({
        where: {
          code: {
            in: input.codes
          },
          workspaceId: input.workspaceId
        }
      });
    },

    markResolved(input: {
      id: string;
      observedAt: Date;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.update({
        data: {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          lastObservedAt: input.observedAt,
          resolvedAt: input.observedAt,
          status: "resolved"
        },
        where: {
          id: input.id
        }
      });
    },

    setLastDeliveredAt(input: {
      deliveryChannel?: "audit_log" | "webhook";
      deliveredAt: Date;
      firstWebhookDeliveredAt?: Date;
      id: string;
    }): Promise<OpsAlertState> {
      const data = {
        lastDeliveredAt: input.deliveredAt,
        ...(input.deliveryChannel === "audit_log"
          ? {
              lastAuditLogDeliveredAt: input.deliveredAt
            }
          : {}),
        ...(input.deliveryChannel === "webhook"
          ? {
              ...(input.firstWebhookDeliveredAt === undefined
                ? {}
                : {
                    firstWebhookDeliveredAt: input.firstWebhookDeliveredAt
                  }),
              lastWebhookDeliveredAt: input.deliveredAt
            }
          : {})
      };

      return database.opsAlertState.update({
        data,
        where: {
          id: input.id
        }
      });
    },

    update(input: {
      acknowledgedAt?: Date | null;
      acknowledgedByUserId?: string | null;
      id: string;
      lastDeliveredAt?: Date | null;
      message: string;
      observedAt: Date;
      severity: OpsAlertSeverity;
      status: OpsAlertStateStatus;
      title: string;
    }): Promise<OpsAlertState> {
      const data = {
        ...(input.acknowledgedAt === undefined
          ? {}
          : {
              acknowledgedAt: input.acknowledgedAt
            }),
        ...(input.acknowledgedByUserId === undefined
          ? {}
          : {
              acknowledgedByUserId: input.acknowledgedByUserId
            }),
        lastObservedAt: input.observedAt,
        message: input.message,
        resolvedAt: input.status === "resolved" ? input.observedAt : null,
        severity: input.severity,
        status: input.status,
        title: input.title,
        ...(input.lastDeliveredAt === undefined
          ? {}
          : {
              lastDeliveredAt: input.lastDeliveredAt
            })
      };

      return database.opsAlertState.update({
        data,
        where: {
          id: input.id
        }
      });
    }
  };
}

export type OpsAlertStateRepository = ReturnType<
  typeof createOpsAlertStateRepository
>;
