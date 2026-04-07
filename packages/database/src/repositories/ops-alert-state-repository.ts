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
    createActive(input: {
      code: string;
      message: string;
      observedAt: Date;
      ownerUserId: string;
      severity: OpsAlertSeverity;
      title: string;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.create({
        data: {
          code: input.code,
          firstObservedAt: input.observedAt,
          lastObservedAt: input.observedAt,
          message: input.message,
          ownerUserId: input.ownerUserId,
          severity: input.severity,
          status: "active",
          title: input.title
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

    markResolved(input: {
      id: string;
      observedAt: Date;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.update({
        data: {
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
      deliveredAt: Date;
      id: string;
    }): Promise<OpsAlertState> {
      return database.opsAlertState.update({
        data: {
          lastDeliveredAt: input.deliveredAt
        },
        where: {
          id: input.id
        }
      });
    },

    update(input: {
      id: string;
      lastDeliveredAt?: Date | null;
      message: string;
      observedAt: Date;
      severity: OpsAlertSeverity;
      status: OpsAlertStateStatus;
      title: string;
    }): Promise<OpsAlertState> {
      const data = {
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
