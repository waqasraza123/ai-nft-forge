import {
  createAuditLogRepository,
  createBrandRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRoleEscalationRequestRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  studioWorkspaceDirectoryResponseSchema,
  type StudioWorkspaceScopeSummary
} from "@ai-nft-forge/shared";

import {
  getWorkspaceInvitationStatus,
  isWorkspaceInvitationPending
} from "../studio/invitation-lifecycle";

type WorkspaceDirectoryRepositorySet = {
  auditLogRepository: {
    listByEntity(input: {
      entityId: string;
      entityType: string;
      limit?: number;
    }): Promise<Array<{ createdAt: Date; id: string }>>;
  };
  brandRepository: {
    listByWorkspaceId(workspaceId: string): Promise<Array<{ id: string }>>;
  };
  workspaceInvitationRepository: {
    listByWorkspaceId(input: {
      workspaceId: string;
    }): Promise<Array<{ expiresAt: Date; id: string }>>;
  };
  workspaceMembershipRepository: {
    listByWorkspaceId(workspaceId: string): Promise<Array<{ id: string }>>;
  };
  workspaceRoleEscalationRequestRepository: {
    countPendingByWorkspaceId(workspaceId: string): Promise<number>;
  };
};

function createWorkspaceDirectoryRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    brandRepository: createBrandRepository(database),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(database),
    workspaceMembershipRepository:
      createWorkspaceMembershipRepository(database),
    workspaceRoleEscalationRequestRepository:
      createWorkspaceRoleEscalationRequestRepository(database)
  };
}

export function createWorkspaceDirectoryService(
  repositories: WorkspaceDirectoryRepositorySet
) {
  return {
    async listAccessibleWorkspaceDirectory(input: {
      currentWorkspaceId?: string | null | undefined;
      workspaces: StudioWorkspaceScopeSummary[];
    }) {
      const now = new Date();
      const entries = await Promise.all(
        input.workspaces.map(async (workspace) => {
          const [
            brands,
            memberships,
            invitations,
            pendingRoleEscalationCount,
            latestAuditLog
          ] = await Promise.all([
            repositories.brandRepository.listByWorkspaceId(workspace.id),
            repositories.workspaceMembershipRepository.listByWorkspaceId(
              workspace.id
            ),
            repositories.workspaceInvitationRepository.listByWorkspaceId({
              workspaceId: workspace.id
            }),
            repositories.workspaceRoleEscalationRequestRepository.countPendingByWorkspaceId(
              workspace.id
            ),
            repositories.auditLogRepository.listByEntity({
              entityId: workspace.id,
              entityType: "workspace",
              limit: 1
            })
          ]);

          const invitationStatusCounts = invitations.reduce(
            (counts, invitation) => {
              const status = getWorkspaceInvitationStatus({
                expiresAt: invitation.expiresAt,
                now
              });

              if (isWorkspaceInvitationPending(status)) {
                counts.pending += 1;
              }

              if (status === "expiring") {
                counts.expiring += 1;
              }

              if (status === "expired") {
                counts.expired += 1;
              }

              return counts;
            },
            {
              expired: 0,
              expiring: 0,
              pending: 0
            }
          );

          return {
            brandCount: brands.length,
            current: workspace.id === input.currentWorkspaceId,
            expiredInvitationCount: invitationStatusCounts.expired,
            expiringInvitationCount: invitationStatusCounts.expiring,
            lastActivityAt: latestAuditLog[0]?.createdAt.toISOString() ?? null,
            memberCount: memberships.length + 1,
            pendingInvitationCount: invitationStatusCounts.pending,
            pendingRoleEscalationCount,
            workspace
          };
        })
      );

      return studioWorkspaceDirectoryResponseSchema.parse({
        workspaces: entries
      });
    }
  };
}

export function createRuntimeWorkspaceDirectoryService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  return createWorkspaceDirectoryService(
    createWorkspaceDirectoryRepositories(getDatabaseClient(rawEnvironment))
  );
}
