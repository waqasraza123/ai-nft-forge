import { randomUUID } from "node:crypto";

import type { Redis } from "ioredis";

import type { WorkerEnv } from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

const observabilitySchedulerLockKey = "ai-nft-forge:ops-observability-capture";
const reconciliationSchedulerLockKey = "ai-nft-forge:ops-reconciliation";
const releaseSchedulerLockScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

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

type TimeoutHandle = ReturnType<typeof setTimeout>;

type SharedScheduler = {
  close: () => Promise<void>;
};

type StartScheduledRunnerDependencies<TSummary> = {
  enabled: boolean;
  intervalSeconds: number;
  jitterSeconds: number;
  leaseFailureMessage: string;
  lockKey: string;
  lockTtlSeconds: number;
  logger: Logger;
  redisConnection: Pick<Redis, "eval" | "set">;
  run: () => Promise<TSummary>;
  runLabel: string;
  runOnStart: boolean;
  random?: (() => number) | undefined;
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

async function acquireSchedulerLock(input: {
  lockKey: string;
  lockTtlSeconds: number;
  redisConnection: Pick<Redis, "set">;
  token: string;
}) {
  const result = await input.redisConnection.set(
    input.lockKey,
    input.token,
    "PX",
    input.lockTtlSeconds * 1000,
    "NX"
  );

  return result === "OK";
}

async function releaseSchedulerLock(input: {
  lockKey: string;
  redisConnection: Pick<Redis, "eval">;
  token: string;
}) {
  await input.redisConnection.eval(
    releaseSchedulerLockScript,
    1,
    input.lockKey,
    input.token
  );
}

function startScheduledRunner<TSummary>({
  enabled,
  intervalSeconds,
  jitterSeconds,
  leaseFailureMessage,
  lockKey,
  lockTtlSeconds,
  logger,
  redisConnection,
  run,
  runLabel,
  runOnStart,
  random = Math.random
}: StartScheduledRunnerDependencies<TSummary>): SharedScheduler {
  if (!enabled) {
    logger.info(`${runLabel} scheduler disabled`);

    return {
      async close() {}
    };
  }

  const baseIntervalMs = intervalSeconds * 1000;
  const jitterMs = jitterSeconds * 1000;
  let closed = false;
  let activeRun: Promise<void> | null = null;
  let scheduledTimer: TimeoutHandle | null = null;

  const clearScheduledTimer = () => {
    if (scheduledTimer) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }
  };

  const createScheduledDelayMs = () => {
    if (jitterMs <= 0) {
      return baseIntervalMs;
    }

    return baseIntervalMs + Math.round(random() * jitterMs);
  };

  const scheduleNextRun = (delayMs: number) => {
    if (closed) {
      return;
    }

    clearScheduledTimer();
    scheduledTimer = setTimeout(
      () => {
        scheduledTimer = null;
        void runScheduledTask();
      },
      Math.max(0, delayMs)
    );
  };

  const runScheduledTask = async () => {
    if (closed || activeRun) {
      return;
    }

    activeRun = (async () => {
      const token = randomUUID();

      try {
        const lockAcquired = await acquireSchedulerLock({
          lockKey,
          lockTtlSeconds,
          redisConnection,
          token
        });

        if (!lockAcquired) {
          logger.debug(leaseFailureMessage);
          return;
        }

        logger.info(`Running scheduled ${runLabel}`, {
          intervalSeconds
        });

        const summary = await run();

        logger.info(
          `Scheduled ${runLabel} completed`,
          summary as Record<string, unknown>
        );
      } catch (error) {
        logger.error(`Scheduled ${runLabel} failed`, {
          error:
            error instanceof Error
              ? error.message
              : `Unknown ${runLabel} scheduler error`
        });
      } finally {
        try {
          await releaseSchedulerLock({
            lockKey,
            redisConnection,
            token
          });
        } catch (error) {
          logger.warn(`Could not release ${runLabel} lease`, {
            error:
              error instanceof Error
                ? error.message
                : `Unknown ${runLabel} lease release error`
          });
        }
      }
    })().finally(() => {
      activeRun = null;
      scheduleNextRun(createScheduledDelayMs());
    });

    await activeRun;
  };

  logger.info(`${runLabel} scheduler started`, {
    intervalSeconds,
    jitterSeconds,
    lockTtlSeconds,
    runOnStart
  });

  scheduleNextRun(runOnStart ? 0 : createScheduledDelayMs());

  return {
    async close() {
      closed = true;
      clearScheduledTimer();
      await activeRun;
      logger.info(`${runLabel} scheduler stopped`);
    }
  };
}

export function startOpsObservabilityCaptureScheduler({
  capture,
  env,
  logger,
  random,
  redisConnection
}: StartOpsObservabilityCaptureSchedulerDependencies): SharedScheduler {
  return startScheduledRunner({
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
  return startScheduledRunner({
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
