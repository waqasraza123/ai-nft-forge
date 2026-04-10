import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  startOpsObservabilityCaptureScheduler,
  startOpsReconciliationScheduler
} from "./scheduler.js";

function createLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

describe("startOpsObservabilityCaptureScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not schedule captures when automation is disabled", async () => {
    const capture = vi.fn();
    const scheduler = startOpsObservabilityCaptureScheduler({
      capture,
      env: {
        GENERATION_ADAPTER_KIND: "storage_copy",
        GENERATION_BACKEND_TIMEOUT_MS: 30000,
        GENERATION_QUEUE_CONCURRENCY: 1,
        LOG_LEVEL: "info",
        NOOP_QUEUE_CONCURRENCY: 1,
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
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      logger: createLogger(),
      redisConnection: {
        eval: vi.fn(),
        set: vi.fn()
      }
    });

    await vi.runAllTimersAsync();

    expect(capture).not.toHaveBeenCalled();

    await scheduler.close();
  });

  it("runs on start and schedules the next capture with a lease", async () => {
    const capture = vi.fn().mockResolvedValue({
      captureCount: 1,
      deliveredAlertCount: 0,
      failedDeliveryCount: 0,
      ownerCount: 1,
      resolvedAlertCount: 0
    });
    const logger = createLogger();
    const redisConnection = {
      eval: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue("OK")
    };
    const scheduler = startOpsObservabilityCaptureScheduler({
      capture,
      env: {
        GENERATION_ADAPTER_KIND: "storage_copy",
        GENERATION_BACKEND_TIMEOUT_MS: 30000,
        GENERATION_QUEUE_CONCURRENCY: 1,
        LOG_LEVEL: "info",
        NOOP_QUEUE_CONCURRENCY: 1,
        OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: 300,
        OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: 15,
        OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: 600,
        OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: true,
        OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: true,
        OPS_RECONCILIATION_INTERVAL_SECONDS: 300,
        OPS_RECONCILIATION_JITTER_SECONDS: 15,
        OPS_RECONCILIATION_LOCK_TTL_SECONDS: 600,
        OPS_RECONCILIATION_RUN_ON_START: true,
        OPS_RECONCILIATION_SCHEDULE_ENABLED: false,
        REDIS_URL: "redis://127.0.0.1:56379",
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      logger,
      random: () => 0,
      redisConnection
    });

    await vi.runOnlyPendingTimersAsync();

    expect(redisConnection.set).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(redisConnection.eval).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300000);

    expect(capture).toHaveBeenCalledTimes(2);

    await scheduler.close();
    expect(logger.info).toHaveBeenCalledWith(
      "ops observability capture scheduler stopped"
    );
  });

  it("skips capture when another worker holds the lease", async () => {
    const capture = vi.fn();
    const logger = createLogger();
    const scheduler = startOpsObservabilityCaptureScheduler({
      capture,
      env: {
        GENERATION_ADAPTER_KIND: "storage_copy",
        GENERATION_BACKEND_TIMEOUT_MS: 30000,
        GENERATION_QUEUE_CONCURRENCY: 1,
        LOG_LEVEL: "info",
        NOOP_QUEUE_CONCURRENCY: 1,
        OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: 300,
        OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: 0,
        OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: 600,
        OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: true,
        OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: true,
        OPS_RECONCILIATION_INTERVAL_SECONDS: 300,
        OPS_RECONCILIATION_JITTER_SECONDS: 15,
        OPS_RECONCILIATION_LOCK_TTL_SECONDS: 600,
        OPS_RECONCILIATION_RUN_ON_START: true,
        OPS_RECONCILIATION_SCHEDULE_ENABLED: false,
        REDIS_URL: "redis://127.0.0.1:56379",
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      logger,
      redisConnection: {
        eval: vi.fn().mockResolvedValue(0),
        set: vi.fn().mockResolvedValue(null)
      }
    });

    await vi.runOnlyPendingTimersAsync();

    expect(capture).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      "Skipping scheduled ops observability capture because another worker holds the lease"
    );

    await scheduler.close();
  });

  it("runs scheduled reconciliation with the same lease coordination model", async () => {
    const reconcile = vi.fn().mockResolvedValue({
      failedRunCount: 0,
      issueCount: 2,
      ownerCount: 1,
      runCount: 1
    });
    const logger = createLogger();
    const redisConnection = {
      eval: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue("OK")
    };
    const scheduler = startOpsReconciliationScheduler({
      env: {
        GENERATION_ADAPTER_KIND: "storage_copy",
        GENERATION_BACKEND_TIMEOUT_MS: 30000,
        GENERATION_QUEUE_CONCURRENCY: 1,
        LOG_LEVEL: "info",
        NOOP_QUEUE_CONCURRENCY: 1,
        OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: 300,
        OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: 15,
        OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: 600,
        OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: true,
        OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: false,
        OPS_RECONCILIATION_INTERVAL_SECONDS: 300,
        OPS_RECONCILIATION_JITTER_SECONDS: 0,
        OPS_RECONCILIATION_LOCK_TTL_SECONDS: 600,
        OPS_RECONCILIATION_RUN_ON_START: true,
        OPS_RECONCILIATION_SCHEDULE_ENABLED: true,
        REDIS_URL: "redis://127.0.0.1:56379",
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      logger,
      random: () => 0,
      reconcile,
      redisConnection
    });

    await vi.runOnlyPendingTimersAsync();

    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(redisConnection.set).toHaveBeenCalledTimes(1);

    await scheduler.close();
    expect(logger.info).toHaveBeenCalledWith("ops reconciliation scheduler stopped");
  });
});
