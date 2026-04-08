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

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertRoutingPolicy | null> {
      return database.opsAlertRoutingPolicy.findUnique({
        where: {
          ownerUserId
        }
      });
    },

    upsert(input: {
      ownerUserId: string;
      webhookEnabled: boolean;
      webhookMinimumSeverity: OpsAlertSeverity;
    }): Promise<OpsAlertRoutingPolicy> {
      return database.opsAlertRoutingPolicy.upsert({
        create: {
          ownerUserId: input.ownerUserId,
          webhookEnabled: input.webhookEnabled,
          webhookMinimumSeverity: input.webhookMinimumSeverity
        },
        update: {
          webhookEnabled: input.webhookEnabled,
          webhookMinimumSeverity: input.webhookMinimumSeverity
        },
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    }
  };
}

export type OpsAlertRoutingPolicyRepository = ReturnType<
  typeof createOpsAlertRoutingPolicyRepository
>;
