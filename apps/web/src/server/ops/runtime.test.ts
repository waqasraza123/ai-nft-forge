import { describe, expect, it, vi } from "vitest";

import { loadOpsRuntime } from "./runtime";

describe("loadOpsRuntime", () => {
  it("marks the generation backend as unconfigured when the URL is absent", async () => {
    const runtime = await loadOpsRuntime({
      fetchFn: vi.fn<typeof fetch>(),
      now: () => new Date("2026-04-06T12:00:00.000Z"),
      rawEnvironment: {} as unknown as NodeJS.ProcessEnv,
      resolveSession: vi.fn().mockResolvedValue(null)
    });

    expect(runtime.generationBackend.health).toMatchObject({
      status: "unconfigured"
    });
    expect(runtime.generationBackend.readiness).toMatchObject({
      status: "unconfigured"
    });
    expect(runtime.operator.session).toBeNull();
    expect(runtime.operator.queue).toBeNull();
    expect(runtime.operator.activity).toBeNull();
    expect(runtime.operator.alertEscalation).toBeNull();
    expect(runtime.operator.alertRouting).toBeNull();
    expect(runtime.operator.alertSchedule).toBeNull();
    expect(runtime.operator.captureAutomation).toBeNull();
    expect(runtime.operator.history).toBeNull();
    expect(runtime.operator.observability).toBeNull();
  });

  it("loads generation backend diagnostics plus authenticated operator signals", async () => {
    const rawEnvironment = {
      GENERATION_BACKEND_URL: "http://127.0.0.1:8787/generate",
      OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: "300",
      OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: "15",
      OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: "600",
      OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: "true",
      OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: "true"
    } as unknown as NodeJS.ProcessEnv;
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            bindHost: "127.0.0.1",
            port: 8787,
            provider: {
              baseUrl: "http://127.0.0.1:8188",
              checkpointName: "flux.safetensors",
              kind: "comfyui",
              mode: "remote_comfyui",
              workflowSource: "embedded_default"
            },
            readinessTimeoutMs: 5000,
            service: "forge-backend",
            status: "ok",
            uptimeSeconds: 12.3
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            provider: {
              baseUrl: "http://127.0.0.1:8188",
              checkpointName: "flux.safetensors",
              kind: "comfyui",
              mode: "remote_comfyui",
              workflowSource: "embedded_default"
            },
            probe: {
              checkedAt: "2026-04-06T12:00:00.000Z",
              latencyMs: 45,
              message: "ComfyUI API responded to the readiness probe.",
              status: "ready"
            },
            service: "forge-backend",
            status: "ready",
            uptimeSeconds: 12.3
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      );
    const resolveSession = vi.fn().mockResolvedValue({
      expiresAt: "2026-04-07T12:00:00.000Z",
      user: {
        avatarUrl: null,
        displayName: null,
        id: "user_1",
        walletAddress: "0x1111111111111111111111111111111111111111"
      }
    });
    const loadQueueSnapshot = vi.fn().mockResolvedValue({
      checkedAt: "2026-04-06T12:00:00.000Z",
      concurrency: 2,
      counts: {
        active: 1,
        completed: 4,
        delayed: 0,
        failed: 1,
        paused: 0,
        waiting: 2
      },
      message: "Generation dispatch queue metrics loaded from Redis.",
      queueName: "generation-dispatch",
      service: "ai-nft-forge-worker",
      status: "ok",
      workerAdapter: "http_backend"
    });
    const loadOperatorActivity = vi.fn().mockResolvedValue({
      active: [
        {
          completedAt: null,
          createdAt: "2026-04-06T11:58:00.000Z",
          failedAt: null,
          failureCode: null,
          failureMessage: null,
          generatedAssetCount: 0,
          id: "generation_1",
          pipelineKey: "collectible-portrait-v1",
          queueJobId: "generation_1",
          requestedVariantCount: 4,
          sourceAsset: {
            id: "asset_1",
            originalFilename: "portrait.png",
            status: "uploaded"
          },
          startedAt: "2026-04-06T11:59:00.000Z",
          status: "running",
          storedAssetCount: 0
        }
      ],
      message: "Recent generation activity loaded from PostgreSQL.",
      retryableFailures: [],
      status: "ok"
    });
    const loadOperatorAlertRouting = vi.fn().mockResolvedValue({
      message:
        "Webhook delivery is limited to critical alerts for this operator.",
      policy: {
        id: "routing_1",
        source: "owner_override",
        updatedAt: "2026-04-06T11:57:00.000Z",
        webhookMode: "critical_only"
      },
      status: "configured",
      webhookConfigured: true
    });
    const loadOperatorAlertEscalation = vi.fn().mockResolvedValue({
      message:
        "Webhook reminders will resend active unacknowledged alerts after 1 hour and every 3 hours after that.",
      policy: {
        firstReminderDelayMinutes: 60,
        id: "escalation_1",
        repeatReminderIntervalMinutes: 180,
        source: "owner_override",
        updatedAt: "2026-04-06T11:55:00.000Z"
      },
      status: "configured",
      webhookConfigured: true
    });
    const loadOperatorAlertSchedule = vi.fn().mockResolvedValue({
      localTimeLabel: "Mon 08:00",
      message:
        "Webhook delivery is currently outside the scheduled window for this operator (weekdays 09:00-17:00 America/New_York).",
      policy: {
        activeDays: ["mon", "tue", "wed", "thu", "fri"],
        endMinuteOfDay: 1020,
        id: "schedule_1",
        source: "owner_override",
        startMinuteOfDay: 540,
        timezone: "America/New_York",
        updatedAt: "2026-04-06T11:56:00.000Z"
      },
      status: "inactive",
      webhookConfigured: true
    });
    const loadOperatorObservability = vi.fn().mockResolvedValue({
      alerts: [],
      checkedAt: "2026-04-06T12:00:00.000Z",
      message: "Recent operator metrics and runtime alerts look healthy.",
      oldestQueuedAgeSeconds: null,
      oldestRunningAgeSeconds: 120,
      status: "ok",
      windows: [
        {
          averageCompletionSeconds: 180,
          checkedAt: "2026-04-06T12:00:00.000Z",
          failedCount: 0,
          from: "2026-04-06T11:00:00.000Z",
          label: "Last hour",
          maxCompletionSeconds: 180,
          queuedCount: 0,
          runningCount: 1,
          storedAssetCount: 4,
          succeededCount: 1,
          successRatePercent: 100,
          totalCount: 2,
          windowKey: "1h"
        }
      ]
    });
    const loadOperatorHistory = vi.fn().mockResolvedValue({
      activeAlerts: [
        {
          acknowledgedAt: null,
          acknowledgedByUserId: null,
          code: "QUEUE_STALLED",
          firstObservedAt: "2026-04-06T11:30:00.000Z",
          id: "alert_state_1",
          lastDeliveredAt: "2026-04-06T11:56:00.000Z",
          lastObservedAt: "2026-04-06T11:56:00.000Z",
          message: "2 generation jobs are waiting while no jobs are active.",
          mutedUntil: "2026-04-06T13:00:00.000Z",
          severity: "critical",
          status: "active",
          title: "The generation queue appears stalled."
        }
      ],
      activeMutes: [
        {
          code: "QUEUE_STALLED",
          id: "mute_1",
          mutedUntil: "2026-04-06T13:00:00.000Z"
        }
      ],
      captures: [
        {
          backendReadinessMessage:
            "ComfyUI API responded to the readiness probe.",
          backendReadinessStatus: "ready",
          capturedAt: "2026-04-06T11:56:00.000Z",
          criticalAlertCount: 0,
          id: "capture_1",
          observabilityMessage:
            "Recent operator metrics and runtime alerts look healthy.",
          observabilityStatus: "ok",
          oldestQueuedAgeSeconds: null,
          oldestRunningAgeSeconds: 90,
          queueCounts: {
            active: 1,
            completed: 4,
            delayed: 0,
            failed: 1,
            paused: 0,
            waiting: 2
          },
          queueStatus: "ok",
          warningAlertCount: 0,
          windows: [
            {
              averageCompletionSeconds: 180,
              checkedAt: "2026-04-06T10:00:00.000Z",
              failedCount: 0,
              from: "2026-04-06T09:00:00.000Z",
              label: "Last hour",
              maxCompletionSeconds: 180,
              queuedCount: 0,
              runningCount: 1,
              storedAssetCount: 4,
              succeededCount: 1,
              successRatePercent: 100,
              totalCount: 2,
              windowKey: "1h"
            }
          ],
          workerAdapter: "http_backend"
        }
      ],
      deliveries: [],
      message:
        "Persisted observability captures and alert deliveries loaded from PostgreSQL.",
      status: "ok"
    });
    const runtime = await loadOpsRuntime({
      fetchFn,
      loadOperatorActivity,
      loadOperatorAlertEscalation,
      loadOperatorAlertRouting,
      loadOperatorAlertSchedule,
      loadOperatorHistory,
      loadOperatorObservability,
      loadQueueSnapshot,
      now: () => new Date("2026-04-06T12:00:00.000Z"),
      rawEnvironment,
      resolveSession
    });

    expect(runtime.generationBackend.endpoints).toMatchObject({
      generateUrl: "http://127.0.0.1:8787/generate",
      healthUrl: "http://127.0.0.1:8787/health",
      readinessUrl: "http://127.0.0.1:8787/ready"
    });
    expect(runtime.generationBackend.health).toMatchObject({
      status: "ok"
    });
    expect(runtime.generationBackend.readiness).toMatchObject({
      status: "ready"
    });
    expect(loadQueueSnapshot).toHaveBeenCalledWith({
      checkedAt: "2026-04-06T12:00:00.000Z",
      rawEnvironment
    });
    expect(loadOperatorActivity).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      rawEnvironment
    });
    expect(loadOperatorAlertEscalation).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      rawEnvironment
    });
    expect(loadOperatorAlertRouting).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      rawEnvironment
    });
    expect(loadOperatorAlertSchedule).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      rawEnvironment,
      referenceTime: new Date("2026-04-06T12:00:00.000Z")
    });
    expect(loadOperatorHistory).toHaveBeenCalledWith({
      ownerUserId: "user_1",
      rawEnvironment
    });
    expect(loadOperatorObservability).toHaveBeenCalledWith({
      checkedAt: "2026-04-06T12:00:00.000Z",
      generationBackendReadiness: expect.objectContaining({
        status: "ready"
      }),
      ownerUserId: "user_1",
      queueSnapshot: expect.objectContaining({
        status: "ok"
      }),
      rawEnvironment,
      referenceTime: new Date("2026-04-06T12:00:00.000Z")
    });
    expect(runtime.operator.session?.user.id).toBe("user_1");
    expect(runtime.operator.queue).toMatchObject({
      status: "ok"
    });
    expect(runtime.operator.activity).toMatchObject({
      active: [
        expect.objectContaining({
          id: "generation_1",
          status: "running"
        })
      ],
      status: "ok"
    });
    expect(runtime.operator.alertRouting).toMatchObject({
      policy: {
        id: "routing_1",
        webhookMode: "critical_only"
      },
      status: "configured",
      webhookConfigured: true
    });
    expect(runtime.operator.alertEscalation).toMatchObject({
      policy: {
        firstReminderDelayMinutes: 60,
        id: "escalation_1",
        repeatReminderIntervalMinutes: 180
      },
      status: "configured",
      webhookConfigured: true
    });
    expect(runtime.operator.alertSchedule).toMatchObject({
      policy: {
        id: "schedule_1",
        timezone: "America/New_York"
      },
      status: "inactive",
      webhookConfigured: true
    });
    expect(runtime.operator.captureAutomation).toMatchObject({
      enabled: true,
      intervalSeconds: 300,
      lastCapturedAt: "2026-04-06T11:56:00.000Z",
      status: "healthy"
    });
    expect(runtime.operator.history).toMatchObject({
      activeAlerts: [
        expect.objectContaining({
          id: "alert_state_1",
          mutedUntil: "2026-04-06T13:00:00.000Z",
          status: "active"
        })
      ],
      activeMutes: [
        expect.objectContaining({
          code: "QUEUE_STALLED",
          id: "mute_1"
        })
      ],
      captures: [
        expect.objectContaining({
          id: "capture_1"
        })
      ],
      status: "ok"
    });
    expect(runtime.operator.observability).toMatchObject({
      status: "ok"
    });
  });
});
