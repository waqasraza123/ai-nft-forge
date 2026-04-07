import { describe, expect, it, vi } from "vitest";

import { createAuthSessionRepository } from "./auth-session-repository.js";
import { createGeneratedAssetRepository } from "./generated-asset-repository.js";
import { createGenerationRequestRepository } from "./generation-request-repository.js";
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
        findUnique: vi.fn(),
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

  it("delegates active generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generation_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.findActiveForSourceAsset({
      ownerUserId: "user_1",
      sourceAssetId: "asset_1"
    });

    expect(database.generationRequest.findFirst).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        ownerUserId: "user_1",
        sourceAssetId: "asset_1",
        status: {
          in: ["queued", "running"]
        }
      }
    });
    expect(result?.id).toBe("generation_1");
  });

  it("delegates recent owner-scoped generation activity lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generation_2"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.listRecentForOwnerUserId({
      limit: 5,
      orderBy: "failedAtDesc",
      ownerUserId: "user_1",
      statuses: ["failed"]
    });

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          failedAt: "desc"
        },
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 5,
      where: {
        ownerUserId: "user_1",
        status: {
          in: ["failed"]
        }
      }
    });
    expect(result[0]?.id).toBe("generation_2");
  });

  it("delegates recent windowed generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generation_3"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);
    const since = new Date("2026-04-07T05:00:00.000Z");

    const result = await repository.listRecentForOwnerUserIdSince({
      ownerUserId: "user_1",
      since
    });

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      where: {
        createdAt: {
          gte: since
        },
        ownerUserId: "user_1"
      }
    });
    expect(result[0]?.id).toBe("generation_3");
  });

  it("delegates oldest owner-scoped generation lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generation_queued_1"
        }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.findOldestForOwnerUserId({
      ownerUserId: "user_1",
      statuses: ["queued"]
    });

    expect(database.generationRequest.findFirst).toHaveBeenCalledWith({
      include: {
        _count: {
          select: {
            generatedAssets: true
          }
        },
        sourceAsset: {
          select: {
            id: true,
            originalFilename: true,
            status: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        ownerUserId: "user_1",
        status: {
          in: ["queued"]
        }
      }
    });
    expect(result?.id).toBe("generation_queued_1");
  });

  it("delegates generated asset listing through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "generated_asset_1"
          }
        ])
      }
    };
    const repository = createGeneratedAssetRepository(database as never);

    const result = await repository.listByGenerationRequestIds([
      "generation_1",
      "generation_2"
    ]);

    expect(database.generatedAsset.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          generationRequestId: "desc"
        },
        {
          variantIndex: "asc"
        }
      ],
      where: {
        generationRequestId: {
          in: ["generation_1", "generation_2"]
        }
      }
    });
    expect(result[0]?.id).toBe("generated_asset_1");
  });

  it("delegates generated asset ownership lookup through the generated asset repository", async () => {
    const database = {
      generatedAsset: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "generated_asset_2"
        }),
        findMany: vi.fn()
      }
    };
    const repository = createGeneratedAssetRepository(database as never);

    const result = await repository.findByIdForOwner({
      id: "generated_asset_2",
      ownerUserId: "user_1"
    });

    expect(database.generatedAsset.findFirst).toHaveBeenCalledWith({
      where: {
        id: "generated_asset_2",
        ownerUserId: "user_1"
      }
    });
    expect(result?.id).toBe("generated_asset_2");
  });
});
