import type { Workspace, WorkspaceStatus } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceRepositoryDatabase = Pick<DatabaseExecutor, "workspace">;

type CreateWorkspaceInput = {
  name: string;
  ownerUserId: string;
  slug: string;
  status?: WorkspaceStatus;
};

export function createWorkspaceRepository(
  database: WorkspaceRepositoryDatabase
) {
  return {
    create(input: CreateWorkspaceInput): Promise<Workspace> {
      return database.workspace.create({
        data: input
      });
    },

    findBySlug(slug: string): Promise<Workspace | null> {
      return database.workspace.findUnique({
        where: {
          slug
        }
      });
    }
  };
}

export type WorkspaceRepository = ReturnType<typeof createWorkspaceRepository>;
