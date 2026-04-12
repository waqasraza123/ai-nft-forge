import type { OpsAlertRoutingPolicy, OpsAlertSeverity } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertRoutingPolicyRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsAlertRoutingPolicy"
>;

export function createOpsAlertRoutingPolicyRepository(
  database: OpsAlertRoutingPolicyRepositoryDatabase
) {
  return {
    deleteByOwnerUserId(input: { ownerUserId: string }) {
      return database.opsAlertRoutingPolicy.deleteMany({
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    },

    deleteByWorkspaceId(input: { workspaceId: string }) {
      return database.opsAlertRoutingPolicy.deleteMany({
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertRoutingPolicy | null> {
      return database.opsAlertRoutingPolicy.findFirst({
        where: {
          ownerUserId
        }
      });
    },

    findByWorkspaceId(
      workspaceId: string
    ): Promise<OpsAlertRoutingPolicy | null> {
      return database.opsAlertRoutingPolicy.findFirst({
        where: {
          workspaceId
        }
      });
    },

    upsert(input: {
      ownerUserId: string;
      webhookEnabled: boolean;
      webhookMinimumSeverity: OpsAlertSeverity;
      workspaceId: string;
    }): Promise<OpsAlertRoutingPolicy> {
      return database.opsAlertRoutingPolicy.upsert({
        create: {
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId,
          webhookEnabled: input.webhookEnabled,
          webhookMinimumSeverity: input.webhookMinimumSeverity
        },
        update: {
          webhookEnabled: input.webhookEnabled,
          webhookMinimumSeverity: input.webhookMinimumSeverity
        },
        where: {
          workspaceId: input.workspaceId
        }
      });
    }
  };
}

export type OpsAlertRoutingPolicyRepository = ReturnType<
  typeof createOpsAlertRoutingPolicyRepository
>;
