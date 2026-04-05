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
    }
  };
}

export type BrandRepository = ReturnType<typeof createBrandRepository>;
