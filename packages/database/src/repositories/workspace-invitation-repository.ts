import type {
  Prisma,
  WorkspaceInvitation,
  WorkspaceMembershipRole
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceInvitationRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceInvitation"
>;

type CreateWorkspaceInvitationInput = {
  expiresAt: Date;
  invitedByUserId: string;
  role?: WorkspaceMembershipRole;
  walletAddress: string;
  workspaceId: string;
};

type WorkspaceInvitationWithInviter = WorkspaceInvitation & {
  invitedByUser: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  };
};

type WorkspaceInvitationWithWorkspace = WorkspaceInvitation & {
  workspace: {
    id: string;
    ownerUserId: string;
  };
};

type WorkspaceInvitationWithWorkspaceAndInviter = WorkspaceInvitation & {
  invitedByUser: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  };
  workspace: {
    id: string;
    ownerUserId: string;
  };
};

const invitedByUserSelect = {
  avatarUrl: true,
  displayName: true,
  id: true,
  walletAddress: true
} satisfies Prisma.UserSelect;

export function createWorkspaceInvitationRepository(
  database: WorkspaceInvitationRepositoryDatabase
) {
  return {
    create(
      input: CreateWorkspaceInvitationInput
    ): Promise<WorkspaceInvitation> {
      return database.workspaceInvitation.create({
        data: {
          expiresAt: input.expiresAt,
          invitedByUserId: input.invitedByUserId,
          role: input.role ?? "operator",
          walletAddress: input.walletAddress,
          workspaceId: input.workspaceId
        }
      });
    },

    deleteByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<{ count: number }> {
      return database.workspaceInvitation.deleteMany({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    deleteManyByWalletAddress(input: {
      ids?: string[];
      walletAddress: string;
    }): Promise<{ count: number }> {
      return database.workspaceInvitation.deleteMany({
        where: {
          walletAddress: input.walletAddress,
          ...(input.ids
            ? {
                id: {
                  in: input.ids
                }
              }
            : {})
        }
      });
    },

    findActiveByWorkspaceAndWalletAddress(input: {
      now: Date;
      walletAddress: string;
      workspaceId: string;
    }): Promise<WorkspaceInvitation | null> {
      return database.workspaceInvitation.findFirst({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          expiresAt: {
            gt: input.now
          },
          walletAddress: input.walletAddress,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdWithWorkspace(input: {
      id: string;
    }): Promise<WorkspaceInvitationWithWorkspaceAndInviter | null> {
      return database.workspaceInvitation.findUnique({
        include: {
          invitedByUser: {
            select: invitedByUserSelect
          },
          workspace: {
            select: {
              id: true,
              ownerUserId: true
            }
          }
        },
        where: {
          id: input.id
        }
      });
    },

    listActiveByWalletAddress(input: {
      now: Date;
      walletAddress: string;
    }): Promise<WorkspaceInvitationWithWorkspace[]> {
      return database.workspaceInvitation.findMany({
        include: {
          workspace: {
            select: {
              id: true,
              ownerUserId: true
            }
          }
        },
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          expiresAt: {
            gt: input.now
          },
          walletAddress: input.walletAddress
        }
      });
    },

    listActiveByWorkspaceId(input: {
      now: Date;
      workspaceId: string;
    }): Promise<WorkspaceInvitationWithInviter[]> {
      return database.workspaceInvitation.findMany({
        include: {
          invitedByUser: {
            select: invitedByUserSelect
          }
        },
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          expiresAt: {
            gt: input.now
          },
          workspaceId: input.workspaceId
        }
      });
    },

    listByWorkspaceId(input: {
      workspaceId: string;
    }): Promise<WorkspaceInvitationWithInviter[]> {
      return database.workspaceInvitation.findMany({
        include: {
          invitedByUser: {
            select: invitedByUserSelect
          }
        },
        orderBy: [
          {
            expiresAt: "asc"
          },
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    listReminderReadyByWorkspaceIds(input: {
      now: Date;
      reminderReadyBefore: Date;
      workspaceIds: string[];
    }) {
      if (input.workspaceIds.length === 0) {
        return Promise.resolve([] as WorkspaceInvitation[]);
      }

      return database.workspaceInvitation.findMany({
        orderBy: [
          {
            expiresAt: "asc"
          },
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          expiresAt: {
            gt: input.now
          },
          workspaceId: {
            in: input.workspaceIds
          },
          OR: [
            {
              lastRemindedAt: null
            },
            {
              lastRemindedAt: {
                lte: input.reminderReadyBefore
              }
            }
          ]
        }
      });
    },

    touchReminderById(input: {
      id: string;
      lastRemindedAt: Date;
    }): Promise<WorkspaceInvitation> {
      return database.workspaceInvitation.update({
        data: {
          lastRemindedAt: input.lastRemindedAt,
          reminderCount: {
            increment: 1
          }
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type WorkspaceInvitationRepository = ReturnType<
  typeof createWorkspaceInvitationRepository
>;
