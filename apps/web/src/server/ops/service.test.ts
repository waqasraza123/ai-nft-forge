import { describe, expect, it, vi } from "vitest";

import { createOpsService } from "./service";

const defaultWorkspaceId = "workspace_1";

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
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge,
          findByIdForWorkspace: vi.fn().mockResolvedValue({
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
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
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
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn().mockResolvedValue({
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
        ownerUserId: "user_1",
        workspaceId: defaultWorkspaceId
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
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn().mockResolvedValue({
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
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(upsert).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      mutedUntil: new Date("2026-04-08T10:00:00.000Z"),
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });
    expect(result.mute.id).toBe("mute_1");
    expect(result.alert.mutedUntil).toBe("2026-04-08T10:00:00.000Z");
  });

  it("removes an existing owner-scoped alert mute", async () => {
    const deleteByWorkspaceIdAndCode = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode,
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn().mockResolvedValue({
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
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(deleteByWorkspaceIdAndCode).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      workspaceId: defaultWorkspaceId
    });
    expect(result.code).toBe("QUEUE_STALLED");
    expect(result.removed).toBe(true);
  });

  it("removes an owner-scoped alert mute by code", async () => {
    const deleteByWorkspaceIdAndCode = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode,
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.unmuteAlertByCode({
      code: "QUEUE_STALLED",
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(deleteByWorkspaceIdAndCode).toHaveBeenCalledWith({
      code: "QUEUE_STALLED",
      workspaceId: defaultWorkspaceId
    });
    expect(result).toEqual({
      code: "QUEUE_STALLED",
      removed: true
    });
  });

  it("updates the owner-scoped alert routing policy", async () => {
    const upsert = vi.fn().mockResolvedValue({
      id: "routing_1",
      updatedAt: new Date("2026-04-07T10:00:00.000Z"),
      webhookEnabled: true,
      webhookMinimumSeverity: "critical"
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.updateAlertRoutingPolicy({
      ownerUserId: "user_1",
      webhookMode: "critical_only",
      workspaceId: defaultWorkspaceId
    });

    expect(upsert).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      webhookEnabled: true,
      webhookMinimumSeverity: "critical",
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      id: "routing_1",
      source: "owner_override",
      updatedAt: "2026-04-07T10:00:00.000Z",
      webhookMode: "critical_only"
    });
  });

  it("resets the owner-scoped alert routing policy back to default", async () => {
    const deleteByWorkspaceId = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId,
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.resetAlertRoutingPolicy({
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(deleteByWorkspaceId).toHaveBeenCalledWith({
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      id: null,
      source: "default",
      updatedAt: null,
      webhookMode: "all"
    });
  });

  it("updates the owner-scoped alert escalation policy", async () => {
    const upsert = vi.fn().mockResolvedValue({
      firstReminderDelayMinutes: 60,
      id: "escalation_1",
      repeatReminderIntervalMinutes: 180,
      updatedAt: new Date("2026-04-07T10:00:00.000Z")
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.updateAlertEscalationPolicy({
      firstReminderDelayMinutes: 60,
      ownerUserId: "user_1",
      repeatReminderIntervalMinutes: 180,
      workspaceId: defaultWorkspaceId
    });

    expect(upsert).toHaveBeenCalledWith({
      firstReminderDelayMinutes: 60,
      ownerUserId: "user_1",
      repeatReminderIntervalMinutes: 180,
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      firstReminderDelayMinutes: 60,
      id: "escalation_1",
      repeatReminderIntervalMinutes: 180,
      source: "owner_override",
      updatedAt: "2026-04-07T10:00:00.000Z"
    });
  });

  it("resets the owner-scoped alert escalation policy back to default", async () => {
    const deleteByWorkspaceId = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId,
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.resetAlertEscalationPolicy({
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(deleteByWorkspaceId).toHaveBeenCalledWith({
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      firstReminderDelayMinutes: null,
      id: null,
      repeatReminderIntervalMinutes: null,
      source: "default",
      updatedAt: null
    });
  });

  it("updates the owner-scoped alert delivery schedule", async () => {
    const upsert = vi.fn().mockResolvedValue({
      activeDaysMask: 62,
      endMinuteOfDay: 1020,
      id: "schedule_1",
      startMinuteOfDay: 540,
      timezone: "America/New_York",
      updatedAt: new Date("2026-04-07T10:00:00.000Z")
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.updateAlertSchedulePolicy({
      activeDays: ["mon", "tue", "wed", "thu", "fri"],
      endMinuteOfDay: 1020,
      ownerUserId: "user_1",
      startMinuteOfDay: 540,
      timezone: "America/New_York",
      workspaceId: defaultWorkspaceId
    });

    expect(upsert).toHaveBeenCalledWith({
      activeDaysMask: 62,
      endMinuteOfDay: 1020,
      ownerUserId: "user_1",
      startMinuteOfDay: 540,
      timezone: "America/New_York",
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      activeDays: ["mon", "tue", "wed", "thu", "fri"],
      endMinuteOfDay: 1020,
      id: "schedule_1",
      source: "owner_override",
      startMinuteOfDay: 540,
      timezone: "America/New_York",
      updatedAt: "2026-04-07T10:00:00.000Z"
    });
  });

  it("resets the owner-scoped alert delivery schedule back to default", async () => {
    const deleteByWorkspaceId = vi.fn().mockResolvedValue({
      count: 1
    });
    const service = createOpsService({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      repositories: {
        opsAlertMuteRepository: {
          deleteByWorkspaceIdAndCode: vi.fn(),
          findActiveByWorkspaceIdAndCode: vi.fn().mockResolvedValue(null),
          upsert: vi.fn()
        },
        opsAlertRoutingPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertEscalationPolicyRepository: {
          deleteByWorkspaceId: vi.fn(),
          upsert: vi.fn()
        },
        opsAlertSchedulePolicyRepository: {
          deleteByWorkspaceId,
          upsert: vi.fn()
        },
        opsAlertStateRepository: {
          acknowledge: vi.fn(),
          findByIdForWorkspace: vi.fn()
        }
      }
    });

    const result = await service.resetAlertSchedulePolicy({
      ownerUserId: "user_1",
      workspaceId: defaultWorkspaceId
    });

    expect(deleteByWorkspaceId).toHaveBeenCalledWith({
      workspaceId: defaultWorkspaceId
    });
    expect(result.policy).toEqual({
      activeDays: [],
      endMinuteOfDay: null,
      id: null,
      source: "default",
      startMinuteOfDay: null,
      timezone: null,
      updatedAt: null
    });
  });
});
