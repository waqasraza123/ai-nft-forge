import type { Redis } from "ioredis";

import type { WorkerEnv } from "@ai-nft-forge/shared";

import {
  startScheduledLeaseRunner,
  type SharedScheduler
} from "../lib/scheduled-runner.js";
import type { Logger } from "../lib/logger.js";
import type { WorkspaceLifecycleAutomationSummary } from "./automation-service.js";

const workspaceLifecycleAutomationLockKey =
  "ai-nft-forge:workspace-lifecycle-automation";

type StartWorkspaceLifecycleAutomationSchedulerDependencies = {
  env: WorkerEnv;
  logger: Logger;
  random?: () => number;
  redisConnection: Pick<Redis, "eval" | "set">;
  runAutomation: () => Promise<WorkspaceLifecycleAutomationSummary>;
};

export function startWorkspaceLifecycleAutomationScheduler({
  env,
  logger,
  random,
  redisConnection,
  runAutomation
}: StartWorkspaceLifecycleAutomationSchedulerDependencies): SharedScheduler {
  return startScheduledLeaseRunner({
    enabled: env.WORKSPACE_LIFECYCLE_AUTOMATION_SCHEDULE_ENABLED,
    intervalSeconds: env.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
    jitterSeconds: env.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
    leaseFailureMessage:
      "Skipping scheduled workspace lifecycle automation because another worker holds the lease",
    lockKey: workspaceLifecycleAutomationLockKey,
    lockTtlSeconds: env.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
    logger,
    random,
    redisConnection,
    run: runAutomation,
    runLabel: "workspace lifecycle automation",
    runOnStart: env.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START
  });
}
