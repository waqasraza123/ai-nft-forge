import type { AuthSession } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type AuthSessionRepositoryDatabase = Pick<DatabaseExecutor, "authSession">;

type CreateAuthSessionInput = {
  expiresAt: Date;
  ipHash?: string | null;
  userAgent?: string | null;
  userId: string;
};

export function createAuthSessionRepository(
  database: AuthSessionRepositoryDatabase
) {
  return {
    create(input: CreateAuthSessionInput): Promise<AuthSession> {
      return database.authSession.create({
        data: input
      });
    },

    findActiveById(id: string, now: Date): Promise<AuthSession | null> {
      return database.authSession.findFirst({
        where: {
          expiresAt: {
            gt: now
          },
          id,
          revokedAt: null
        }
      });
    },

    revoke(id: string, revokedAt: Date): Promise<AuthSession> {
      return database.authSession.update({
        data: {
          revokedAt
        },
        where: {
          id
        }
      });
    }
  };
}

export type AuthSessionRepository = ReturnType<
  typeof createAuthSessionRepository
>;
