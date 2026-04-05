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
    findById(id: string): Promise<User | null> {
      return database.user.findUnique({
        where: {
          id
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
