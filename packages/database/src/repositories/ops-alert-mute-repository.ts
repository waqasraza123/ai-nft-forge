import type { OpsAlertMute } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsAlertMuteRepositoryDatabase = Pick<DatabaseExecutor, "opsAlertMute">;

export function createOpsAlertMuteRepository(
  database: OpsAlertMuteRepositoryDatabase
) {
  return {
    deleteByOwnerUserIdAndCode(input: { code: string; ownerUserId: string }) {
      return database.opsAlertMute.deleteMany({
        where: {
          code: input.code,
          ownerUserId: input.ownerUserId
        }
      });
    },

    deleteByWorkspaceIdAndCode(input: { code: string; workspaceId: string }) {
      return database.opsAlertMute.deleteMany({
        where: {
          code: input.code,
          workspaceId: input.workspaceId
        }
      });
    },

    findActiveByOwnerUserIdAndCode(input: {
      code: string;
      observedAt: Date;
      ownerUserId: string;
    }): Promise<OpsAlertMute | null> {
      return database.opsAlertMute.findFirst({
        where: {
          code: input.code,
          mutedUntil: {
            gt: input.observedAt
          },
          ownerUserId: input.ownerUserId
        }
      });
    },

    findActiveByWorkspaceIdAndCode(input: {
      code: string;
      observedAt: Date;
      workspaceId: string;
    }): Promise<OpsAlertMute | null> {
      return database.opsAlertMute.findFirst({
        where: {
          code: input.code,
          mutedUntil: {
            gt: input.observedAt
          },
          workspaceId: input.workspaceId
        }
      });
    },

    listActiveByOwnerUserId(input: {
      observedAt: Date;
      ownerUserId: string;
    }): Promise<OpsAlertMute[]> {
      return database.opsAlertMute.findMany({
        orderBy: [
          {
            mutedUntil: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          mutedUntil: {
            gt: input.observedAt
          },
          ownerUserId: input.ownerUserId
        }
      });
    },

    listActiveByWorkspaceId(input: {
      observedAt: Date;
      workspaceId: string;
    }): Promise<OpsAlertMute[]> {
      return database.opsAlertMute.findMany({
        orderBy: [
          {
            mutedUntil: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          mutedUntil: {
            gt: input.observedAt
          },
          workspaceId: input.workspaceId
        }
      });
    },

    listActiveByOwnerUserIdAndCodes(input: {
      codes: string[];
      observedAt: Date;
      ownerUserId: string;
    }): Promise<OpsAlertMute[]> {
      if (input.codes.length === 0) {
        return Promise.resolve([]);
      }

      return database.opsAlertMute.findMany({
        where: {
          code: {
            in: input.codes
          },
          mutedUntil: {
            gt: input.observedAt
          },
          ownerUserId: input.ownerUserId
        }
      });
    },

    listActiveByWorkspaceIdAndCodes(input: {
      codes: string[];
      observedAt: Date;
      workspaceId: string;
    }): Promise<OpsAlertMute[]> {
      if (input.codes.length === 0) {
        return Promise.resolve([]);
      }

      return database.opsAlertMute.findMany({
        where: {
          code: {
            in: input.codes
          },
          mutedUntil: {
            gt: input.observedAt
          },
          workspaceId: input.workspaceId
        }
      });
    },

    upsert(input: {
      code: string;
      mutedUntil: Date;
      ownerUserId: string;
      workspaceId: string;
    }): Promise<OpsAlertMute> {
      return database.opsAlertMute.upsert({
        create: {
          code: input.code,
          mutedUntil: input.mutedUntil,
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        },
        update: {
          mutedUntil: input.mutedUntil
        },
        where: {
          workspaceId_code: {
            code: input.code,
            workspaceId: input.workspaceId
          }
        }
      });
    }
  };
}

export type OpsAlertMuteRepository = ReturnType<
  typeof createOpsAlertMuteRepository
>;
