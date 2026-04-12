import type {
  OpsAlertDelivery,
  OpsAlertDeliveryChannel,
  OpsAlertDeliveryState,
  OpsAlertSeverity
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertDeliveryRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsAlertDelivery"
>;

export function createOpsAlertDeliveryRepository(
  database: OpsAlertDeliveryRepositoryDatabase
) {
  return {
    create(input: {
      alertStateId: string;
      captureId: string;
      code: string;
      deliveredAt: Date | null;
      deliveryChannel: OpsAlertDeliveryChannel;
      deliveryState: OpsAlertDeliveryState;
      failureMessage: string | null;
      message: string;
      ownerUserId: string;
      severity: OpsAlertSeverity;
      title: string;
      workspaceId: string;
    }): Promise<OpsAlertDelivery> {
      return database.opsAlertDelivery.create({
        data: {
          alertStateId: input.alertStateId,
          captureId: input.captureId,
          code: input.code,
          deliveredAt: input.deliveredAt,
          deliveryChannel: input.deliveryChannel,
          deliveryState: input.deliveryState,
          failureMessage: input.failureMessage,
          message: input.message,
          ownerUserId: input.ownerUserId,
          severity: input.severity,
          title: input.title,
          workspaceId: input.workspaceId
        }
      });
    },

    listRecentForOwnerUserId(input: { limit: number; ownerUserId: string }) {
      return database.opsAlertDelivery.findMany({
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
          ownerUserId: input.ownerUserId
        }
      });
    },

    listRecentForWorkspaceId(input: { limit: number; workspaceId: string }) {
      return database.opsAlertDelivery.findMany({
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
    }
  };
}

export type OpsAlertDeliveryRepository = ReturnType<
  typeof createOpsAlertDeliveryRepository
>;
