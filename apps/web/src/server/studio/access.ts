import {
  createUserRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import type { AuthSessionResponse } from "@ai-nft-forge/shared";

import { getCurrentAuthSession } from "../auth/session";

type AuthenticatedSession = NonNullable<AuthSessionResponse["session"]>;

export type StudioAccessRole = "operator" | "owner";

export type StudioAccessContext = {
  owner: {
    userId: string;
    walletAddress: string;
  };
  ownerUserId: string;
  role: StudioAccessRole;
  session: AuthenticatedSession;
  workspace: {
    id: string;
    name: string;
    slug: string;
    status: "active" | "archived" | "suspended";
  } | null;
};

type StudioAccessRepositorySet = {
  userRepository: {
    findById(id: string): Promise<{
      id: string;
      walletAddress: string;
    } | null>;
  };
  workspaceMembershipRepository: {
    findFirstByUserId(userId: string): Promise<{
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
    } | null>;
  };
  workspaceRepository: {
    findFirstByOwnerUserId(ownerUserId: string): Promise<{
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    } | null>;
  };
};

function createStudioAccessRepositories(database: DatabaseExecutor) {
  return {
    userRepository: createUserRepository(database),
    workspaceMembershipRepository: createWorkspaceMembershipRepository(database),
    workspaceRepository: createWorkspaceRepository(database)
  };
}

export function createStudioAccessService(
  repositories: StudioAccessRepositorySet
) {
  return {
    async resolveForSession(input: {
      session: AuthenticatedSession;
    }): Promise<StudioAccessContext> {
      const ownedWorkspace =
        await repositories.workspaceRepository.findFirstByOwnerUserId(
          input.session.user.id
        );

      if (ownedWorkspace) {
        return {
          owner: {
            userId: input.session.user.id,
            walletAddress: input.session.user.walletAddress
          },
          ownerUserId: input.session.user.id,
          role: "owner",
          session: input.session,
          workspace: {
            id: ownedWorkspace.id,
            name: ownedWorkspace.name,
            slug: ownedWorkspace.slug,
            status: ownedWorkspace.status
          }
        };
      }

      const membership =
        await repositories.workspaceMembershipRepository.findFirstByUserId(
          input.session.user.id
        );

      if (!membership) {
        return {
          owner: {
            userId: input.session.user.id,
            walletAddress: input.session.user.walletAddress
          },
          ownerUserId: input.session.user.id,
          role: "owner",
          session: input.session,
          workspace: null
        };
      }

      const ownerUser = await repositories.userRepository.findById(
        membership.workspace.ownerUserId
      );

      return {
        owner: {
          userId: membership.workspace.ownerUserId,
          walletAddress:
            ownerUser?.walletAddress ??
            membership.workspace.ownerUser.walletAddress
        },
        ownerUserId: membership.workspace.ownerUserId,
        role: "operator",
        session: input.session,
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug,
          status: membership.workspace.status
        }
      };
    }
  };
}

export function createRuntimeStudioAccessService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  return createStudioAccessService(
    createStudioAccessRepositories(getDatabaseClient(rawEnvironment))
  );
}

export async function getCurrentStudioAccess(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const session = await getCurrentAuthSession(rawEnvironment);

  if (!session) {
    return null;
  }

  return createRuntimeStudioAccessService(rawEnvironment).resolveForSession({
    session
  });
}
