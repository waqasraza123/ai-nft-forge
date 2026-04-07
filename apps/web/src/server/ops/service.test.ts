import { describe, expect, it, vi } from "vitest";

import { createOpsService } from "./service";

describe("createOpsService", () => {
  it("acknowledges an active owner-scoped alert", async () => {
    const acknowledge = vi.fn().mockResolvedValue({
      acknowledgedAt: new Date("2026-04-07T10:00:00.000Z"),
      acknowledgedByUserId: "user_1",
      code: "QUEUE_STALLED",
      firstObservedAt: new Date("2026-04-07T09:00:00.000Z"),
      id: "alert_state_1",
      lastDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      lastObservedAt: new Date("2026-04-07T10:00:00.000Z"),
      message: "3 generation jobs are waiting while no jobs are active.",
      severity: "critical",
      status: "active",
      title: "The generation queue appears stalled."
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByOwnerUserIdAndCode: vi.fn(),
          findActiveByOwnerUserIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge,
          findByIdForOwner: vi.fn().mockResolvedValue({
            acknowledgedAt: null,
            acknowledgedByUserId: null,
            code: "QUEUE_STALLED",
            firstObservedAt: new Date("2026-04-07T09:00:00.000Z"),
            id: "alert_state_1",
            lastDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
            lastObservedAt: new Date("2026-04-07T10:00:00.000Z"),
            message: "3 generation jobs are waiting while no jobs are active.",
            severity: "critical",
            status: "active",
            title: "The generation queue appears stalled."
          })
        }
      }
    });

    const result = await service.acknowledgeAlert({
      alertStateId: "alert_state_1",
      ownerUserId: "user_1"
    });

    expect(acknowledge).toHaveBeenCalledWith({
      acknowledgedAt: new Date("2026-04-07T10:00:00.000Z"),
      acknowledgedByUserId: "user_1",
      id: "alert_state_1"
    });
    expect(result.alert.acknowledgedByUserId).toBe("user_1");
  });

  it("rejects acknowledgment for non-active alerts", async () => {
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByOwnerUserIdAndCode: vi.fn(),
          findActiveByOwnerUserIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForOwner: vi.fn().mockResolvedValue({
            acknowledgedAt: null,
            acknowledgedByUserId: null,
            code: "QUEUE_STALLED",
            firstObservedAt: new Date("2026-04-07T09:00:00.000Z"),
            id: "alert_state_1",
            lastDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
            lastObservedAt: new Date("2026-04-07T10:00:00.000Z"),
            message: "3 generation jobs are waiting while no jobs are active.",
            severity: "critical",
            status: "resolved",
            title: "The generation queue appears stalled."
          })
        }
      }
    });

    await expect(
      service.acknowledgeAlert({
        alertStateId: "alert_state_1",
        ownerUserId: "user_1"
      })
    ).rejects.toMatchObject({
      code: "ALERT_NOT_ACTIVE",
      statusCode: 409
    });
  });

  it("mutes an active owner-scoped alert for a bounded duration", async () => {
    const upsert = vi.fn().mockResolvedValue({
      code: "QUEUE_STALLED",
      id: "mute_1",
      mutedUntil: new Date("2026-04-08T10:00:00.000Z")
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByOwnerUserIdAndCode: vi.fn(),
          findActiveByOwnerUserIdAndCode: vi.fn().mockResolvedValue(null),
          upsert
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForOwner: vi.fn().mockResolvedValue({
            acknowledgedAt: null,
            acknowledgedByUserId: null,
            code: "QUEUE_STALLED",
            firstObservedAt: new Date("2026-04-07T09:00:00.000Z"),
            id: "alert_state_1",
            lastDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
            lastObservedAt: new Date("2026-04-07T10:00:00.000Z"),
            message: "3 generation jobs are waiting while no jobs are active.",
            severity: "critical",
            status: "active",
            title: "The generation queue appears stalled."
          })
        }
      }
    });

    const result = await service.muteAlert({
      alertStateId: "alert_state_1",
      durationHours: 24,
      ownerUserId: "user_1"
    });

    expect(upsert).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      mutedUntil: new Date("2026-04-08T10:00:00.000Z"),
      ownerUserId: "user_1"
    });
    expect(result.mute.id).toBe("mute_1");
    expect(result.alert.mutedUntil).toBe("2026-04-08T10:00:00.000Z");
  });

  it("removes an existing owner-scoped alert mute", async () => {
    const deleteByOwnerUserIdAndCode = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByOwnerUserIdAndCode,
          findActiveByOwnerUserIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForOwner: vi.fn().mockResolvedValue({
            acknowledgedAt: null,
            acknowledgedByUserId: null,
            code: "QUEUE_STALLED",
            firstObservedAt: new Date("2026-04-07T09:00:00.000Z"),
            id: "alert_state_1",
            lastDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
            lastObservedAt: new Date("2026-04-07T10:00:00.000Z"),
            message: "3 generation jobs are waiting while no jobs are active.",
            severity: "critical",
            status: "active",
            title: "The generation queue appears stalled."
          })
        }
      }
    });

    const result = await service.unmuteAlert({
      alertStateId: "alert_state_1",
      ownerUserId: "user_1"
    });

    expect(deleteByOwnerUserIdAndCode).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      ownerUserId: "user_1"
    });
    expect(result.code).toBe("QUEUE_STALLED");
    expect(result.removed).toBe(true);
  });

  it("removes an owner-scoped alert mute by code", async () => {
    const deleteByOwnerUserIdAndCode = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByOwnerUserIdAndCode,
          findActiveByOwnerUserIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForOwner: vi.fn()
        }
      }
    });

    const result = await service.unmuteAlertByCode({
      code: "QUEUE_STALLED",
      ownerUserId: "user_1"
    });

    expect(deleteByOwnerUserIdAndCode).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      ownerUserId: "user_1"
    });
    expect(result).toEqual({
      code: "QUEUE_STALLED",
      removed: true
    });
  });
});
