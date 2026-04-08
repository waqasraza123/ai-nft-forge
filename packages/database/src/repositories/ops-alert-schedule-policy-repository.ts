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

    findByOwnerUserId(
      ownerUserId: string
    ): Promise<OpsAlertSchedulePolicy | null> {
      return database.opsAlertSchedulePolicy.findUnique({
        where: {
          ownerUserId
        }
      });
    },

    upsert(input: {
      activeDaysMask: number;
      endMinuteOfDay: number;
      ownerUserId: string;
      startMinuteOfDay: number;
      timezone: string;
    }): Promise<OpsAlertSchedulePolicy> {
      return database.opsAlertSchedulePolicy.upsert({
        create: {
          activeDaysMask: input.activeDaysMask,
          endMinuteOfDay: input.endMinuteOfDay,
          ownerUserId: input.ownerUserId,
          startMinuteOfDay: input.startMinuteOfDay,
          timezone: input.timezone
        },
        update: {
          activeDaysMask: input.activeDaysMask,
          endMinuteOfDay: input.endMinuteOfDay,
          startMinuteOfDay: input.startMinuteOfDay,
          timezone: input.timezone
        },
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    }
  };
}

export type OpsAlertSchedulePolicyRepository = ReturnType<
  typeof createOpsAlertSchedulePolicyRepository
>;
