import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startWorkspaceLifecycleAutomationScheduler } from "./automation-scheduler.js";

function createWorkerEnv(overrides: Record<string, unknown> = {}) {
  return {
    COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY: 1,
    GENERATION_ADAPTER_KIND: "storage_copy" as const,
    GENERATION_BACKEND_TIMEOUT_MS: 30000,
    GENERATION_QUEUE_CONCURRENCY: 1,
    LOG_LEVEL: "info" as const,
    NOOP_QUEUE_CONCURRENCY: 1,
    OPS_ALERT_WEBHOOK_ENABLED: false,
    OPS_ALERT_WEBHOOK_TIMEOUT_MS: 5000,
    OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: 300,
    OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: 15,
    OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: 600,
    OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: true,
    OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: false,
    OPS_RECONCILIATION_INTERVAL_SECONDS: 300,
    OPS_RECONCILIATION_JITTER_SECONDS: 15,
    OPS_RECONCILIATION_LOCK_TTL_SECONDS: 600,
    OPS_RECONCILIATION_RUN_ON_START: true,
    OPS_RECONCILIATION_SCHEDULE_ENABLED: false,
    REDIS_URL: "redis://127.0.0.1:56379",
    WORKER_SERVICE_NAME: "ai-nft-forge-worker",
    WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS: 300,
    WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS: 15,
    WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS: 600,
    WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START: true,
    WORKSPACE_LIFECYCLE_AUTOMATION_SCHEDULE_ENABLED: false,
    WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY: 1,
    WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: false,
    WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: 5000,
    ...overrides
  };
}

function createLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

describe("startWorkspaceLifecycleAutomationScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not schedule automation when disabled", async () => {
    const runAutomation = vi.fn();
    const scheduler = startWorkspaceLifecycleAutomationScheduler({
      env: createWorkerEnv(),
      logger: createLogger(),
      redisConnection: {
        eval: vi.fn(),
        set: vi.fn()
      },
      runAutomation
    });

    await vi.runAllTimersAsync();

    expect(runAutomation).not.toHaveBeenCalled();

    await scheduler.close();
  });

  it("runs on start with lease coordination", async () => {
    const logger = createLogger();
    const redisConnection = {
      eval: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue("OK")
    };
    const runAutomation = vi.fn().mockResolvedValue({
      decommissionNoticeCount: 1,
      failedWorkspaceCount: 0,
      invitationReminderCount: 2,
      workspaceCount: 3
    });
    const scheduler = startWorkspaceLifecycleAutomationScheduler({
      env: createWorkerEnv({
        WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS: 0,
        WORKSPACE_LIFECYCLE_AUTOMATION_SCHEDULE_ENABLED: true
      }),
      logger,
      random: () => 0,
      redisConnection,
      runAutomation
    });

    await vi.runOnlyPendingTimersAsync();

    expect(redisConnection.set).toHaveBeenCalledTimes(1);
    expect(runAutomation).toHaveBeenCalledTimes(1);
    expect(redisConnection.eval).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300000);

    expect(runAutomation).toHaveBeenCalledTimes(2);

    await scheduler.close();
    expect(logger.info).toHaveBeenCalledWith(
      "workspace lifecycle automation scheduler stopped"
    );
  });
});
