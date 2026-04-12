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
    listActiveByWorkspaceId(input: {
      now: Date;
      workspaceId: string;
    }): Promise<Array<{ id: string }>>;
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
    workspaceInvitationRepository: createWorkspaceInvitationRepository(database),
    workspaceMembershipRepository: createWorkspaceMembershipRepository(database),
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
          const [brands, memberships, invitations, pendingRoleEscalationCount, latestAuditLog] =
            await Promise.all([
              repositories.brandRepository.listByWorkspaceId(workspace.id),
              repositories.workspaceMembershipRepository.listByWorkspaceId(
                workspace.id
              ),
              repositories.workspaceInvitationRepository.listActiveByWorkspaceId(
                {
                  now,
                  workspaceId: workspace.id
                }
              ),
              repositories.workspaceRoleEscalationRequestRepository.countPendingByWorkspaceId(
                workspace.id
              ),
              repositories.auditLogRepository.listByEntity({
                entityId: workspace.id,
                entityType: "workspace",
                limit: 1
              })
            ]);

          return {
            brandCount: brands.length,
            current: workspace.id === input.currentWorkspaceId,
            lastActivityAt: latestAuditLog[0]?.createdAt.toISOString() ?? null,
            memberCount: memberships.length + 1,
            pendingInvitationCount: invitations.length,
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
