import { describe, expect, it, vi } from "vitest";

import { createOpsObservabilityCaptureService } from "./observability-service.js";

function createLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

describe("createOpsObservabilityCaptureService", () => {
  it("captures observability history and delivers newly active alerts", async () => {
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const alertWebhookDelivery = {
      deliver: vi.fn().mockResolvedValue(undefined),
      enabled: true
    };
    const generationRequestRepository = {
      findOldestForOwnerUserId: vi
        .fn()
        .mockResolvedValueOnce({
          _count: {
            generatedAssets: 0
          },
          completedAt: null,
          createdAt: new Date("2026-04-07T08:40:00.000Z"),
          failedAt: null,
          id: "queued_1",
          resultJson: null,
          startedAt: null,
          status: "queued"
        })
        .mockResolvedValueOnce(null),
      listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
      listRecentForOwnerUserIdSince: vi
        .fn()
        .mockResolvedValueOnce([
          {
            _count: {
              generatedAssets: 0
            },
            completedAt: null,
            createdAt: new Date("2026-04-07T08:55:00.000Z"),
            failedAt: new Date("2026-04-07T08:58:00.000Z"),
            id: "failed_1",
            resultJson: null,
            startedAt: new Date("2026-04-07T08:56:00.000Z"),
            status: "failed"
          }
        ])
        .mockResolvedValueOnce([
          {
            _count: {
              generatedAssets: 0
            },
            completedAt: null,
            createdAt: new Date("2026-04-07T08:55:00.000Z"),
            failedAt: new Date("2026-04-07T08:58:00.000Z"),
            id: "failed_1",
            resultJson: null,
            startedAt: new Date("2026-04-07T08:56:00.000Z"),
            status: "failed"
          }
        ])
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertMuteRepository = {
      listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
    };
    const opsAlertRoutingPolicyRepository = {
      findByOwnerUserId: vi.fn().mockResolvedValue(null)
    };
    const opsAlertStateRepository = {
      createActive: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "OWNER_QUEUE_AGE_WARNING",
        firstWebhookDeliveredAt: null,
        id: "alert_state_1",
        lastAuditLogDeliveredAt: null,
        lastDeliveredAt: null,
        lastWebhookDeliveredAt: null,
        message: "The oldest queued owner-scoped request has waited 1200s.",
        severity: "warning",
        status: "active",
        title: "Queued owner-scoped generation work is older than expected."
      }),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn()
    };
    const opsObservabilityCaptureRepository = {
      create: vi.fn().mockResolvedValue({
        id: "capture_1"
      })
    };
    const logger = createLogger();
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery,
      auditLogRepository,
      generationRequestRepository,
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 0,
          completed: 3,
          delayed: 0,
          failed: 1,
          paused: 0,
          waiting: 1
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger,
      now: () => new Date("2026-04-07T09:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository,
      opsAlertRoutingPolicyRepository,
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository
    });

    const summary = await service.captureAllOwnerObservability();

    expect(opsObservabilityCaptureRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        criticalAlertCount: 2,
        observabilityStatus: "critical",
        ownerUserId: "user_1",
        warningAlertCount: 0
      })
    );
    expect(opsAlertStateRepository.createActive).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        code: "QUEUE_STALLED",
        ownerUserId: "user_1"
      })
    );
    expect(opsAlertStateRepository.createActive).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        code: "OWNER_QUEUE_AGE_CRITICAL",
        ownerUserId: "user_1"
      })
    );
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        alertStateId: "alert_state_1",
        captureId: "capture_1",
        deliveryChannel: "webhook",
        deliveryState: "delivered"
      })
    );
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ops.alert.delivered",
        entityId: "user_1"
      })
    );
    expect(alertWebhookDelivery.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        captureId: "capture_1",
        ownerUserId: "user_1"
      })
    );
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 4,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });

  it("suppresses duplicate delivery for unchanged active alerts and resolves cleared alerts", async () => {
    const generationRequestRepository = {
      findOldestForOwnerUserId: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
      listRecentForOwnerUserIdSince: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
    };
    const opsAlertStateRepository = {
      createActive: vi.fn(),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([
        {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          code: "OWNER_QUEUE_AGE_WARNING",
          firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          id: "alert_state_resolve",
          lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          message: "Old message",
          severity: "warning",
          status: "active",
          title: "Queued owner-scoped generation work is older than expected."
        },
        {
          acknowledgedAt: new Date("2026-04-07T08:05:00.000Z"),
          acknowledgedByUserId: "user_1",
          code: "QUEUE_DIAGNOSTICS_UNAVAILABLE",
          firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          id: "alert_state_keep",
          lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          message: "Redis timeout",
          severity: "warning",
          status: "active",
          title: "Queue diagnostics could not be loaded."
        }
      ]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([
        {
          acknowledgedAt: new Date("2026-04-07T08:05:00.000Z"),
          acknowledgedByUserId: "user_1",
          code: "QUEUE_DIAGNOSTICS_UNAVAILABLE",
          firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          id: "alert_state_keep",
          lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          message: "Redis timeout",
          severity: "warning",
          status: "active",
          title: "Queue diagnostics could not be loaded."
        }
      ]),
      markResolved: vi.fn().mockResolvedValue({}),
      setLastDeliveredAt: vi.fn(),
      update: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_DIAGNOSTICS_UNAVAILABLE",
        firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        id: "alert_state_keep",
        lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        message: "Redis timeout",
        severity: "warning",
        status: "active",
        title: "Queue diagnostics could not be loaded."
      })
    };
    const service = createOpsObservabilityCaptureService({
      auditLogRepository: {
        create: vi.fn()
      },
      generationRequestRepository,
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: null,
        counts: null,
        message: "Redis timeout",
        status: "unreachable",
        workerAdapter: null
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T09:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository: {
        listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
      },
      opsAlertRoutingPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository: {
        create: vi.fn()
      },
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(opsAlertStateRepository.markResolved).toHaveBeenCalledWith({
      id: "alert_state_resolve",
      observedAt: new Date("2026-04-07T09:00:00.000Z")
    });
    expect(opsAlertStateRepository.update).toHaveBeenCalledWith({
      acknowledgedAt: undefined,
      acknowledgedByUserId: undefined,
      id: "alert_state_keep",
      message: "Redis timeout",
      observedAt: new Date("2026-04-07T09:00:00.000Z"),
      severity: "warning",
      status: "active",
      title: "Queue diagnostics could not be loaded."
    });
    expect(summary.deliveredAlertCount).toBe(0);
    expect(summary.resolvedAlertCount).toBe(1);
  });

  it("re-delivers unchanged active webhook alerts when escalation is due", async () => {
    const alertWebhookDelivery = {
      deliver: vi.fn().mockResolvedValue(undefined),
      enabled: true
    };
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertStateRepository = {
      createActive: vi.fn(),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([
        {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          code: "QUEUE_STALLED",
          firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          id: "alert_state_1",
          lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          message: "1 generation jobs are waiting while no jobs are active.",
          severity: "critical",
          status: "active",
          title: "The generation queue appears stalled."
        }
      ]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([
        {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          code: "QUEUE_STALLED",
          firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          id: "alert_state_1",
          lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
          message: "1 generation jobs are waiting while no jobs are active.",
          severity: "critical",
          status: "active",
          title: "The generation queue appears stalled."
        }
      ]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        id: "alert_state_1",
        lastAuditLogDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        lastDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        lastWebhookDeliveredAt: new Date("2026-04-07T08:00:00.000Z"),
        message: "1 generation jobs are waiting while no jobs are active.",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      })
    };
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery,
      auditLogRepository,
      generationRequestRepository: {
        findOldestForOwnerUserId: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
        listRecentForOwnerUserIdSince: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
      },
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 0,
          completed: 3,
          delayed: 0,
          failed: 1,
          paused: 0,
          waiting: 1
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T09:05:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue({
          firstReminderDelayMinutes: 60,
          repeatReminderIntervalMinutes: 180
        })
      },
      opsAlertMuteRepository: {
        listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
      },
      opsAlertRoutingPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(alertWebhookDelivery.deliver).toHaveBeenCalledTimes(1);
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryChannel: "webhook",
        deliveryState: "delivered"
      })
    );
    expect(opsAlertStateRepository.setLastDeliveredAt).toHaveBeenCalledWith({
      deliveredAt: new Date("2026-04-07T09:05:00.000Z"),
      deliveryChannel: "webhook",
      id: "alert_state_1"
    });
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 1,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });

  it("records webhook delivery failures without blocking audit-log delivery", async () => {
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertMuteRepository = {
      listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
    };
    const opsAlertRoutingPolicyRepository = {
      findByOwnerUserId: vi.fn().mockResolvedValue(null)
    };
    const opsAlertStateRepository = {
      createActive: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstWebhookDeliveredAt: null,
        id: "alert_state_1",
        lastAuditLogDeliveredAt: null,
        lastDeliveredAt: null,
        lastWebhookDeliveredAt: null,
        message: "1 generation jobs are waiting while no jobs are active.",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      }),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn()
    };
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery: {
        deliver: vi.fn().mockRejectedValue(new Error("Webhook timeout")),
        enabled: true
      },
      auditLogRepository,
      generationRequestRepository: {
        findOldestForOwnerUserId: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
        listRecentForOwnerUserIdSince: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
      },
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 0,
          completed: 3,
          delayed: 0,
          failed: 1,
          paused: 0,
          waiting: 1
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T09:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository,
      opsAlertRoutingPolicyRepository,
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryChannel: "webhook",
        deliveryState: "failed",
        failureMessage: "Webhook timeout"
      })
    );
    expect(opsAlertStateRepository.setLastDeliveredAt).toHaveBeenCalledWith({
      deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      deliveryChannel: "audit_log",
      id: "alert_state_1"
    });
    expect(opsAlertStateRepository.setLastDeliveredAt).not.toHaveBeenCalledWith({
      deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      deliveryChannel: "webhook",
      id: "alert_state_1"
    });
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 1,
      failedDeliveryCount: 1,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });

  it("suppresses alert delivery while an owner-scoped mute is active", async () => {
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const alertWebhookDelivery = {
      deliver: vi.fn().mockResolvedValue(undefined),
      enabled: true
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertStateRepository = {
      createActive: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstWebhookDeliveredAt: null,
        id: "alert_state_1",
        lastAuditLogDeliveredAt: null,
        lastDeliveredAt: null,
        lastWebhookDeliveredAt: null,
        message: "1 generation jobs are waiting while no jobs are active.",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      }),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn()
    };
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery,
      auditLogRepository,
      generationRequestRepository: {
        findOldestForOwnerUserId: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
        listRecentForOwnerUserIdSince: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
      },
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 0,
          completed: 3,
          delayed: 0,
          failed: 1,
          paused: 0,
          waiting: 1
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T09:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository: {
        listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([
          {
            code: "QUEUE_STALLED",
            id: "mute_1",
            mutedUntil: new Date("2026-04-07T10:00:00.000Z")
          }
        ])
      },
      opsAlertRoutingPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(auditLogRepository.create).not.toHaveBeenCalled();
    expect(alertWebhookDelivery.deliver).not.toHaveBeenCalled();
    expect(opsAlertDeliveryRepository.create).not.toHaveBeenCalled();
    expect(opsAlertStateRepository.setLastDeliveredAt).not.toHaveBeenCalled();
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 0,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });

  it("suppresses webhook delivery outside the owner-scoped schedule while keeping audit-log delivery", async () => {
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const alertWebhookDelivery = {
      deliver: vi.fn().mockResolvedValue(undefined),
      enabled: true
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertStateRepository = {
      createActive: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "QUEUE_STALLED",
        firstWebhookDeliveredAt: null,
        id: "alert_state_1",
        lastAuditLogDeliveredAt: null,
        lastDeliveredAt: null,
        lastWebhookDeliveredAt: null,
        message: "1 generation jobs are waiting while no jobs are active.",
        severity: "critical",
        status: "active",
        title: "The generation queue appears stalled."
      }),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn()
    };
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery,
      auditLogRepository,
      generationRequestRepository: {
        findOldestForOwnerUserId: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
        listRecentForOwnerUserIdSince: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
      },
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 0,
          completed: 3,
          delayed: 0,
          failed: 1,
          paused: 0,
          waiting: 1
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T22:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository: {
        listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
      },
      opsAlertRoutingPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue({
          activeDaysMask: 62,
          endMinuteOfDay: 1020,
          startMinuteOfDay: 540,
          timezone: "America/New_York"
        })
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(alertWebhookDelivery.deliver).not.toHaveBeenCalled();
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledTimes(1);
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryChannel: "audit_log",
        deliveryState: "delivered"
      })
    );
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 1,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });

  it("limits webhook delivery to critical alerts when routing policy is critical-only", async () => {
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const alertWebhookDelivery = {
      deliver: vi.fn().mockResolvedValue(undefined),
      enabled: true
    };
    const opsAlertDeliveryRepository = {
      create: vi.fn().mockResolvedValue({})
    };
    const opsAlertStateRepository = {
      createActive: vi.fn().mockResolvedValue({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        code: "OWNER_QUEUE_AGE_WARNING",
        firstWebhookDeliveredAt: null,
        id: "alert_state_1",
        lastAuditLogDeliveredAt: null,
        lastDeliveredAt: null,
        lastWebhookDeliveredAt: null,
        message: "The oldest queued owner-scoped request has waited 600s.",
        severity: "warning",
        status: "active",
        title: "Queued owner-scoped generation work is older than expected."
      }),
      listActiveByOwnerUserId: vi.fn().mockResolvedValue([]),
      listByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([]),
      markResolved: vi.fn(),
      setLastDeliveredAt: vi.fn().mockResolvedValue({}),
      update: vi.fn()
    };
    const service = createOpsObservabilityCaptureService({
      alertWebhookDelivery,
      auditLogRepository,
      generationRequestRepository: {
        findOldestForOwnerUserId: vi
          .fn()
          .mockResolvedValueOnce({
            _count: {
              generatedAssets: 0
            },
            completedAt: null,
            createdAt: new Date("2026-04-07T08:50:00.000Z"),
            failedAt: null,
            id: "queued_1",
            resultJson: null,
            startedAt: null,
            status: "queued"
          })
          .mockResolvedValueOnce(null),
        listDistinctOwnerUserIds: vi.fn().mockResolvedValue(["user_1"]),
        listRecentForOwnerUserIdSince: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
      },
      loadBackendReadiness: vi.fn().mockResolvedValue({
        message: "ComfyUI API responded to the readiness probe.",
        status: "ready"
      }),
      loadQueueSnapshot: vi.fn().mockResolvedValue({
        concurrency: 1,
        counts: {
          active: 1,
          completed: 3,
          delayed: 0,
          failed: 0,
          paused: 0,
          waiting: 0
        },
        message: "Generation dispatch queue metrics loaded from Redis.",
        status: "ok",
        workerAdapter: "http_backend"
      }),
      logger: createLogger(),
      now: () => new Date("2026-04-07T09:00:00.000Z"),
      opsAlertEscalationPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertMuteRepository: {
        listActiveByOwnerUserIdAndCodes: vi.fn().mockResolvedValue([])
      },
      opsAlertRoutingPolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue({
          webhookEnabled: true,
          webhookMinimumSeverity: "critical"
        })
      },
      opsAlertSchedulePolicyRepository: {
        findByOwnerUserId: vi.fn().mockResolvedValue(null)
      },
      opsAlertDeliveryRepository,
      opsAlertStateRepository,
      opsObservabilityCaptureRepository: {
        create: vi.fn().mockResolvedValue({
          id: "capture_1"
        })
      }
    });

    const summary = await service.captureAllOwnerObservability();

    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(alertWebhookDelivery.deliver).not.toHaveBeenCalled();
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledTimes(1);
    expect(opsAlertDeliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryChannel: "audit_log",
        deliveryState: "delivered"
      })
    );
    expect(summary).toEqual({
      captureCount: 1,
      deliveredAlertCount: 1,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
  });
});
