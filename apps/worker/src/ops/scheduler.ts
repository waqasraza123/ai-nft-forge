import { randomUUID } from "node:crypto";

import type { Redis } from "ioredis";

import type { WorkerEnv } from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

const captureSchedulerLockKey = "ai-nft-forge:ops-observability-capture";
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

type TimeoutHandle = ReturnType<typeof setTimeout>;

type OpsObservabilityCaptureScheduler = {
  close: () => Promise<void>;
};

type StartOpsObservabilityCaptureSchedulerDependencies = {
  capture: () => Promise<CaptureSummary>;
  env: WorkerEnv;
  logger: Logger;
  random?: () => number;
  redisConnection: Pick<Redis, "eval" | "set">;
};

async function acquireSchedulerLock(input: {
  env: WorkerEnv;
  redisConnection: Pick<Redis, "set">;
  token: string;
}) {
  const result = await input.redisConnection.set(
    captureSchedulerLockKey,
    input.token,
    "PX",
    input.env.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS * 1000,
    "NX"
  );

  return result === "OK";
}

async function releaseSchedulerLock(input: {
  redisConnection: Pick<Redis, "eval">;
  token: string;
}) {
  await input.redisConnection.eval(
    releaseSchedulerLockScript,
    1,
    captureSchedulerLockKey,
    input.token
  );
}

export function startOpsObservabilityCaptureScheduler({
  capture,
  env,
  logger,
  random = Math.random,
  redisConnection
}: StartOpsObservabilityCaptureSchedulerDependencies): OpsObservabilityCaptureScheduler {
  if (!env.OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED) {
    logger.info("Ops observability capture scheduler disabled");

    return {
      async close() {}
    };
  }

  const baseIntervalMs = env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS * 1000;
  const jitterMs = env.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS * 1000;
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
        void runScheduledCapture();
      },
      Math.max(0, delayMs)
    );
  };

  const runScheduledCapture = async () => {
    if (closed || activeRun) {
      return;
    }

    activeRun = (async () => {
      const token = randomUUID();

      try {
        const lockAcquired = await acquireSchedulerLock({
          env,
          redisConnection,
          token
        });

        if (!lockAcquired) {
          logger.debug(
            "Skipping scheduled ops observability capture because another worker holds the lease"
          );
          return;
        }

        logger.info("Running scheduled ops observability capture", {
          intervalSeconds: env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS
        });

        const summary = await capture();

        logger.info("Scheduled ops observability capture completed", summary);
      } catch (error) {
        logger.error("Scheduled ops observability capture failed", {
          error:
            error instanceof Error
              ? error.message
              : "Unknown capture scheduler error"
        });
      } finally {
        try {
          await releaseSchedulerLock({
            redisConnection,
            token
          });
        } catch (error) {
          logger.warn("Could not release ops observability capture lease", {
            error:
              error instanceof Error
                ? error.message
                : "Unknown capture lease release error"
          });
        }
      }
    })().finally(() => {
      activeRun = null;
      scheduleNextRun(createScheduledDelayMs());
    });

    await activeRun;
  };

  logger.info("Ops observability capture scheduler started", {
    intervalSeconds: env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
    jitterSeconds: env.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
    lockTtlSeconds: env.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
    runOnStart: env.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START
  });

  scheduleNextRun(
    env.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START ? 0 : createScheduledDelayMs()
  );

  return {
    async close() {
      closed = true;
      clearScheduledTimer();
      await activeRun;
      logger.info("Ops observability capture scheduler stopped");
    }
  };
}
