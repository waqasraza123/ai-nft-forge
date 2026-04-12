import type { User } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type UserRepositoryDatabase = Pick<DatabaseExecutor, "user">;

type UpsertWalletUserInput = {
  avatarUrl?: string | null;
  displayName?: string | null;
  walletAddress: string;
};

export function createUserRepository(database: UserRepositoryDatabase) {
  return {
    listIds(): Promise<string[]> {
      return database.user
        .findMany({
          orderBy: [
            {
              createdAt: "asc"
            },
            {
              id: "asc"
            }
          ],
          select: {
            id: true
          }
        })
        .then((users) => users.map((user) => user.id));
    },

    findById(id: string): Promise<User | null> {
      return database.user.findUnique({
        where: {
          id
        }
      });
    },

    listByIds(ids: string[]): Promise<User[]> {
      if (ids.length === 0) {
        return Promise.resolve([] as User[]);
      }

      return database.user.findMany({
        where: {
          id: {
            in: ids
          }
        }
      });
    },

    findByWalletAddress(walletAddress: string): Promise<User | null> {
      return database.user.findUnique({
        where: {
          walletAddress
        }
      });
    },

    upsertWalletUser(input: UpsertWalletUserInput): Promise<User> {
      const createData = {
        walletAddress: input.walletAddress,
        ...(input.avatarUrl !== undefined
          ? { avatarUrl: input.avatarUrl }
          : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {})
      };

      const updateData = {
        ...(input.avatarUrl !== undefined
          ? { avatarUrl: input.avatarUrl }
          : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {})
      };

      return database.user.upsert({
        create: createData,
        update: updateData,
        where: {
          walletAddress: input.walletAddress
        }
      });
    }
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
