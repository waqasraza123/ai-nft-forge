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
});
