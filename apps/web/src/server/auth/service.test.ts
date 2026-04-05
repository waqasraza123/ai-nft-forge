import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

import { createAuthMessage, verifyAuthMessageSignature } from "./message";
import { createAuthService } from "./service";

function createInMemoryAuthHarness() {
  const account = privateKeyToAccount(
    "0x59c6995e998f97a5a0044966f0945382d7d2d91c2f84a5a3b0e2f98b8a1b6f4d"
  );
  const users = new Map<
    string,
    {
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    }
  >();
  const nonces = new Map<
    string,
    {
      createdAt: Date;
      expiresAt: Date;
      id: string;
      nonce: string;
      usedAt: Date | null;
      walletAddress: string;
    }
  >();
  const sessions = new Map<
    string,
    {
      createdAt: Date;
      expiresAt: Date;
      id: string;
      ipHash: string | null;
      revokedAt: Date | null;
      userAgent: string | null;
      userId: string;
    }
  >();
  let currentTime = new Date("2026-04-05T00:00:00.000Z");
  let nonceIndex = 0;

  const repositories = {
    authNonceRepository: {
      async create(input: {
        expiresAt: Date;
        nonce: string;
        walletAddress: string;
      }) {
        const record = {
          createdAt: currentTime,
          expiresAt: input.expiresAt,
          id: randomUUID(),
          nonce: input.nonce,
          usedAt: null,
          walletAddress: input.walletAddress
        };

        nonces.set(record.id, record);

        return record;
      },

      async findActiveByWalletAddressAndNonce(input: {
        nonce: string;
        now: Date;
        walletAddress: string;
      }) {
        return (
          [...nonces.values()].find(
            (nonce) =>
              nonce.walletAddress === input.walletAddress &&
              nonce.nonce === input.nonce &&
              nonce.usedAt === null &&
              nonce.expiresAt.getTime() > input.now.getTime()
          ) || null
        );
      },

      async markUsed(id: string, usedAt: Date) {
        const nonce = nonces.get(id);

        if (!nonce) {
          throw new Error("Nonce missing in test harness.");
        }

        const updatedNonce = {
          ...nonce,
          usedAt
        };

        nonces.set(id, updatedNonce);

        return updatedNonce;
      }
    },
    authSessionRepository: {
      async create(input: {
        expiresAt: Date;
        ipHash?: string | null;
        userAgent?: string | null;
        userId: string;
      }) {
        const record = {
          createdAt: currentTime,
          expiresAt: input.expiresAt,
          id: randomUUID(),
          ipHash: input.ipHash ?? null,
          revokedAt: null,
          userAgent: input.userAgent ?? null,
          userId: input.userId
        };

        sessions.set(record.id, record);

        return record;
      },

      async findActiveById(id: string, now: Date) {
        const session = sessions.get(id);

        if (!session) {
          return null;
        }

        if (session.revokedAt || session.expiresAt.getTime() <= now.getTime()) {
          return null;
        }

        return session;
      },

      async revoke(id: string, revokedAt: Date) {
        const session = sessions.get(id);

        if (!session) {
          throw new Error("Session missing in test harness.");
        }

        const updatedSession = {
          ...session,
          revokedAt
        };

        sessions.set(id, updatedSession);

        return updatedSession;
      }
    },
    userRepository: {
      async findById(id: string) {
        return [...users.values()].find((user) => user.id === id) ?? null;
      },

      async upsertWalletUser(input: {
        avatarUrl?: string | null;
        displayName?: string | null;
        walletAddress: string;
      }) {
        const existingUser = [...users.values()].find(
          (user) => user.walletAddress === input.walletAddress
        );

        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            avatarUrl:
              input.avatarUrl === undefined
                ? existingUser.avatarUrl
                : input.avatarUrl,
            displayName:
              input.displayName === undefined
                ? existingUser.displayName
                : input.displayName
          };

          users.set(updatedUser.id, updatedUser);

          return updatedUser;
        }

        const createdUser = {
          avatarUrl: input.avatarUrl ?? null,
          displayName: input.displayName ?? null,
          id: randomUUID(),
          walletAddress: input.walletAddress
        };

        users.set(createdUser.id, createdUser);

        return createdUser;
      }
    }
  };

  const service = createAuthService({
    config: {
      AUTH_MESSAGE_STATEMENT: "Sign in to AI NFT Forge",
      AUTH_NONCE_TTL_MINUTES: 10,
      AUTH_SESSION_COOKIE_NAME: "ai_nft_forge_session",
      AUTH_SESSION_TTL_DAYS: 30
    },
    createNonce: () => {
      nonceIndex += 1;

      return `nonce_value_${nonceIndex.toString().padStart(16, "0")}`;
    },
    hashValue: (value) => `hash:${value}`,
    now: () => currentTime,
    repositories,
    runTransaction: async (operation) => operation(repositories),
    verifyMessageSignature: verifyAuthMessageSignature
  });

  return {
    account,
    advanceTime(milliseconds: number) {
      currentTime = new Date(currentTime.getTime() + milliseconds);
    },
    createMessage(nonce: string) {
      return createAuthMessage({
        nonce,
        statement: "Sign in to AI NFT Forge",
        walletAddress: account.address
      });
    },
    service,
    sessions
  };
}

describe("auth service", () => {
  it("issues a nonce, verifies a signature, creates a session, and revokes it", async () => {
    const harness = createInMemoryAuthHarness();
    const nonceResponse = await harness.service.issueNonce({
      walletAddress: harness.account.address
    });
    const signature = await harness.account.signMessage({
      message: harness.createMessage(nonceResponse.nonce)
    });
    const verificationResult = await harness.service.verifyAndCreateSession({
      ipAddress: "127.0.0.1",
      nonce: nonceResponse.nonce,
      signature,
      userAgent: "vitest",
      walletAddress: harness.account.address
    });

    expect(verificationResult.session.user.walletAddress).toBe(
      harness.account.address
    );

    const createdSessionId = verificationResult.sessionId;

    expect(createdSessionId).toBeDefined();

    const restoredSession = await harness.service.getSession({
      sessionId: createdSessionId as string
    });

    expect(restoredSession?.user.walletAddress).toBe(harness.account.address);

    await harness.service.revokeSession({
      sessionId: createdSessionId as string
    });

    await expect(
      harness.service.getSession({
        sessionId: createdSessionId as string
      })
    ).resolves.toBeNull();
  });

  it("blocks nonce reuse after a successful verification", async () => {
    const harness = createInMemoryAuthHarness();
    const nonceResponse = await harness.service.issueNonce({
      walletAddress: harness.account.address
    });
    const signature = await harness.account.signMessage({
      message: harness.createMessage(nonceResponse.nonce)
    });

    await harness.service.verifyAndCreateSession({
      ipAddress: null,
      nonce: nonceResponse.nonce,
      signature,
      userAgent: null,
      walletAddress: harness.account.address
    });

    await expect(
      harness.service.verifyAndCreateSession({
        ipAddress: null,
        nonce: nonceResponse.nonce,
        signature,
        userAgent: null,
        walletAddress: harness.account.address
      })
    ).rejects.toMatchObject({
      code: "NONCE_INVALID",
      statusCode: 401
    });
  });

  it("rejects expired nonces", async () => {
    const harness = createInMemoryAuthHarness();
    const nonceResponse = await harness.service.issueNonce({
      walletAddress: harness.account.address
    });
    const signature = await harness.account.signMessage({
      message: harness.createMessage(nonceResponse.nonce)
    });

    harness.advanceTime(11 * 60 * 1000);

    await expect(
      harness.service.verifyAndCreateSession({
        ipAddress: null,
        nonce: nonceResponse.nonce,
        signature,
        userAgent: null,
        walletAddress: harness.account.address
      })
    ).rejects.toMatchObject({
      code: "NONCE_INVALID",
      statusCode: 401
    });
  });
});
