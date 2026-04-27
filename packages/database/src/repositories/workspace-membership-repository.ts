import type {
  Prisma,
  WorkspaceMembership,
  WorkspaceMembershipRole
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceMembershipRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceMembership"
>;

type CreateWorkspaceMembershipInput = {
  role?: WorkspaceMembershipRole;
  userId: string;
  workspaceId: string;
};

type WorkspaceMembershipWithUser = WorkspaceMembership & {
  user: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  };
};

type WorkspaceMembershipWithWorkspace = WorkspaceMembership & {
  workspace: {
    id: string;
    name: string;
    ownerUser: {
      walletAddress: string;
    };
    ownerUserId: string;
    slug: string;
    status: "active" | "archived" | "suspended";
  };
};

const userSelect = {
  avatarUrl: true,
  displayName: true,
  id: true,
  walletAddress: true
} satisfies Prisma.UserSelect;

const workspaceSelect = {
  id: true,
  name: true,
  ownerUser: {
    select: {
      walletAddress: true
    }
  },
  ownerUserId: true,
  slug: true,
  status: true
} satisfies Prisma.WorkspaceSelect;

export function createWorkspaceMembershipRepository(
  database: WorkspaceMembershipRepositoryDatabase
) {
  return {
    create(
      input: CreateWorkspaceMembershipInput
    ): Promise<WorkspaceMembership> {
      return database.workspaceMembership.create({
        data: {
          role: input.role ?? "operator",
          userId: input.userId,
          workspaceId: input.workspaceId
        }
      });
    },

    deleteByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<{ count: number }> {
      return database.workspaceMembership.deleteMany({
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    deleteByWorkspaceAndUserId(input: {
      userId: string;
      workspaceId: string;
    }): Promise<{ count: number }> {
      return database.workspaceMembership.deleteMany({
        where: {
          userId: input.userId,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdWithUserAndWorkspace(input: { id: string }): Promise<
      | (WorkspaceMembership & {
          user: {
            avatarUrl: string | null;
            displayName: string | null;
            id: string;
            walletAddress: string;
          };
          workspace: {
            id: string;
            ownerUserId: string;
          };
        })
      | null
    > {
      return database.workspaceMembership.findUnique({
        include: {
          user: {
            select: userSelect
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

    findByWorkspaceAndUserId(input: {
      userId: string;
      workspaceId: string;
    }): Promise<WorkspaceMembership | null> {
      return database.workspaceMembership.findUnique({
        where: {
          workspaceId_userId: {
            userId: input.userId,
            workspaceId: input.workspaceId
          }
        }
      });
    },

    updateRoleByIdForWorkspace(input: {
      id: string;
      role: WorkspaceMembershipRole;
      workspaceId: string;
    }): Promise<{ count: number }> {
      return database.workspaceMembership.updateMany({
        data: {
          role: input.role
        },
        where: {
          id: input.id,
          workspaceId: input.workspaceId
        }
      });
    },

    findFirstByUserId(
      userId: string
    ): Promise<WorkspaceMembershipWithWorkspace | null> {
      return database.workspaceMembership.findFirst({
        include: {
          workspace: {
            select: workspaceSelect
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
          userId
        }
      });
    },

    listByUserId(userId: string): Promise<WorkspaceMembershipWithWorkspace[]> {
      return database.workspaceMembership.findMany({
        include: {
          workspace: {
            select: workspaceSelect
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
          userId
        }
      });
    },

    listByWorkspaceId(
      workspaceId: string
    ): Promise<WorkspaceMembershipWithUser[]> {
      return database.workspaceMembership.findMany({
        include: {
          user: {
            select: userSelect
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
          workspaceId
        }
      });
    }
  };
}

export type WorkspaceMembershipRepository = ReturnType<
  typeof createWorkspaceMembershipRepository
>;
