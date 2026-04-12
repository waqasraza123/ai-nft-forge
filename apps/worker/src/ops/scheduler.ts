import type { Redis } from "ioredis";

import type { WorkerEnv } from "@ai-nft-forge/shared";

import {
  startScheduledLeaseRunner,
  type SharedScheduler
} from "../lib/scheduled-runner.js";
import type { Logger } from "../lib/logger.js";

const observabilitySchedulerLockKey = "ai-nft-forge:ops-observability-capture";
const reconciliationSchedulerLockKey = "ai-nft-forge:ops-reconciliation";

type CaptureSummary = {
  captureCount: number;
  deliveredAlertCount: number;
  failedDeliveryCount: number;
  ownerCount: number;
  resolvedAlertCount: number;
};

type ReconciliationSummary = {
  failedRunCount: number;
  issueCount: number;
  ownerCount: number;
  runCount: number;
};

type StartOpsObservabilityCaptureSchedulerDependencies = {
  capture: () => Promise<CaptureSummary>;
  env: WorkerEnv;
  logger: Logger;
  random?: () => number;
  redisConnection: Pick<Redis, "eval" | "set">;
};

type StartOpsReconciliationSchedulerDependencies = {
  env: WorkerEnv;
  logger: Logger;
  random?: () => number;
  reconcile: () => Promise<ReconciliationSummary>;
  redisConnection: Pick<Redis, "eval" | "set">;
};

export function startOpsObservabilityCaptureScheduler({
  capture,
  env,
  logger,
  random,
  redisConnection
}: StartOpsObservabilityCaptureSchedulerDependencies): SharedScheduler {
  return startScheduledLeaseRunner({
    enabled: env.OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED,
    intervalSeconds: env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
    jitterSeconds: env.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
    leaseFailureMessage:
      "Skipping scheduled ops observability capture because another worker holds the lease",
    lockKey: observabilitySchedulerLockKey,
    lockTtlSeconds: env.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
    logger,
    random,
    redisConnection,
    run: capture,
    runLabel: "ops observability capture",
    runOnStart: env.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START
  });
}

export function startOpsReconciliationScheduler({
  env,
  logger,
  random,
  reconcile,
  redisConnection
}: StartOpsReconciliationSchedulerDependencies): SharedScheduler {
  return startScheduledLeaseRunner({
    enabled: env.OPS_RECONCILIATION_SCHEDULE_ENABLED,
    intervalSeconds: env.OPS_RECONCILIATION_INTERVAL_SECONDS,
    jitterSeconds: env.OPS_RECONCILIATION_JITTER_SECONDS,
    leaseFailureMessage:
      "Skipping scheduled ops reconciliation because another worker holds the lease",
    lockKey: reconciliationSchedulerLockKey,
    lockTtlSeconds: env.OPS_RECONCILIATION_LOCK_TTL_SECONDS,
    logger,
    random,
    redisConnection,
    run: reconcile,
    runLabel: "ops reconciliation",
    runOnStart: env.OPS_RECONCILIATION_RUN_ON_START
  });
}
