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
    },

    findFirstByOwnerUserId(ownerUserId: string): Promise<Workspace | null> {
      return database.workspace.findFirst({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    updateByIdForOwner(input: {
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: WorkspaceStatus;
    }): Promise<Workspace> {
      return database.workspace
        .updateMany({
          data: {
            name: input.name,
            slug: input.slug,
            status: input.status
          },
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then(() =>
          database.workspace.findUniqueOrThrow({
            where: {
              id: input.id
            }
          })
        );
    },

    transferOwnershipById(input: {
      currentOwnerUserId: string;
      id: string;
      nextOwnerUserId: string;
    }): Promise<Workspace> {
      return database.workspace
        .updateMany({
          data: {
            ownerUserId: input.nextOwnerUserId
          },
          where: {
            id: input.id,
            ownerUserId: input.currentOwnerUserId
          }
        })
        .then(() =>
          database.workspace.findUniqueOrThrow({
            where: {
              id: input.id
            }
          })
        );
    }
  };
}

export type WorkspaceRepository = ReturnType<typeof createWorkspaceRepository>;
