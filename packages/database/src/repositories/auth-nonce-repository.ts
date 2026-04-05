import type { AuthNonce } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type AuthNonceRepositoryDatabase = Pick<DatabaseExecutor, "authNonce">;

type CreateAuthNonceInput = {
  expiresAt: Date;
  nonce: string;
  walletAddress: string;
};

export function createAuthNonceRepository(
  database: AuthNonceRepositoryDatabase
) {
  return {
    create(input: CreateAuthNonceInput): Promise<AuthNonce> {
      return database.authNonce.create({
        data: input
      });
    },

    findActiveByWalletAddressAndNonce(input: {
      nonce: string;
      now: Date;
      walletAddress: string;
    }): Promise<AuthNonce | null> {
      return database.authNonce.findFirst({
        where: {
          expiresAt: {
            gt: input.now
          },
          nonce: input.nonce,
          usedAt: null,
          walletAddress: input.walletAddress
        }
      });
    },

    markUsed(id: string, usedAt: Date): Promise<AuthNonce> {
      return database.authNonce.update({
        data: {
          usedAt
        },
        where: {
          id
        }
      });
    }
  };
}

export type AuthNonceRepository = ReturnType<typeof createAuthNonceRepository>;
