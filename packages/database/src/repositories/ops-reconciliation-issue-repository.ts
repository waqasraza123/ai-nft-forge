import type {
  OpsReconciliationIssue,
  OpsReconciliationIssueKind,
  OpsReconciliationIssueSeverity,
  Prisma
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsReconciliationIssueRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsReconciliationIssue"
>;

export function createOpsReconciliationIssueRepository(
  database: OpsReconciliationIssueRepositoryDatabase
) {
  return {
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue.findFirst({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    listOpenByOwnerUserId(ownerUserId: string) {
      return database.opsReconciliationIssue.findMany({
        orderBy: [
          {
            severity: "desc"
          },
          {
            lastDetectedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          ownerUserId,
          status: "open"
        }
      });
    },

    listOpenByWorkspaceId(workspaceId: string) {
      return database.opsReconciliationIssue.findMany({
        orderBy: [
          {
            severity: "desc"
          },
          {
            lastDetectedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          status: "open",
          workspaceId
        }
      });
    },

    listRecentByOwnerUserId(input: { limit: number; ownerUserId: string }) {
      return database.opsReconciliationIssue.findMany({
        orderBy: [
          {
            lastDetectedAt: "desc"
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

    listRecentByWorkspaceId(input: { limit: number; workspaceId: string }) {
      return database.opsReconciliationIssue.findMany({
        orderBy: [
          {
            lastDetectedAt: "desc"
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
    },

    upsertObserved(input: {
      detailJson: Prisma.InputJsonValue;
      fingerprint: string;
      kind: OpsReconciliationIssueKind;
      lastDetectedAt: Date;
      latestRunId: string;
      message: string;
      ownerUserId: string;
      severity: OpsReconciliationIssueSeverity;
      title: string;
      workspaceId: string;
    }): Promise<OpsReconciliationIssue> {
      return database.opsReconciliationIssue
        .findUnique({
          where: {
            workspaceId_fingerprint: {
              fingerprint: input.fingerprint,
              workspaceId: input.workspaceId
            }
          }
        })
        .then((issue) => {
          if (!issue) {
            return database.opsReconciliationIssue.create({
              data: {
                detailJson: input.detailJson,
                fingerprint: input.fingerprint,
                firstDetectedAt: input.lastDetectedAt,
                kind: input.kind,
                lastDetectedAt: input.lastDetectedAt,
                latestRunId: input.latestRunId,
                message: input.message,
                ownerUserId: input.ownerUserId,
                severity: input.severity,
                status: "open",
                title: input.title,
                workspaceId: input.workspaceId
              }
            });
          }

          return database.opsReconciliationIssue.update({
            data: {
              detailJson: input.detailJson,
              ignoredAt: issue.status === "ignored" ? issue.ignoredAt : null,
              kind: input.kind,
              lastDetectedAt: input.lastDetectedAt,
              latestRunId: input.latestRunId,
              message: input.message,
              repairedAt: issue.status === "ignored" ? issue.repairedAt : null,
              repairMessage:
                issue.status === "ignored" ? issue.repairMessage : null,
              severity: input.severity,
              status: issue.status === "ignored" ? "ignored" : "open",
              title: input.title
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    markIgnored(input: {
      id: string;
      ignoredAt: Date;
      ownerUserId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((issue) => {
          if (!issue) {
            return null;
          }

          return database.opsReconciliationIssue.update({
            data: {
              ignoredAt: input.ignoredAt,
              status: "ignored"
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    markIgnoredForWorkspace(input: {
      id: string;
      ignoredAt: Date;
      workspaceId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((issue) => {
          if (!issue) {
            return null;
          }

          return database.opsReconciliationIssue.update({
            data: {
              ignoredAt: input.ignoredAt,
              status: "ignored"
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    markRepaired(input: {
      id: string;
      ownerUserId: string;
      repairedAt: Date;
      repairMessage: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((issue) => {
          if (!issue) {
            return null;
          }

          return database.opsReconciliationIssue.update({
            data: {
              repairMessage: input.repairMessage,
              repairedAt: input.repairedAt,
              status: "repaired"
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    markRepairedForWorkspace(input: {
      id: string;
      repairedAt: Date;
      repairMessage: string;
      workspaceId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue
        .findFirst({
          where: {
            id: input.id,
            workspaceId: input.workspaceId
          }
        })
        .then((issue) => {
          if (!issue) {
            return null;
          }

          return database.opsReconciliationIssue.update({
            data: {
              repairMessage: input.repairMessage,
              repairedAt: input.repairedAt,
              status: "repaired"
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    markOpen(input: {
      id: string;
      ownerUserId: string;
    }): Promise<OpsReconciliationIssue | null> {
      return database.opsReconciliationIssue
        .findFirst({
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then((issue) => {
          if (!issue) {
            return null;
          }

          return database.opsReconciliationIssue.update({
            data: {
              ignoredAt: null,
              repairedAt: null,
              repairMessage: null,
              status: "open"
            },
            where: {
              id: issue.id
            }
          });
        });
    },

    countOpenByOwnerUserIdAndSeverity(input: {
      ownerUserId: string;
      severity?: OpsReconciliationIssueSeverity;
    }): Promise<number> {
      return database.opsReconciliationIssue.count({
        where: {
          ownerUserId: input.ownerUserId,
          ...(input.severity ? { severity: input.severity } : {}),
          status: "open"
        }
      });
    },

    countOpenByWorkspaceIdAndSeverity(input: {
      severity?: OpsReconciliationIssueSeverity;
      workspaceId: string;
    }): Promise<number> {
      return database.opsReconciliationIssue.count({
        where: {
          ...(input.severity ? { severity: input.severity } : {}),
          status: "open",
          workspaceId: input.workspaceId
        }
      });
    }
  };
}

export type OpsReconciliationIssueRepository = ReturnType<
  typeof createOpsReconciliationIssueRepository
>;
