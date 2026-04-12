import type { Logger } from "../lib/logger.js";

import {
  evaluateOpsAlertEscalationPolicy,
  evaluateOpsAlertSchedulePolicy,
  generationResultSummarySchema,
  parseOpsAlertScheduleDayMask
} from "@ai-nft-forge/shared";

type GenerationRequestStatus = "queued" | "running" | "succeeded" | "failed";

type GenerationActivityRecord = {
  _count: {
    generatedAssets: number;
  };
  completedAt: Date | null;
  createdAt: Date;
  failedAt: Date | null;
  id: string;
  resultJson: unknown;
  startedAt: Date | null;
  status: GenerationRequestStatus;
};

type OpsGenerationWindowSummary = {
  averageCompletionSeconds: number | null;
  capturedAt: string;
  failedCount: number;
  from: string;
  label: string;
  maxCompletionSeconds: number | null;
  queuedCount: number;
  runningCount: number;
  storedAssetCount: number;
  succeededCount: number;
  successRatePercent: number | null;
  totalCount: number;
  windowKey: "1h" | "24h";
};

type OpsOperatorAlertSummary = {
  code: string;
  message: string;
  severity: "critical" | "warning";
  title: string;
};

type BackendReadinessState = {
  message: string;
  status: "not_ready" | "ready" | "unconfigured" | "unreachable";
};

type QueueSnapshot =
  | {
      concurrency: number;
      counts: {
        active: number;
        completed: number;
        delayed: number;
        failed: number;
        paused: number;
        waiting: number;
      };
      message: string;
      status: "ok";
      workerAdapter: string;
    }
  | {
      concurrency: null;
      counts: null;
      message: string;
      status: "unreachable";
      workerAdapter: null;
    };

type OwnerGenerationMetrics = {
  message: string;
  oldestQueuedAgeSeconds: number | null;
  oldestRunningAgeSeconds: number | null;
  status: "ok" | "unreachable";
  windows: OpsGenerationWindowSummary[];
};

type CaptureSummary = {
  captureCount: number;
  deliveredAlertCount: number;
  failedDeliveryCount: number;
  ownerCount: number;
  resolvedAlertCount: number;
};

type OpsAlertDeliveryChannel = "audit_log" | "webhook";

type AlertMuteRecord = {
  code: string;
  id: string;
  mutedUntil: Date;
};

type AlertRoutingPolicyRecord = {
  webhookEnabled: boolean;
  webhookMinimumSeverity: "critical" | "warning";
};

type AlertEscalationPolicyRecord = {
  firstReminderDelayMinutes: number;
  repeatReminderIntervalMinutes: number;
};

type AlertSchedulePolicyRecord = {
  activeDaysMask: number;
  endMinuteOfDay: number;
  startMinuteOfDay: number;
  timezone: string;
};

type AlertStateRecord = {
  acknowledgedAt: Date | null;
  acknowledgedByUserId: string | null;
  code: string;
  firstWebhookDeliveredAt: Date | null;
  id: string;
  lastAuditLogDeliveredAt: Date | null;
  lastDeliveredAt: Date | null;
  lastWebhookDeliveredAt: Date | null;
  message: string;
  severity: "critical" | "warning";
  status: "active" | "resolved";
  title: string;
};

type OpsObservabilityCaptureServiceDependencies = {
  alertWebhookDelivery?: {
    deliver(input: {
      alert: OpsOperatorAlertSummary;
      captureId: string;
      deliveredAt: string;
      ownerUserId: string;
      workspaceId: string;
    }): Promise<void>;
    enabled: boolean;
  };
  auditLogRepository: {
    create(input: {
      action: string;
      actorId: string;
      actorType: string;
      entityId: string;
      entityType: string;
      metadataJson: unknown;
    }): Promise<unknown>;
  };
  generationRequestRepository: {
    findOldestForWorkspaceId?(input: {
      statuses: GenerationRequestStatus[];
      workspaceId: string;
    }): Promise<GenerationActivityRecord | null>;
    findOldestForOwnerUserId?(input: {
      ownerUserId: string;
      statuses: GenerationRequestStatus[];
    }): Promise<GenerationActivityRecord | null>;
    listDistinctOwnerUserIds?(): Promise<string[]>;
    listRecentForWorkspaceIdSince?(input: {
      since: Date;
      statuses?: GenerationRequestStatus[];
      workspaceId: string;
    }): Promise<GenerationActivityRecord[]>;
    listRecentForOwnerUserIdSince?(input: {
      ownerUserId: string;
      since: Date;
      statuses?: GenerationRequestStatus[];
    }): Promise<GenerationActivityRecord[]>;
  };
  loadBackendReadiness: () => Promise<BackendReadinessState>;
  loadQueueSnapshot: () => Promise<QueueSnapshot>;
  logger: Logger;
  now: () => Date;
  workspaceRepository?: {
    listAll(): Promise<Array<{ id: string; ownerUserId: string }>>;
  };
  opsAlertMuteRepository: {
    listActiveByWorkspaceIdAndCodes?(input: {
      codes: string[];
      observedAt: Date;
      workspaceId: string;
    }): Promise<AlertMuteRecord[]>;
    listActiveByOwnerUserIdAndCodes?(input: {
      codes: string[];
      observedAt: Date;
      ownerUserId: string;
    }): Promise<AlertMuteRecord[]>;
  };
  opsAlertRoutingPolicyRepository: {
    findByWorkspaceId?(
      workspaceId: string
    ): Promise<AlertRoutingPolicyRecord | null>;
    findByOwnerUserId?(
      ownerUserId: string
    ): Promise<AlertRoutingPolicyRecord | null>;
  };
  opsAlertEscalationPolicyRepository: {
    findByWorkspaceId?(
      workspaceId: string
    ): Promise<AlertEscalationPolicyRecord | null>;
    findByOwnerUserId?(
      ownerUserId: string
    ): Promise<AlertEscalationPolicyRecord | null>;
  };
  opsAlertSchedulePolicyRepository: {
    findByWorkspaceId?(
      workspaceId: string
    ): Promise<AlertSchedulePolicyRecord | null>;
    findByOwnerUserId?(
      ownerUserId: string
    ): Promise<AlertSchedulePolicyRecord | null>;
  };
  opsAlertDeliveryRepository: {
    create(input: {
      alertStateId: string;
      captureId: string;
      code: string;
      deliveredAt: Date | null;
      deliveryChannel: OpsAlertDeliveryChannel;
      deliveryState: "delivered" | "failed";
      failureMessage: string | null;
      message: string;
      ownerUserId: string;
      severity: "critical" | "warning";
      title: string;
      workspaceId: string;
    }): Promise<unknown>;
  };
  opsAlertStateRepository: {
    createActive(input: {
      code: string;
      message: string;
      observedAt: Date;
      ownerUserId: string;
      severity: "critical" | "warning";
      title: string;
      workspaceId: string;
    }): Promise<AlertStateRecord>;
    listActiveByWorkspaceId?(workspaceId: string): Promise<AlertStateRecord[]>;
    listActiveByOwnerUserId?(ownerUserId: string): Promise<AlertStateRecord[]>;
    listByWorkspaceIdAndCodes?(input: {
      codes: string[];
      workspaceId: string;
    }): Promise<AlertStateRecord[]>;
    listByOwnerUserIdAndCodes?(input: {
      codes: string[];
      ownerUserId: string;
    }): Promise<AlertStateRecord[]>;
    markResolved(input: {
      id: string;
      observedAt: Date;
    }): Promise<AlertStateRecord>;
    setLastDeliveredAt(input: {
      deliveryChannel?: OpsAlertDeliveryChannel;
      deliveredAt: Date;
      firstWebhookDeliveredAt?: Date;
      id: string;
    }): Promise<AlertStateRecord>;
    update(input: {
      acknowledgedAt?: Date | null;
      acknowledgedByUserId?: string | null;
      id: string;
      lastDeliveredAt?: Date | null;
      message: string;
      observedAt: Date;
      severity: "critical" | "warning";
      status: "active" | "resolved";
      title: string;
    }): Promise<AlertStateRecord>;
  };
  opsObservabilityCaptureRepository: {
    create(input: {
      backendReadinessMessage: string;
      backendReadinessStatus:
        | "not_ready"
        | "ready"
        | "unconfigured"
        | "unreachable";
      capturedAt: Date;
      criticalAlertCount: number;
      observabilityMessage: string;
      observabilityStatus: "critical" | "ok" | "unreachable" | "warning";
      oldestQueuedAgeSeconds: number | null;
      oldestRunningAgeSeconds: number | null;
      ownerUserId: string;
      queueActiveCount: number | null;
      queueCompletedCount: number | null;
      queueConcurrency: number | null;
      queueDelayedCount: number | null;
      queueFailedCount: number | null;
      queuePausedCount: number | null;
      queueStatus: "ok" | "unreachable";
      queueWaitingCount: number | null;
      warningAlertCount: number;
      workspaceId: string;
      windows: Array<{
        averageCompletionSeconds: number | null;
        capturedAt: Date;
        failedCount: number;
        from: Date;
        label: string;
        maxCompletionSeconds: number | null;
        ownerUserId: string;
        queuedCount: number;
        runningCount: number;
        storedAssetCount: number;
        succeededCount: number;
        successRatePercent: number | null;
        totalCount: number;
        windowKey: string;
        workspaceId: string;
      }>;
      workerAdapter: string | null;
    }): Promise<{
      id: string;
    }>;
  };
};

const observabilityWindows = [
  {
    durationMs: 60 * 60 * 1000,
    key: "1h",
    label: "Last hour"
  },
  {
    durationMs: 24 * 60 * 60 * 1000,
    key: "24h",
    label: "Last 24 hours"
  }
] as const;
const queueWaitingWarningMultiplier = 2;
const queueWaitingCriticalMultiplier = 4;
const recentFailureWarningCount = 3;
const recentFailureCriticalCount = 5;
const recentFailureWarningRate = 0.4;
const recentFailureCriticalRate = 0.6;
const oldestQueuedWarningAgeMs = 5 * 60 * 1000;
const oldestQueuedCriticalAgeMs = 15 * 60 * 1000;
const oldestRunningWarningAgeMs = 15 * 60 * 1000;
const oldestRunningCriticalAgeMs = 30 * 60 * 1000;

function parseStoredAssetCount(
  resultJson: unknown,
  generatedAssetCount: number
) {
  if (!resultJson) {
    return generatedAssetCount;
  }

  const parsedResult = generationResultSummarySchema.safeParse(resultJson);

  if (!parsedResult.success) {
    return generatedAssetCount;
  }

  return parsedResult.data.storedAssetCount;
}

function createPercentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return null;
  }

  return Number(((numerator / denominator) * 100).toFixed(1));
}

async function listCaptureTargets(
  dependencies: OpsObservabilityCaptureServiceDependencies
) {
  if (dependencies.workspaceRepository) {
    return dependencies.workspaceRepository.listAll();
  }

  const ownerUserIds =
    (await dependencies.generationRequestRepository.listDistinctOwnerUserIds?.()) ??
    [];

  return ownerUserIds.map((ownerUserId) => ({
    id: ownerUserId,
    ownerUserId
  }));
}

async function findOldestGenerationRecord(
  dependencies: Pick<
    OpsObservabilityCaptureServiceDependencies,
    "generationRequestRepository"
  >,
  input: {
    ownerUserId: string;
    statuses: GenerationRequestStatus[];
    workspaceId: string;
  }
) {
  if (dependencies.generationRequestRepository.findOldestForWorkspaceId) {
    return dependencies.generationRequestRepository.findOldestForWorkspaceId({
      statuses: input.statuses,
      workspaceId: input.workspaceId
    });
  }

  return (
    dependencies.generationRequestRepository.findOldestForOwnerUserId?.({
      ownerUserId: input.ownerUserId,
      statuses: input.statuses
    }) ?? Promise.resolve(null)
  );
}

async function listRecentGenerationRecordsSince(
  dependencies: Pick<
    OpsObservabilityCaptureServiceDependencies,
    "generationRequestRepository"
  >,
  input: {
    ownerUserId: string;
    since: Date;
    workspaceId: string;
  }
) {
  if (dependencies.generationRequestRepository.listRecentForWorkspaceIdSince) {
    return dependencies.generationRequestRepository.listRecentForWorkspaceIdSince(
      {
        since: input.since,
        workspaceId: input.workspaceId
      }
    );
  }

  return (
    dependencies.generationRequestRepository.listRecentForOwnerUserIdSince?.({
      ownerUserId: input.ownerUserId,
      since: input.since
    }) ?? Promise.resolve([])
  );
}

async function findWorkspacePolicy<T>(
  repository: {
    findByOwnerUserId?: (ownerUserId: string) => Promise<T | null>;
    findByWorkspaceId?: (workspaceId: string) => Promise<T | null>;
  },
  input: {
    ownerUserId: string;
    workspaceId: string;
  }
) {
  if (repository.findByWorkspaceId) {
    return repository.findByWorkspaceId(input.workspaceId);
  }

  return (
    repository.findByOwnerUserId?.(input.ownerUserId) ?? Promise.resolve(null)
  );
}

async function listWorkspaceAlertStates(
  repository: OpsObservabilityCaptureServiceDependencies["opsAlertStateRepository"],
  input: {
    ownerUserId: string;
    workspaceId: string;
  }
) {
  if (repository.listActiveByWorkspaceId) {
    return repository.listActiveByWorkspaceId(input.workspaceId);
  }

  return (
    repository.listActiveByOwnerUserId?.(input.ownerUserId) ??
    Promise.resolve([])
  );
}

async function listWorkspaceAlertStatesByCodes(
  repository: OpsObservabilityCaptureServiceDependencies["opsAlertStateRepository"],
  input: {
    codes: string[];
    ownerUserId: string;
    workspaceId: string;
  }
) {
  if (repository.listByWorkspaceIdAndCodes) {
    return repository.listByWorkspaceIdAndCodes({
      codes: input.codes,
      workspaceId: input.workspaceId
    });
  }

  return (
    repository.listByOwnerUserIdAndCodes?.({
      codes: input.codes,
      ownerUserId: input.ownerUserId
    }) ?? Promise.resolve([])
  );
}

async function listWorkspaceAlertMutesByCodes(
  repository: OpsObservabilityCaptureServiceDependencies["opsAlertMuteRepository"],
  input: {
    codes: string[];
    observedAt: Date;
    ownerUserId: string;
    workspaceId: string;
  }
) {
  if (repository.listActiveByWorkspaceIdAndCodes) {
    return repository.listActiveByWorkspaceIdAndCodes({
      codes: input.codes,
      observedAt: input.observedAt,
      workspaceId: input.workspaceId
    });
  }

  return (
    repository.listActiveByOwnerUserIdAndCodes?.({
      codes: input.codes,
      observedAt: input.observedAt,
      ownerUserId: input.ownerUserId
    }) ?? Promise.resolve([])
  );
}

function createAverageDurationSeconds(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function createMaxDurationSeconds(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function createAgeSeconds(from: Date, referenceTime: Date) {
  const ageSeconds = Math.round(
    (referenceTime.getTime() - from.getTime()) / 1000
  );

  return Math.max(0, ageSeconds);
}

function resolveCompletionDurationSeconds(
  generation: GenerationActivityRecord
) {
  if (!generation.completedAt) {
    return null;
  }

  const durationSeconds = Math.round(
    (generation.completedAt.getTime() - generation.createdAt.getTime()) / 1000
  );

  return Math.max(0, durationSeconds);
}

function createGenerationWindowSummary(input: {
  capturedAt: string;
  from: Date;
  generations: GenerationActivityRecord[];
  label: string;
  windowKey: "1h" | "24h";
}): OpsGenerationWindowSummary {
  const queuedCount = input.generations.filter(
    (generation) => generation.status === "queued"
  ).length;
  const runningCount = input.generations.filter(
    (generation) => generation.status === "running"
  ).length;
  const succeededGenerations = input.generations.filter(
    (generation) =>
      generation.status === "succeeded" && generation.completedAt !== null
  );
  const succeededCount = succeededGenerations.length;
  const failedCount = input.generations.filter(
    (generation) => generation.status === "failed"
  ).length;
  const completionDurations = succeededGenerations
    .map((generation) => resolveCompletionDurationSeconds(generation))
    .filter((duration): duration is number => duration !== null);
  const terminalCount = succeededCount + failedCount;

  return {
    averageCompletionSeconds: createAverageDurationSeconds(completionDurations),
    capturedAt: input.capturedAt,
    failedCount,
    from: input.from.toISOString(),
    label: input.label,
    maxCompletionSeconds: createMaxDurationSeconds(completionDurations),
    queuedCount,
    runningCount,
    storedAssetCount: input.generations.reduce(
      (count, generation) =>
        count +
        parseStoredAssetCount(
          generation.resultJson,
          generation._count.generatedAssets
        ),
      0
    ),
    succeededCount,
    successRatePercent: createPercentage(succeededCount, terminalCount),
    totalCount: input.generations.length,
    windowKey: input.windowKey
  };
}

async function loadOwnerGenerationMetrics(
  dependencies: Pick<
    OpsObservabilityCaptureServiceDependencies,
    "generationRequestRepository"
  >,
  input: {
    capturedAt: string;
    ownerUserId: string;
    referenceTime: Date;
    workspaceId: string;
  }
): Promise<OwnerGenerationMetrics> {
  try {
    const [oldestQueuedGeneration, oldestRunningGeneration, ...windowResults] =
      await Promise.all([
        findOldestGenerationRecord(dependencies, {
          ownerUserId: input.ownerUserId,
          statuses: ["queued"],
          workspaceId: input.workspaceId
        }),
        findOldestGenerationRecord(dependencies, {
          ownerUserId: input.ownerUserId,
          statuses: ["running"],
          workspaceId: input.workspaceId
        }),
        ...observabilityWindows.map((window) =>
          listRecentGenerationRecordsSince(dependencies, {
            ownerUserId: input.ownerUserId,
            since: new Date(input.referenceTime.getTime() - window.durationMs),
            workspaceId: input.workspaceId
          })
        )
      ]);

    return {
      message: "Rolling generation metrics loaded from PostgreSQL.",
      oldestQueuedAgeSeconds: oldestQueuedGeneration
        ? createAgeSeconds(
            oldestQueuedGeneration.createdAt,
            input.referenceTime
          )
        : null,
      oldestRunningAgeSeconds: oldestRunningGeneration
        ? createAgeSeconds(
            oldestRunningGeneration.startedAt ??
              oldestRunningGeneration.createdAt,
            input.referenceTime
          )
        : null,
      status: "ok",
      windows: observabilityWindows.map((window, index) =>
        createGenerationWindowSummary({
          capturedAt: input.capturedAt,
          from: new Date(input.referenceTime.getTime() - window.durationMs),
          generations: windowResults[index] ?? [],
          label: window.label,
          windowKey: window.key
        })
      )
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Rolling generation metrics could not be loaded.",
      oldestQueuedAgeSeconds: null,
      oldestRunningAgeSeconds: null,
      status: "unreachable",
      windows: []
    };
  }
}

function createOperatorAlertSummary(input: {
  metrics: OwnerGenerationMetrics;
  queueSnapshot: QueueSnapshot;
  readiness: BackendReadinessState;
}) {
  const alerts: OpsOperatorAlertSummary[] = [];
  const lastHourWindow = input.metrics.windows.find(
    (window) => window.windowKey === "1h"
  );

  if (
    input.queueSnapshot.status === "ok" &&
    input.queueSnapshot.workerAdapter === "http_backend" &&
    input.readiness.status !== "ready"
  ) {
    alerts.push({
      code: "GENERATION_BACKEND_NOT_READY",
      message: input.readiness.message,
      severity: "critical",
      title: "Generation backend is not ready for the active worker adapter."
    });
  }

  if (input.queueSnapshot.status === "unreachable") {
    alerts.push({
      code: "QUEUE_DIAGNOSTICS_UNAVAILABLE",
      message: input.queueSnapshot.message,
      severity: "warning",
      title: "Queue diagnostics could not be loaded."
    });
  }

  if (
    input.queueSnapshot.status === "ok" &&
    input.queueSnapshot.counts &&
    input.queueSnapshot.concurrency > 0
  ) {
    const waitingCount = input.queueSnapshot.counts.waiting;
    const activeCount = input.queueSnapshot.counts.active;

    if (waitingCount > 0 && activeCount === 0) {
      alerts.push({
        code: "QUEUE_STALLED",
        message: `${waitingCount} generation jobs are waiting while no jobs are active.`,
        severity: "critical",
        title: "The generation queue appears stalled."
      });
    } else if (
      waitingCount >=
      input.queueSnapshot.concurrency * queueWaitingCriticalMultiplier
    ) {
      alerts.push({
        code: "QUEUE_BACKLOG_CRITICAL",
        message: `${waitingCount} generation jobs are waiting against ${input.queueSnapshot.concurrency}x configured concurrency.`,
        severity: "critical",
        title: "The generation queue backlog is critically high."
      });
    } else if (
      waitingCount >=
      input.queueSnapshot.concurrency * queueWaitingWarningMultiplier
    ) {
      alerts.push({
        code: "QUEUE_BACKLOG_WARNING",
        message: `${waitingCount} generation jobs are waiting against ${input.queueSnapshot.concurrency}x configured concurrency.`,
        severity: "warning",
        title: "The generation queue backlog is elevated."
      });
    }
  }

  if (input.metrics.status !== "ok") {
    alerts.push({
      code: "ROLLING_METRICS_UNAVAILABLE",
      message: input.metrics.message,
      severity: "warning",
      title: "Rolling generation metrics could not be loaded."
    });
  }

  if (input.metrics.status === "ok" && lastHourWindow) {
    const lastHourTerminalCount =
      lastHourWindow.succeededCount + lastHourWindow.failedCount;
    const lastHourFailureRate =
      lastHourTerminalCount > 0
        ? lastHourWindow.failedCount / lastHourTerminalCount
        : null;

    if (
      lastHourFailureRate !== null &&
      lastHourWindow.failedCount >= recentFailureCriticalCount &&
      lastHourFailureRate >= recentFailureCriticalRate
    ) {
      alerts.push({
        code: "RECENT_FAILURE_SPIKE_CRITICAL",
        message: `${lastHourWindow.failedCount} owner-scoped failures were recorded in the last hour with a ${lastHourWindow.successRatePercent ?? 0}% success rate.`,
        severity: "critical",
        title: "Recent generation failures are critically elevated."
      });
    } else if (
      lastHourFailureRate !== null &&
      lastHourWindow.failedCount >= recentFailureWarningCount &&
      lastHourFailureRate >= recentFailureWarningRate
    ) {
      alerts.push({
        code: "RECENT_FAILURE_SPIKE_WARNING",
        message: `${lastHourWindow.failedCount} owner-scoped failures were recorded in the last hour with a ${lastHourWindow.successRatePercent ?? 0}% success rate.`,
        severity: "warning",
        title: "Recent generation failures are elevated."
      });
    }

    if (
      input.metrics.oldestQueuedAgeSeconds !== null &&
      input.metrics.oldestQueuedAgeSeconds * 1000 >= oldestQueuedCriticalAgeMs
    ) {
      alerts.push({
        code: "OWNER_QUEUE_AGE_CRITICAL",
        message: `The oldest queued owner-scoped request has waited ${input.metrics.oldestQueuedAgeSeconds}s.`,
        severity: "critical",
        title: "Queued owner-scoped generation work is critically old."
      });
    } else if (
      input.metrics.oldestQueuedAgeSeconds !== null &&
      input.metrics.oldestQueuedAgeSeconds * 1000 >= oldestQueuedWarningAgeMs
    ) {
      alerts.push({
        code: "OWNER_QUEUE_AGE_WARNING",
        message: `The oldest queued owner-scoped request has waited ${input.metrics.oldestQueuedAgeSeconds}s.`,
        severity: "warning",
        title: "Queued owner-scoped generation work is older than expected."
      });
    }

    if (
      input.metrics.oldestRunningAgeSeconds !== null &&
      input.metrics.oldestRunningAgeSeconds * 1000 >= oldestRunningCriticalAgeMs
    ) {
      alerts.push({
        code: "OWNER_RUNNING_AGE_CRITICAL",
        message: `The oldest running owner-scoped request has been active for ${input.metrics.oldestRunningAgeSeconds}s.`,
        severity: "critical",
        title: "Running owner-scoped generation work looks critically long."
      });
    } else if (
      input.metrics.oldestRunningAgeSeconds !== null &&
      input.metrics.oldestRunningAgeSeconds * 1000 >= oldestRunningWarningAgeMs
    ) {
      alerts.push({
        code: "OWNER_RUNNING_AGE_WARNING",
        message: `The oldest running owner-scoped request has been active for ${input.metrics.oldestRunningAgeSeconds}s.`,
        severity: "warning",
        title: "Running owner-scoped generation work is longer than expected."
      });
    }
  }

  return alerts;
}

function createObservabilitySummary(input: {
  alerts: OpsOperatorAlertSummary[];
  metrics: OwnerGenerationMetrics;
}) {
  const criticalAlertCount = input.alerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const warningAlertCount = input.alerts.filter(
    (alert) => alert.severity === "warning"
  ).length;

  return {
    criticalAlertCount,
    message:
      criticalAlertCount > 0
        ? `${criticalAlertCount} critical and ${warningAlertCount} warning operator alerts are active.`
        : warningAlertCount > 0
          ? `${warningAlertCount} warning operator alerts are active.`
          : input.metrics.status === "ok"
            ? "Recent operator metrics and runtime alerts look healthy."
            : input.metrics.message,
    status:
      criticalAlertCount > 0
        ? "critical"
        : warningAlertCount > 0
          ? "warning"
          : input.metrics.status === "ok"
            ? "ok"
            : "unreachable",
    warningAlertCount
  } as const;
}

function hasAlertMaterialChanges(input: {
  alert: OpsOperatorAlertSummary;
  existingState: AlertStateRecord | undefined;
}) {
  if (!input.existingState) {
    return true;
  }

  return (
    input.existingState.status !== "active" ||
    input.existingState.message !== input.alert.message ||
    input.existingState.title !== input.alert.title ||
    input.existingState.severity !== input.alert.severity
  );
}

function createDeliveryFailureMessage(error: unknown) {
  return error instanceof Error ? error.message : "Alert delivery failed.";
}

function shouldDeliverAuditLogAlert(input: {
  alert: OpsOperatorAlertSummary;
  existingState: AlertStateRecord | undefined;
}) {
  if (hasAlertMaterialChanges(input)) {
    return true;
  }

  return (
    input.existingState?.lastAuditLogDeliveredAt === null &&
    input.existingState.acknowledgedAt === null
  );
}

function shouldDeliverWebhookAlert(input: {
  alert: OpsOperatorAlertSummary;
  escalationPolicy: AlertEscalationPolicyRecord | null;
  existingState: AlertStateRecord | undefined;
  routingPolicy: AlertRoutingPolicyRecord | null;
  schedulePolicy: AlertSchedulePolicyRecord | null;
  referenceTime: Date;
  webhookDeliveryEnabled: boolean;
}) {
  if (!input.webhookDeliveryEnabled) {
    return false;
  }

  if (input.routingPolicy && !input.routingPolicy.webhookEnabled) {
    return false;
  }

  if (
    input.routingPolicy?.webhookMinimumSeverity === "critical" &&
    input.alert.severity !== "critical"
  ) {
    return false;
  }

  if (input.schedulePolicy) {
    const evaluation = evaluateOpsAlertSchedulePolicy({
      activeDays: parseOpsAlertScheduleDayMask(
        input.schedulePolicy.activeDaysMask
      ),
      endMinuteOfDay: input.schedulePolicy.endMinuteOfDay,
      referenceTime: input.referenceTime,
      startMinuteOfDay: input.schedulePolicy.startMinuteOfDay,
      timezone: input.schedulePolicy.timezone
    });

    if (!evaluation.active) {
      return false;
    }
  }

  if (hasAlertMaterialChanges(input)) {
    return true;
  }

  if (
    input.existingState?.lastWebhookDeliveredAt === null &&
    input.existingState?.acknowledgedAt === null
  ) {
    return true;
  }

  if (
    !input.existingState ||
    !input.escalationPolicy ||
    input.existingState.firstWebhookDeliveredAt === null ||
    input.existingState.lastWebhookDeliveredAt === null
  ) {
    return false;
  }

  return evaluateOpsAlertEscalationPolicy({
    acknowledgedAt: input.existingState.acknowledgedAt,
    firstReminderDelayMinutes: input.escalationPolicy.firstReminderDelayMinutes,
    firstWebhookDeliveredAt: input.existingState.firstWebhookDeliveredAt,
    lastWebhookDeliveredAt: input.existingState.lastWebhookDeliveredAt,
    referenceTime: input.referenceTime,
    repeatReminderIntervalMinutes:
      input.escalationPolicy.repeatReminderIntervalMinutes
  }).active;
}

export function createOpsObservabilityCaptureService(
  dependencies: OpsObservabilityCaptureServiceDependencies
) {
  return {
    async captureAllOwnerObservability(): Promise<CaptureSummary> {
      const referenceTime = dependencies.now();
      const capturedAt = referenceTime.toISOString();
      const [workspaces, queueSnapshot, readiness] = await Promise.all([
        listCaptureTargets(dependencies),
        dependencies.loadQueueSnapshot(),
        dependencies.loadBackendReadiness()
      ]);
      const summary: CaptureSummary = {
        captureCount: 0,
        deliveredAlertCount: 0,
        failedDeliveryCount: 0,
        ownerCount: new Set(
          workspaces.map((workspace) => workspace.ownerUserId)
        ).size,
        resolvedAlertCount: 0
      };

      for (const workspace of workspaces) {
        const ownerUserId = workspace.ownerUserId;
        const workspaceId = workspace.id;
        const routingPolicy = await findWorkspacePolicy(
          dependencies.opsAlertRoutingPolicyRepository,
          {
            ownerUserId,
            workspaceId
          }
        );
        const escalationPolicy = await findWorkspacePolicy(
          dependencies.opsAlertEscalationPolicyRepository,
          {
            ownerUserId,
            workspaceId
          }
        );
        const schedulePolicy = await findWorkspacePolicy(
          dependencies.opsAlertSchedulePolicyRepository,
          {
            ownerUserId,
            workspaceId
          }
        );
        const metrics = await loadOwnerGenerationMetrics(dependencies, {
          capturedAt,
          ownerUserId,
          referenceTime,
          workspaceId
        });
        const alerts = createOperatorAlertSummary({
          metrics,
          queueSnapshot,
          readiness
        });
        const observability = createObservabilitySummary({
          alerts,
          metrics
        });
        const capture =
          await dependencies.opsObservabilityCaptureRepository.create({
            backendReadinessMessage: readiness.message,
            backendReadinessStatus: readiness.status,
            capturedAt: referenceTime,
            criticalAlertCount: observability.criticalAlertCount,
            observabilityMessage: observability.message,
            observabilityStatus: observability.status,
            oldestQueuedAgeSeconds: metrics.oldestQueuedAgeSeconds,
            oldestRunningAgeSeconds: metrics.oldestRunningAgeSeconds,
            ownerUserId,
            queueActiveCount: queueSnapshot.counts?.active ?? null,
            queueCompletedCount: queueSnapshot.counts?.completed ?? null,
            queueConcurrency: queueSnapshot.concurrency,
            queueDelayedCount: queueSnapshot.counts?.delayed ?? null,
            queueFailedCount: queueSnapshot.counts?.failed ?? null,
            queuePausedCount: queueSnapshot.counts?.paused ?? null,
            queueStatus: queueSnapshot.status,
            queueWaitingCount: queueSnapshot.counts?.waiting ?? null,
            warningAlertCount: observability.warningAlertCount,
            workspaceId,
            windows: metrics.windows.map((window) => ({
              averageCompletionSeconds: window.averageCompletionSeconds,
              capturedAt: referenceTime,
              failedCount: window.failedCount,
              from: new Date(window.from),
              label: window.label,
              maxCompletionSeconds: window.maxCompletionSeconds,
              ownerUserId,
              queuedCount: window.queuedCount,
              runningCount: window.runningCount,
              storedAssetCount: window.storedAssetCount,
              succeededCount: window.succeededCount,
              successRatePercent: window.successRatePercent,
              totalCount: window.totalCount,
              windowKey: window.windowKey,
              workspaceId
            })),
            workerAdapter: queueSnapshot.workerAdapter
          });
        const activeStates = await listWorkspaceAlertStates(
          dependencies.opsAlertStateRepository,
          {
            ownerUserId,
            workspaceId
          }
        );
        const existingStates = await listWorkspaceAlertStatesByCodes(
          dependencies.opsAlertStateRepository,
          {
            codes: alerts.map((alert) => alert.code),
            ownerUserId,
            workspaceId
          }
        );
        const activeMutes = await listWorkspaceAlertMutesByCodes(
          dependencies.opsAlertMuteRepository,
          {
            codes: alerts.map((alert) => alert.code),
            observedAt: referenceTime,
            ownerUserId,
            workspaceId
          }
        );
        const existingStateByCode = new Map(
          existingStates.map((state) => [state.code, state])
        );
        const activeMuteByCode = new Map(
          activeMutes.map((mute) => [mute.code, mute])
        );
        const currentAlertCodeSet = new Set(alerts.map((alert) => alert.code));

        for (const activeState of activeStates) {
          if (currentAlertCodeSet.has(activeState.code)) {
            continue;
          }

          await dependencies.opsAlertStateRepository.markResolved({
            id: activeState.id,
            observedAt: referenceTime
          });
          summary.resolvedAlertCount += 1;
        }

        for (const alert of alerts) {
          const existingState = existingStateByCode.get(alert.code);
          const alertHasMaterialChanges = hasAlertMaterialChanges({
            alert,
            existingState
          });
          const deliverAuditLog = shouldDeliverAuditLogAlert({
            alert,
            existingState
          });
          const deliverWebhook = shouldDeliverWebhookAlert({
            alert,
            escalationPolicy,
            existingState,
            referenceTime,
            routingPolicy,
            schedulePolicy,
            webhookDeliveryEnabled:
              dependencies.alertWebhookDelivery?.enabled ?? false
          });
          const activeMute = activeMuteByCode.get(alert.code);
          const alertState = existingState
            ? await dependencies.opsAlertStateRepository.update({
                ...(alertHasMaterialChanges
                  ? {
                      acknowledgedAt: null,
                      acknowledgedByUserId: null
                    }
                  : {}),
                id: existingState.id,
                message: alert.message,
                observedAt: referenceTime,
                severity: alert.severity,
                status: "active",
                title: alert.title
              })
            : await dependencies.opsAlertStateRepository.createActive({
                code: alert.code,
                message: alert.message,
                observedAt: referenceTime,
                ownerUserId,
                severity: alert.severity,
                title: alert.title,
                workspaceId
              });

          if ((!deliverAuditLog && !deliverWebhook) || activeMute) {
            continue;
          }

          const attemptDelivery = async (input: {
            deliveryChannel: OpsAlertDeliveryChannel;
            deliver: () => Promise<unknown>;
            failureLogMessage: string;
          }) => {
            try {
              await input.deliver();
              await dependencies.opsAlertDeliveryRepository.create({
                alertStateId: alertState.id,
                captureId: capture.id,
                code: alert.code,
                deliveredAt: referenceTime,
                deliveryChannel: input.deliveryChannel,
                deliveryState: "delivered",
                failureMessage: null,
                message: alert.message,
                ownerUserId,
                severity: alert.severity,
                title: alert.title,
                workspaceId
              });
              summary.deliveredAlertCount += 1;
              await dependencies.opsAlertStateRepository.setLastDeliveredAt({
                deliveredAt: referenceTime,
                deliveryChannel: input.deliveryChannel,
                ...(input.deliveryChannel === "webhook" &&
                alertState.firstWebhookDeliveredAt === null
                  ? {
                      firstWebhookDeliveredAt: referenceTime
                    }
                  : {}),
                id: alertState.id
              });
            } catch (error) {
              const failureMessage = createDeliveryFailureMessage(error);

              dependencies.logger.error(input.failureLogMessage, {
                alertCode: alert.code,
                error: failureMessage,
                ownerUserId
              });
              await dependencies.opsAlertDeliveryRepository.create({
                alertStateId: alertState.id,
                captureId: capture.id,
                code: alert.code,
                deliveredAt: null,
                deliveryChannel: input.deliveryChannel,
                deliveryState: "failed",
                failureMessage,
                message: alert.message,
                ownerUserId,
                severity: alert.severity,
                title: alert.title,
                workspaceId
              });
              summary.failedDeliveryCount += 1;
            }
          };

          if (deliverAuditLog) {
            await attemptDelivery({
              deliver: () =>
                dependencies.auditLogRepository.create({
                  action: "ops.alert.delivered",
                  actorId: "worker",
                  actorType: "system",
                  entityId: workspaceId,
                  entityType: "workspace",
                  metadataJson: {
                    alertCode: alert.code,
                    captureId: capture.id,
                    deliveredAt: capturedAt,
                    message: alert.message,
                    severity: alert.severity,
                    title: alert.title
                  }
                }),
              deliveryChannel: "audit_log",
              failureLogMessage: "Ops audit-log alert delivery failed"
            });
          }

          if (deliverWebhook) {
            await attemptDelivery({
              deliver: () =>
                dependencies.alertWebhookDelivery!.deliver({
                  alert,
                  captureId: capture.id,
                  deliveredAt: capturedAt,
                  ownerUserId,
                  workspaceId
                }),
              deliveryChannel: "webhook",
              failureLogMessage: "Ops webhook alert delivery failed"
            });
          }
        }

        summary.captureCount += 1;
      }

      dependencies.logger.info("Captured persisted ops observability", summary);

      return summary;
    }
  };
}

export type OpsObservabilityCaptureService = ReturnType<
  typeof createOpsObservabilityCaptureService
>;
