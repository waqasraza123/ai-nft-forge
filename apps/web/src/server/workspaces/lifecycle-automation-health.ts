import {
  parseWorkerEnv,
  workspaceLifecycleAutomationHealthSchema,
  workspaceLifecycleAutomationRunSummarySchema,
  type WorkspaceLifecycleAutomationHealth,
  type WorkspaceLifecycleAutomationRunSummary
} from "@ai-nft-forge/shared";

type WorkspaceLifecycleAutomationRunRecord = {
  auditLogDeliveryCount: number;
  completedAt: Date | null;
  createdAt: Date;
  decommissionNoticeCount: number;
  failedWorkspaceCount: number;
  failureMessage: string | null;
  id: string;
  invitationReminderCount: number;
  startedAt: Date;
  status: "running" | "succeeded" | "failed";
  triggerSource: "manual" | "scheduled";
  updatedAt: Date;
  webhookQueuedCount: number;
  workspaceCount: number;
};

function createAgeSeconds(timestamp: Date, referenceTime: Date) {
  return Math.max(
    0,
    Math.round((referenceTime.getTime() - timestamp.getTime()) / 1000)
  );
}

export function serializeWorkspaceLifecycleAutomationRun(
  run: WorkspaceLifecycleAutomationRunRecord
): WorkspaceLifecycleAutomationRunSummary {
  return workspaceLifecycleAutomationRunSummarySchema.parse({
    auditLogDeliveryCount: run.auditLogDeliveryCount,
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    decommissionNoticeCount: run.decommissionNoticeCount,
    failedWorkspaceCount: run.failedWorkspaceCount,
    failureMessage: run.failureMessage,
    id: run.id,
    invitationReminderCount: run.invitationReminderCount,
    startedAt: run.startedAt.toISOString(),
    status: run.status,
    triggerSource: run.triggerSource,
    updatedAt: run.updatedAt.toISOString(),
    webhookQueuedCount: run.webhookQueuedCount,
    workspaceCount: run.workspaceCount
  });
}

export function createWorkspaceLifecycleAutomationHealth(input: {
  latestRun: WorkspaceLifecycleAutomationRunRecord | null;
  now: Date;
  rawEnvironment?: NodeJS.ProcessEnv;
}): WorkspaceLifecycleAutomationHealth {
  try {
    const workerEnv = parseWorkerEnv(input.rawEnvironment ?? process.env);
    const latestRun = input.latestRun
      ? serializeWorkspaceLifecycleAutomationRun(input.latestRun)
      : null;
    const lastRunAt = latestRun?.completedAt ?? latestRun?.startedAt ?? null;
    const lastRunAgeSeconds = lastRunAt
      ? createAgeSeconds(new Date(lastRunAt), input.now)
      : null;

    if (!workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_SCHEDULE_ENABLED) {
      return workspaceLifecycleAutomationHealthSchema.parse({
        enabled: false,
        intervalSeconds: null,
        jitterSeconds: null,
        lastRunAgeSeconds,
        lastRunAt,
        latestRun,
        lockTtlSeconds: null,
        message:
          "Automatic lifecycle scheduling is disabled. Record reminders and notices manually or run lifecycle automation directly.",
        runOnStart: null,
        status: "disabled"
      });
    }

    if (!latestRun || !lastRunAt || lastRunAgeSeconds === null) {
      return workspaceLifecycleAutomationHealthSchema.parse({
        enabled: true,
        intervalSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
        lastRunAgeSeconds: null,
        lastRunAt: null,
        latestRun,
        lockTtlSeconds:
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
        message:
          "Automatic lifecycle scheduling is enabled, but no persisted automation run has completed yet.",
        runOnStart: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START,
        status: "stale"
      });
    }

    const staleThresholdSeconds =
      workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS +
      workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS +
      Math.max(
        60,
        Math.round(
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS / 2
        )
      );

    if (latestRun.status === "running") {
      return workspaceLifecycleAutomationHealthSchema.parse({
        enabled: true,
        intervalSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
        lastRunAgeSeconds,
        lastRunAt,
        latestRun,
        lockTtlSeconds:
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
        message:
          lastRunAgeSeconds >
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS
            ? `Automatic lifecycle scheduling appears stuck; the latest run has been in progress for ${lastRunAgeSeconds}s.`
            : "Automatic lifecycle scheduling is running and the latest run is still in progress.",
        runOnStart: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START,
        status:
          lastRunAgeSeconds >
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS
            ? "warning"
            : "healthy"
      });
    }

    if (latestRun.status === "failed") {
      return workspaceLifecycleAutomationHealthSchema.parse({
        enabled: true,
        intervalSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
        lastRunAgeSeconds,
        lastRunAt,
        latestRun,
        lockTtlSeconds:
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
        message:
          latestRun.failureMessage ??
          "The latest lifecycle automation run failed and needs operator attention.",
        runOnStart: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START,
        status: "warning"
      });
    }

    if (lastRunAgeSeconds > staleThresholdSeconds) {
      return workspaceLifecycleAutomationHealthSchema.parse({
        enabled: true,
        intervalSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
        lastRunAgeSeconds,
        lastRunAt,
        latestRun,
        lockTtlSeconds:
          workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
        message: `Automatic lifecycle scheduling is enabled, but the most recent run is ${lastRunAgeSeconds}s old.`,
        runOnStart: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START,
        status: "stale"
      });
    }

    return workspaceLifecycleAutomationHealthSchema.parse({
      enabled: true,
      intervalSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_INTERVAL_SECONDS,
      jitterSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_JITTER_SECONDS,
      lastRunAgeSeconds,
      lastRunAt,
      latestRun,
      lockTtlSeconds: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_LOCK_TTL_SECONDS,
      message:
        "Automatic lifecycle scheduling is active and recent runs are arriving on schedule.",
      runOnStart: workerEnv.WORKSPACE_LIFECYCLE_AUTOMATION_RUN_ON_START,
      status: "healthy"
    });
  } catch (error) {
    return workspaceLifecycleAutomationHealthSchema.parse({
      enabled: false,
      intervalSeconds: null,
      jitterSeconds: null,
      lastRunAgeSeconds: null,
      lastRunAt: null,
      latestRun: null,
      lockTtlSeconds: null,
      message:
        error instanceof Error
          ? error.message
          : "Lifecycle automation health could not be evaluated.",
      runOnStart: null,
      status: "unreachable"
    });
  }
}
