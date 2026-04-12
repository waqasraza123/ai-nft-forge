import type { OpsAlertSchedulePolicy } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertSchedulePolicyRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsAlertSchedulePolicy"
>;

export function createOpsAlertSchedulePolicyRepository(
  database: OpsAlertSchedulePolicyRepositoryDatabase
) {
  return {
    deleteByOwnerUserId(input: { ownerUserId: string }) {
      return database.opsAlertSchedulePolicy.deleteMany({
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    },

    deleteByWorkspaceId(input: { workspaceId: string }) {
      return database.opsAlertSchedulePolicy.deleteMany({
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertSchedulePolicy | null> {
      return database.opsAlertSchedulePolicy.findFirst({
        where: {
          ownerUserId
        }
      });
    },

    findByWorkspaceId(
      workspaceId: string
    ): Promise<OpsAlertSchedulePolicy | null> {
      return database.opsAlertSchedulePolicy.findFirst({
        where: {
          workspaceId
        }
      });
    },

    upsert(input: {
      activeDaysMask: number;
      endMinuteOfDay: number;
      ownerUserId: string;
      startMinuteOfDay: number;
      timezone: string;
      workspaceId: string;
    }): Promise<OpsAlertSchedulePolicy> {
      return database.opsAlertSchedulePolicy.upsert({
        create: {
          activeDaysMask: input.activeDaysMask,
          endMinuteOfDay: input.endMinuteOfDay,
          ownerUserId: input.ownerUserId,
          startMinuteOfDay: input.startMinuteOfDay,
          timezone: input.timezone,
          workspaceId: input.workspaceId
        },
        update: {
          activeDaysMask: input.activeDaysMask,
          endMinuteOfDay: input.endMinuteOfDay,
          startMinuteOfDay: input.startMinuteOfDay,
          timezone: input.timezone
        },
        where: {
          workspaceId: input.workspaceId
        }
      });
    }
  };
}

export type OpsAlertSchedulePolicyRepository = ReturnType<
  typeof createOpsAlertSchedulePolicyRepository
>;
