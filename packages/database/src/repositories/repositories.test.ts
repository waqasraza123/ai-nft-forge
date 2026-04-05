import { describe, expect, it, vi } from "vitest";

import { createAuthSessionRepository } from "./auth-session-repository.js";
import { createSourceAssetRepository } from "./source-asset-repository.js";
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

  it("delegates source asset listing through the source asset repository", async () => {
    const database = {
      sourceAsset: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "asset_1"
          }
        ]),
        update: vi.fn()
      }
    };
    const repository = createSourceAssetRepository(database as never);

    const result = await repository.listByOwnerUserId("user_1");

    expect(database.sourceAsset.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(result[0]?.id).toBe("asset_1");
  });
});
