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

    deleteByWorkspaceId(input: { workspaceId: string }) {
      return database.opsAlertEscalationPolicy.deleteMany({
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertEscalationPolicy | null> {
      return database.opsAlertEscalationPolicy.findFirst({
        where: {
          ownerUserId
        }
      });
    },

    findByWorkspaceId(
      workspaceId: string
    ): Promise<OpsAlertEscalationPolicy | null> {
      return database.opsAlertEscalationPolicy.findFirst({
        where: {
          workspaceId
        }
      });
    },

    upsert(input: {
      firstReminderDelayMinutes: number;
      ownerUserId: string;
      repeatReminderIntervalMinutes: number;
      workspaceId: string;
    }): Promise<OpsAlertEscalationPolicy> {
      return database.opsAlertEscalationPolicy.upsert({
        create: {
          firstReminderDelayMinutes: input.firstReminderDelayMinutes,
          ownerUserId: input.ownerUserId,
          repeatReminderIntervalMinutes: input.repeatReminderIntervalMinutes,
          workspaceId: input.workspaceId
        },
        update: {
          firstReminderDelayMinutes: input.firstReminderDelayMinutes,
          repeatReminderIntervalMinutes: input.repeatReminderIntervalMinutes
        },
        where: {
          workspaceId: input.workspaceId
        }
      });
    }
  };
}

export type OpsAlertEscalationPolicyRepository = ReturnType<
  typeof createOpsAlertEscalationPolicyRepository
>;
