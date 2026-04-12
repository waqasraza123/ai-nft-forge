import {
  createWorkspaceMembershipRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import type {
  AuthSessionResponse,
  StudioWorkspaceScopeSummary
} from "@ai-nft-forge/shared";
import { cookies } from "next/headers";

import { getCurrentAuthSession } from "../auth/session";

type AuthenticatedSession = NonNullable<AuthSessionResponse["session"]>;

export type StudioAccessRole = "operator" | "owner";
export const ACTIVE_WORKSPACE_COOKIE_NAME = "ai_nft_forge_active_workspace";

export type StudioAccessContext = {
  availableWorkspaces: StudioWorkspaceScopeSummary[];
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
  workspaceMembershipRepository: {
    listByUserId(userId: string): Promise<
      Array<{
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
      }>
    >;
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
    listByOwnerUserId(ownerUserId: string): Promise<
      Array<{
        id: string;
        name: string;
        ownerUserId: string;
        slug: string;
        status: "active" | "archived" | "suspended";
      }>
    >;
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
    workspaceMembershipRepository:
      createWorkspaceMembershipRepository(database),
    workspaceRepository: createWorkspaceRepository(database)
  };
}

export function createStudioAccessService(
  repositories: StudioAccessRepositorySet
) {
  async function listAccessibleWorkspacesForSession(input: {
    session: AuthenticatedSession;
  }): Promise<StudioWorkspaceScopeSummary[]> {
    const [ownedWorkspaces, memberships] = await Promise.all([
      repositories.workspaceRepository.listByOwnerUserId(
        input.session.user.id
      ),
      repositories.workspaceMembershipRepository.listByUserId(
        input.session.user.id
      )
    ]);
    const accessibleWorkspaces: StudioWorkspaceScopeSummary[] = [];

    for (const ownedWorkspace of ownedWorkspaces) {
      accessibleWorkspaces.push({
        id: ownedWorkspace.id,
        name: ownedWorkspace.name,
        ownerUserId: input.session.user.id,
        ownerWalletAddress: input.session.user.walletAddress,
        role: "owner",
        slug: ownedWorkspace.slug,
        status: ownedWorkspace.status
      });
    }

    for (const membership of memberships) {
      if (
        accessibleWorkspaces.some(
          (workspace) => workspace.id === membership.workspace.id
        )
      ) {
        continue;
      }

      accessibleWorkspaces.push({
        id: membership.workspace.id,
        name: membership.workspace.name,
        ownerUserId: membership.workspace.ownerUserId,
        ownerWalletAddress: membership.workspace.ownerUser.walletAddress,
        role: "operator",
        slug: membership.workspace.slug,
        status: membership.workspace.status
      });
    }

    return accessibleWorkspaces;
  }

  return {
    async listAccessibleWorkspacesForSession(input: {
      session: AuthenticatedSession;
    }) {
      return listAccessibleWorkspacesForSession(input);
    },

    async resolveForSession(input: {
      session: AuthenticatedSession;
      workspaceSlug?: string | null;
    }): Promise<StudioAccessContext> {
      const accessibleWorkspaces = await listAccessibleWorkspacesForSession({
        session: input.session
      });

      if (accessibleWorkspaces.length === 0) {
        return {
          availableWorkspaces: [],
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
      const selectedWorkspaceBySlug = input.workspaceSlug
        ? accessibleWorkspaces.find(
            (workspace) => workspace.slug === input.workspaceSlug
          )
        : undefined;
      const selectedWorkspace =
        selectedWorkspaceBySlug ?? accessibleWorkspaces[0]!;

      return {
        availableWorkspaces: accessibleWorkspaces,
        owner: {
          userId:
            selectedWorkspace.role === "owner"
              ? input.session.user.id
              : selectedWorkspace.ownerUserId,
          walletAddress:
            selectedWorkspace.role === "owner"
              ? input.session.user.walletAddress
              : selectedWorkspace.ownerWalletAddress
        },
        ownerUserId:
          selectedWorkspace.role === "owner"
            ? input.session.user.id
            : selectedWorkspace.ownerUserId,
        role: selectedWorkspace.role,
        session: input.session,
        workspace: {
          id: selectedWorkspace.id,
          name: selectedWorkspace.name,
          slug: selectedWorkspace.slug,
          status: selectedWorkspace.status
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
  rawEnvironment: NodeJS.ProcessEnv = process.env,
  input?: {
    workspaceSlug?: string | null;
  }
) {
  const session = await getCurrentAuthSession(rawEnvironment);

  if (!session) {
    return null;
  }

  const cookieStore = await cookies();
  const workspaceSlug =
    input?.workspaceSlug !== undefined
      ? input.workspaceSlug
      : (cookieStore.get(ACTIVE_WORKSPACE_COOKIE_NAME)?.value ?? null);

  return createRuntimeStudioAccessService(rawEnvironment).resolveForSession({
    session,
    ...(workspaceSlug
      ? {
          workspaceSlug
        }
      : {})
  });
}
