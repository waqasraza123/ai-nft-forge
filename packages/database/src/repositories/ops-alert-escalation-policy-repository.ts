import type { OpsAlertEscalationPolicy } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertEscalationPolicyRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsAlertEscalationPolicy"
>;

export function createOpsAlertEscalationPolicyRepository(
  database: OpsAlertEscalationPolicyRepositoryDatabase
) {
  return {
    deleteByOwnerUserId(input: { ownerUserId: string }) {
      return database.opsAlertEscalationPolicy.deleteMany({
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertEscalationPolicy | null> {
      return database.opsAlertEscalationPolicy.findUnique({
        where: {
          ownerUserId
        }
      });
    },

    upsert(input: {
      firstReminderDelayMinutes: number;
      ownerUserId: string;
      repeatReminderIntervalMinutes: number;
    }): Promise<OpsAlertEscalationPolicy> {
      return database.opsAlertEscalationPolicy.upsert({
        create: {
          firstReminderDelayMinutes: input.firstReminderDelayMinutes,
          ownerUserId: input.ownerUserId,
          repeatReminderIntervalMinutes: input.repeatReminderIntervalMinutes
        },
        update: {
          firstReminderDelayMinutes: input.firstReminderDelayMinutes,
          repeatReminderIntervalMinutes: input.repeatReminderIntervalMinutes
        },
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    }
  };
}

export type OpsAlertEscalationPolicyRepository = ReturnType<
  typeof createOpsAlertEscalationPolicyRepository
>;
