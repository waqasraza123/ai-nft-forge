import type { Brand, Prisma } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type BrandRepositoryDatabase = Pick<DatabaseExecutor, "brand">;

type CreateBrandInput = {
  customDomain?: string | null;
  name: string;
  slug: string;
  themeJson: Prisma.InputJsonValue;
  workspaceId: string;
};

export function createBrandRepository(database: BrandRepositoryDatabase) {
  return {
    create(input: CreateBrandInput): Promise<Brand> {
      return database.brand.create({
        data: input
      });
    },

    findByWorkspaceAndSlug(input: {
      slug: string;
      workspaceId: string;
    }): Promise<Brand | null> {
      return database.brand.findUnique({
        where: {
          workspaceId_slug: {
            slug: input.slug,
            workspaceId: input.workspaceId
          }
        }
      });
    },

    findFirstByOwnerUserId(ownerUserId: string): Promise<Brand | null> {
      return database.brand.findFirst({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          workspace: {
            ownerUserId
          }
        }
      });
    },

    findFirstBySlug(slug: string): Promise<Brand | null> {
      return database.brand.findFirst({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          slug
        }
      });
    },

    updateByIdForOwner(input: {
      customDomain?: string | null;
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      themeJson: Prisma.InputJsonValue;
      workspaceId: string;
    }): Promise<Brand> {
      return database.brand
        .updateMany({
          data: {
            customDomain: input.customDomain ?? null,
            name: input.name,
            slug: input.slug,
            themeJson: input.themeJson,
            workspaceId: input.workspaceId
          },
          where: {
            id: input.id,
            workspace: {
              ownerUserId: input.ownerUserId
            }
          }
        })
        .then(() =>
          database.brand.findUniqueOrThrow({
            where: {
              id: input.id
            }
          })
        );
    }
  };
}

export type BrandRepository = ReturnType<typeof createBrandRepository>;
