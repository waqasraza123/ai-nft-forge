import { describe, expect, it, vi } from "vitest";

import { createAuthSessionRepository } from "./auth-session-repository.js";
import { createGeneratedAssetRepository } from "./generated-asset-repository.js";
import { createGenerationRequestRepository } from "./generation-request-repository.js";
import { createOpsAlertDeliveryRepository } from "./ops-alert-delivery-repository.js";
import { createOpsAlertStateRepository } from "./ops-alert-state-repository.js";
import { createOpsObservabilityCaptureRepository } from "./ops-observability-capture-repository.js";
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

  it("delegates distinct generation owner lookup through the generation request repository", async () => {
    const database = {
      generationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([
          {
            ownerUserId: "user_1"
          },
          {
            ownerUserId: "user_2"
          }
        ]),
        findUnique: vi.fn(),
        update: vi.fn()
      }
    };
    const repository = createGenerationRequestRepository(database as never);

    const result = await repository.listDistinctOwnerUserIds();

    expect(database.generationRequest.findMany).toHaveBeenCalledWith({
      distinct: ["ownerUserId"],
      orderBy: {
        ownerUserId: "asc"
      },
      select: {
        ownerUserId: true
      }
    });
    expect(result).toEqual(["user_1", "user_2"]);
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

  it("delegates observability capture creation through the ops capture repository", async () => {
    const database = {
      opsObservabilityCapture: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        }),
        findMany: vi.fn()
      }
    };
    const repository = createOpsObservabilityCaptureRepository(
      database as never
    );

    const result = await repository.create({
      backendReadinessMessage: "Ready",
      backendReadinessStatus: "ready",
      capturedAt: new Date("2026-04-07T09:00:00.000Z"),
      criticalAlertCount: 1,
      observabilityMessage:
        "1 critical and 0 warning operator alerts are active.",
      observabilityStatus: "critical",
      oldestQueuedAgeSeconds: 900,
      oldestRunningAgeSeconds: 1200,
      ownerUserId: "user_1",
      queueActiveCount: 0,
      queueCompletedCount: 4,
      queueConcurrency: 1,
      queueDelayedCount: 0,
      queueFailedCount: 2,
      queuePausedCount: 0,
      queueStatus: "ok",
      queueWaitingCount: 3,
      warningAlertCount: 0,
      windows: [
        {
          averageCompletionSeconds: 180,
          capturedAt: new Date("2026-04-07T09:00:00.000Z"),
          failedCount: 2,
          from: new Date("2026-04-07T08:00:00.000Z"),
          label: "Last hour",
          maxCompletionSeconds: 240,
          ownerUserId: "user_1",
          queuedCount: 1,
          runningCount: 0,
          storedAssetCount: 3,
          succeededCount: 1,
          successRatePercent: 33.3,
          totalCount: 4,
          windowKey: "1h"
        }
      ],
      workerAdapter: "http_backend"
    });

    expect(database.opsObservabilityCapture.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        backendReadinessMessage: "Ready",
        backendReadinessStatus: "ready",
        criticalAlertCount: 1,
        observabilityStatus: "critical",
        ownerUserId: "user_1",
        queueStatus: "ok",
        warningAlertCount: 0,
        windowSnapshots: {
          create: [
            expect.objectContaining({
              label: "Last hour",
              ownerUserId: "user_1",
              windowKey: "1h"
            })
          ]
        }
      })
    });
    expect(result.id).toBe("capture_1");
  });

  it("delegates alert state ownership and resolution through the ops alert state repository", async () => {
    const database = {
      opsAlertState: {
        findFirst: vi.fn().mockResolvedValue({
          id: "alert_state_1"
        }),
        create: vi.fn().mockResolvedValue({
          id: "alert_state_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "alert_state_1"
          }
        ]),
        update: vi.fn().mockResolvedValue({
          id: "alert_state_1",
          status: "resolved"
        })
      }
    };
    const repository = createOpsAlertStateRepository(database as never);
    const observedAt = new Date("2026-04-07T09:00:00.000Z");

    await repository.createActive({
      code: "QUEUE_STALLED",
      message: "3 generation jobs are waiting while no jobs are active.",
      observedAt,
      ownerUserId: "user_1",
      severity: "critical",
      title: "The generation queue appears stalled."
    });
    const acknowledged = await repository.acknowledge({
      acknowledgedAt: observedAt,
      acknowledgedByUserId: "user_1",
      id: "alert_state_1"
    });
    const found = await repository.findByIdForOwner({
      id: "alert_state_1",
      ownerUserId: "user_1"
    });
    const states = await repository.listByOwnerUserIdAndCodes({
      codes: ["QUEUE_STALLED"],
      ownerUserId: "user_1"
    });
    const resolved = await repository.markResolved({
      id: "alert_state_1",
      observedAt
    });

    expect(database.opsAlertState.create).toHaveBeenCalledWith({
      data: {
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstObservedAt: observedAt,
        lastObservedAt: observedAt,
        message: "3 generation jobs are waiting while no jobs are active.",
        ownerUserId: "user_1",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      }
    });
    expect(database.opsAlertState.update).toHaveBeenNthCalledWith(1, {
      data: {
        acknowledgedAt: observedAt,
        acknowledgedByUserId: "user_1"
      },
      where: {
        id: "alert_state_1"
      }
    });
    expect(database.opsAlertState.findFirst).toHaveBeenCalledWith({
      where: {
        id: "alert_state_1",
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertState.findMany).toHaveBeenCalledWith({
      where: {
        code: {
          in: ["QUEUE_STALLED"]
        },
        ownerUserId: "user_1"
      }
    });
    expect(database.opsAlertState.update).toHaveBeenCalledWith({
      data: {
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        lastObservedAt: observedAt,
        resolvedAt: observedAt,
        status: "resolved"
      },
      where: {
        id: "alert_state_1"
      }
    });
    expect(acknowledged.id).toBe("alert_state_1");
    expect(found?.id).toBe("alert_state_1");
    expect(states[0]?.id).toBe("alert_state_1");
    expect(resolved.status).toBe("resolved");
  });

  it("delegates alert delivery persistence through the ops alert delivery repository", async () => {
    const database = {
      opsAlertDelivery: {
        create: vi.fn().mockResolvedValue({
          id: "alert_delivery_1"
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "alert_delivery_1"
          }
        ])
      }
    };
    const repository = createOpsAlertDeliveryRepository(database as never);

    const created = await repository.create({
      alertStateId: "alert_state_1",
      captureId: "capture_1",
      code: "QUEUE_STALLED",
      deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      deliveryChannel: "audit_log",
      deliveryState: "delivered",
      failureMessage: null,
      message: "3 generation jobs are waiting while no jobs are active.",
      ownerUserId: "user_1",
      severity: "critical",
      title: "The generation queue appears stalled."
    });
    const deliveries = await repository.listRecentForOwnerUserId({
      limit: 5,
      ownerUserId: "user_1"
    });

    expect(database.opsAlertDelivery.create).toHaveBeenCalledWith({
      data: {
        alertStateId: "alert_state_1",
        captureId: "capture_1",
        code: "QUEUE_STALLED",
        deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
        deliveryChannel: "audit_log",
        deliveryState: "delivered",
        failureMessage: null,
        message: "3 generation jobs are waiting while no jobs are active.",
        ownerUserId: "user_1",
        severity: "critical",
        title: "The generation queue appears stalled."
      }
    });
    expect(database.opsAlertDelivery.findMany).toHaveBeenCalledWith({
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 5,
      where: {
        ownerUserId: "user_1"
      }
    });
    expect(created.id).toBe("alert_delivery_1");
    expect(deliveries[0]?.id).toBe("alert_delivery_1");
  });
});
