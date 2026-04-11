import type {
  Prisma,
  WorkspaceMembershipRole,
  WorkspaceRoleEscalationRequest,
  WorkspaceRoleEscalationRequestStatus
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceRoleEscalationRequestRepositoryDatabase = Pick<
  DatabaseExecutor,
  "workspaceRoleEscalationRequest"
>;

type CreateWorkspaceRoleEscalationRequestInput = {
  justification?: string | null;
  requestedByUserId: string;
  requestedRole?: WorkspaceMembershipRole;
  targetUserId: string;
  workspaceId: string;
};

type WorkspaceRoleEscalationRequestWithRelations =
  WorkspaceRoleEscalationRequest & {
    requestedByUser: {
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    };
    resolvedByUser: {
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    } | null;
    targetUser: {
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

const userSelect = {
  avatarUrl: true,
  displayName: true,
  id: true,
  walletAddress: true
} satisfies Prisma.UserSelect;

export function createWorkspaceRoleEscalationRequestRepository(
  database: WorkspaceRoleEscalationRequestRepositoryDatabase
) {
  return {
    create(
      input: CreateWorkspaceRoleEscalationRequestInput
    ): Promise<WorkspaceRoleEscalationRequest> {
      return database.workspaceRoleEscalationRequest.create({
        data: {
          justification: input.justification ?? null,
          requestedByUserId: input.requestedByUserId,
          requestedRole: input.requestedRole ?? "owner",
          targetUserId: input.targetUserId,
          workspaceId: input.workspaceId
        }
      });
    },

    findByIdWithRelations(input: {
      id: string;
    }): Promise<WorkspaceRoleEscalationRequestWithRelations | null> {
      return database.workspaceRoleEscalationRequest.findUnique({
        include: {
          requestedByUser: {
            select: userSelect
          },
          resolvedByUser: {
            select: userSelect
          },
          targetUser: {
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

    findPendingByWorkspaceAndRequestedRole(input: {
      requestedRole: WorkspaceMembershipRole;
      workspaceId: string;
    }): Promise<WorkspaceRoleEscalationRequestWithRelations | null> {
      return database.workspaceRoleEscalationRequest.findFirst({
        include: {
          requestedByUser: {
            select: userSelect
          },
          resolvedByUser: {
            select: userSelect
          },
          targetUser: {
            select: userSelect
          },
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
          requestedRole: input.requestedRole,
          status: "pending",
          workspaceId: input.workspaceId
        }
      });
    },

    listByWorkspaceId(input: {
      limit?: number;
      workspaceId: string;
    }): Promise<WorkspaceRoleEscalationRequestWithRelations[]> {
      return database.workspaceRoleEscalationRequest.findMany({
        include: {
          requestedByUser: {
            select: userSelect
          },
          resolvedByUser: {
            select: userSelect
          },
          targetUser: {
            select: userSelect
          },
          workspace: {
            select: {
              id: true,
              ownerUserId: true
            }
          }
        },
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit ?? 25,
        where: {
          workspaceId: input.workspaceId
        }
      });
    },

    resolveById(input: {
      id: string;
      resolvedAt: Date;
      resolvedByUserId: string;
      status: Exclude<WorkspaceRoleEscalationRequestStatus, "pending">;
    }): Promise<WorkspaceRoleEscalationRequest> {
      return database.workspaceRoleEscalationRequest.update({
        data: {
          resolvedAt: input.resolvedAt,
          resolvedByUserId: input.resolvedByUserId,
          status: input.status
        },
        where: {
          id: input.id
        }
      });
    }
  };
}

export type WorkspaceRoleEscalationRequestRepository = ReturnType<
  typeof createWorkspaceRoleEscalationRequestRepository
>;
