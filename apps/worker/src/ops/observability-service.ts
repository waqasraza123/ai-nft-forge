import type { Logger } from "../lib/logger.js";

import { generationResultSummarySchema } from "@ai-nft-forge/shared";

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

type AlertStateRecord = {
  code: string;
  id: string;
  lastDeliveredAt: Date | null;
  message: string;
  severity: "critical" | "warning";
  status: "active" | "resolved";
  title: string;
};

type OpsObservabilityCaptureServiceDependencies = {
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
    findOldestForOwnerUserId(input: {
      ownerUserId: string;
      statuses: GenerationRequestStatus[];
    }): Promise<GenerationActivityRecord | null>;
    listDistinctOwnerUserIds(): Promise<string[]>;
    listRecentForOwnerUserIdSince(input: {
      ownerUserId: string;
      since: Date;
      statuses?: GenerationRequestStatus[];
    }): Promise<GenerationActivityRecord[]>;
  };
  loadBackendReadiness: () => Promise<BackendReadinessState>;
  loadQueueSnapshot: () => Promise<QueueSnapshot>;
  logger: Logger;
  now: () => Date;
  opsAlertDeliveryRepository: {
    create(input: {
      alertStateId: string;
      captureId: string;
      code: string;
      deliveredAt: Date | null;
      deliveryChannel: "audit_log";
      deliveryState: "delivered" | "failed";
      failureMessage: string | null;
      message: string;
      ownerUserId: string;
      severity: "critical" | "warning";
      title: string;
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
    }): Promise<AlertStateRecord>;
    listActiveByOwnerUserId(ownerUserId: string): Promise<AlertStateRecord[]>;
    listByOwnerUserIdAndCodes(input: {
      codes: string[];
      ownerUserId: string;
    }): Promise<AlertStateRecord[]>;
    markResolved(input: {
      id: string;
      observedAt: Date;
    }): Promise<AlertStateRecord>;
    setLastDeliveredAt(input: {
      deliveredAt: Date;
      id: string;
    }): Promise<AlertStateRecord>;
    update(input: {
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
  }
): Promise<OwnerGenerationMetrics> {
  try {
    const [oldestQueuedGeneration, oldestRunningGeneration, ...windowResults] =
      await Promise.all([
        dependencies.generationRequestRepository.findOldestForOwnerUserId({
          ownerUserId: input.ownerUserId,
          statuses: ["queued"]
        }),
        dependencies.generationRequestRepository.findOldestForOwnerUserId({
          ownerUserId: input.ownerUserId,
          statuses: ["running"]
        }),
        ...observabilityWindows.map((window) =>
          dependencies.generationRequestRepository.listRecentForOwnerUserIdSince(
            {
              ownerUserId: input.ownerUserId,
              since: new Date(input.referenceTime.getTime() - window.durationMs)
            }
          )
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

function shouldDeliverAlert(input: {
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

export function createOpsObservabilityCaptureService(
  dependencies: OpsObservabilityCaptureServiceDependencies
) {
  return {
    async captureAllOwnerObservability(): Promise<CaptureSummary> {
      const referenceTime = dependencies.now();
      const capturedAt = referenceTime.toISOString();
      const [ownerUserIds, queueSnapshot, readiness] = await Promise.all([
        dependencies.generationRequestRepository.listDistinctOwnerUserIds(),
        dependencies.loadQueueSnapshot(),
        dependencies.loadBackendReadiness()
      ]);
      const summary: CaptureSummary = {
        captureCount: 0,
        deliveredAlertCount: 0,
        failedDeliveryCount: 0,
        ownerCount: ownerUserIds.length,
        resolvedAlertCount: 0
      };

      for (const ownerUserId of ownerUserIds) {
        const metrics = await loadOwnerGenerationMetrics(dependencies, {
          capturedAt,
          ownerUserId,
          referenceTime
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
              windowKey: window.windowKey
            })),
            workerAdapter: queueSnapshot.workerAdapter
          });
        const activeStates =
          await dependencies.opsAlertStateRepository.listActiveByOwnerUserId(
            ownerUserId
          );
        const existingStates =
          await dependencies.opsAlertStateRepository.listByOwnerUserIdAndCodes({
            codes: alerts.map((alert) => alert.code),
            ownerUserId
          });
        const existingStateByCode = new Map(
          existingStates.map((state) => [state.code, state])
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
          const deliverAlert = shouldDeliverAlert({
            alert,
            existingState
          });
          const alertState = existingState
            ? await dependencies.opsAlertStateRepository.update({
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
                title: alert.title
              });

          if (!deliverAlert) {
            continue;
          }

          try {
            await dependencies.auditLogRepository.create({
              action: "ops.alert.delivered",
              actorId: "worker",
              actorType: "system",
              entityId: ownerUserId,
              entityType: "user",
              metadataJson: {
                alertCode: alert.code,
                captureId: capture.id,
                deliveredAt: capturedAt,
                message: alert.message,
                severity: alert.severity,
                title: alert.title
              }
            });
            await dependencies.opsAlertDeliveryRepository.create({
              alertStateId: alertState.id,
              captureId: capture.id,
              code: alert.code,
              deliveredAt: referenceTime,
              deliveryChannel: "audit_log",
              deliveryState: "delivered",
              failureMessage: null,
              message: alert.message,
              ownerUserId,
              severity: alert.severity,
              title: alert.title
            });
            await dependencies.opsAlertStateRepository.setLastDeliveredAt({
              deliveredAt: referenceTime,
              id: alertState.id
            });
            summary.deliveredAlertCount += 1;
          } catch (error) {
            const failureMessage =
              error instanceof Error ? error.message : "Alert delivery failed.";

            dependencies.logger.error("Ops alert delivery failed", {
              alertCode: alert.code,
              ownerUserId
            });
            await dependencies.opsAlertDeliveryRepository.create({
              alertStateId: alertState.id,
              captureId: capture.id,
              code: alert.code,
              deliveredAt: null,
              deliveryChannel: "audit_log",
              deliveryState: "failed",
              failureMessage,
              message: alert.message,
              ownerUserId,
              severity: alert.severity,
              title: alert.title
            });
            summary.failedDeliveryCount += 1;
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
