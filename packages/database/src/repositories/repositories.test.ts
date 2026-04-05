import { describe, expect, it, vi } from "vitest";

import { createAuthSessionRepository } from "./auth-session-repository.js";
import { createUserRepository } from "./user-repository.js";

describe("database repositories", () => {
  it("delegates wallet user upserts through the user repository", async () => {
    const database = {
      user: {
        findUnique: vi.fn(),
        upsert: vi.fn().mockResolvedValue({
          id: "user_1",
          walletAddress: "0xabc"
        })
      }
    };
    const repository = createUserRepository(database as never);

    const result = await repository.upsertWalletUser({
      walletAddress: "0xabc"
    });

    expect(database.user.upsert).toHaveBeenCalledWith({
      create: {
        walletAddress: "0xabc"
      },
      update: {},
      where: {
        walletAddress: "0xabc"
      }
    });
    expect(result.walletAddress).toBe("0xabc");
  });

  it("delegates active session lookup through the auth session repository", async () => {
    const database = {
      authSession: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "session_1"
        }),
        update: vi.fn()
      }
    };
    const repository = createAuthSessionRepository(database as never);
    const now = new Date("2026-04-05T00:00:00.000Z");

    const result = await repository.findActiveById("session_1", now);

    expect(database.authSession.findFirst).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          gt: now
        },
        id: "session_1",
        revokedAt: null
      }
    });
    expect(result?.id).toBe("session_1");
  });
});
