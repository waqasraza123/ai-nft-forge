import {
  createOpsAlertDeliveryRepository,
  createOpsAlertMuteRepository,
  createOpsAlertStateRepository,
  createGenerationRequestRepository,
  createOpsObservabilityCaptureRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";
import {
  opsAlertMuteSummarySchema,
  opsAlertStateSummarySchema,
  generationBackendHealthResponseSchema,
  generationBackendReadinessResponseSchema,
  generationQueueNames,
  generationResultSummarySchema,
  parseWorkerEnv,
  type AuthSessionResponse,
  type GenerationBackendHealthResponse,
  type GenerationBackendReadinessResponse,
  type GenerationRequestStatus
} from "@ai-nft-forge/shared";

import { getCurrentAuthSession } from "../auth/session";
import { getGenerationDispatchQueueCounts } from "../generations/queue";
import { createHealthPayload, type HealthPayload } from "../health";

type FetchLike = typeof fetch;

type CurrentSession = AuthSessionResponse["session"];

type GenerationBackendHealthState =
  | {
      checkedAt: string;
      message: string;
      payload: GenerationBackendHealthResponse;
      status: "ok";
    }
  | {
      checkedAt: string;
      message: string;
      payload: null;
      status: "unconfigured" | "unreachable";
    };

type GenerationBackendReadinessState =
  | {
      checkedAt: string;
      message: string;
      payload: GenerationBackendReadinessResponse;
      status: "not_ready" | "ready";
    }
  | {
      checkedAt: string;
      message: string;
      payload: null;
      status: "unconfigured" | "unreachable";
    };

export type OpsQueueSnapshot =
  | {
      checkedAt: string;
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
      queueName: string;
      service: string;
      status: "ok";
      workerAdapter: string;
    }
  | {
      checkedAt: string;
      concurrency: number | null;
      counts: null;
      message: string;
      queueName: string;
      service: string | null;
      status: "unreachable";
      workerAdapter: string | null;
    };

export type OpsGenerationActivitySummary = {
  completedAt: string | null;
  createdAt: string;
  failedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  generatedAssetCount: number;
  id: string;
  pipelineKey: string;
  queueJobId: string | null;
  requestedVariantCount: number;
  sourceAsset: {
    id: string;
    originalFilename: string;
    status: string;
  };
  startedAt: string | null;
  status: GenerationRequestStatus;
  storedAssetCount: number;
};

type OwnerGenerationActivity = {
  active: OpsGenerationActivitySummary[];
  message: string;
  retryableFailures: OpsGenerationActivitySummary[];
  status: "ok" | "unreachable";
};

type OpsGenerationWindowKey = "1h" | "24h";

export type OpsGenerationWindowSummary = {
  averageCompletionSeconds: number | null;
  checkedAt: string;
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
  windowKey: OpsGenerationWindowKey;
};

export type OpsOperatorAlertSummary = {
  code: string;
  message: string;
  severity: "critical" | "warning";
  title: string;
};

export type OpsOperatorObservability = {
  alerts: OpsOperatorAlertSummary[];
  checkedAt: string;
  message: string;
  oldestQueuedAgeSeconds: number | null;
  oldestRunningAgeSeconds: number | null;
  status: "critical" | "ok" | "unreachable" | "warning";
  windows: OpsGenerationWindowSummary[];
};

export type OpsPersistedCaptureSummary = {
  backendReadinessMessage: string;
  backendReadinessStatus:
    | "not_ready"
    | "ready"
    | "unconfigured"
    | "unreachable";
  capturedAt: string;
  criticalAlertCount: number;
  id: string;
  observabilityMessage: string;
  observabilityStatus: "critical" | "ok" | "unreachable" | "warning";
  oldestQueuedAgeSeconds: number | null;
  oldestRunningAgeSeconds: number | null;
  queueCounts: {
    active: number | null;
    completed: number | null;
    delayed: number | null;
    failed: number | null;
    paused: number | null;
    waiting: number | null;
  };
  queueStatus: "ok" | "unreachable";
  warningAlertCount: number;
  windows: OpsGenerationWindowSummary[];
  workerAdapter: string | null;
};

export type OpsAlertDeliverySummary = {
  code: string;
  createdAt: string;
  deliveredAt: string | null;
  deliveryChannel: "audit_log" | "webhook";
  deliveryState: "delivered" | "failed";
  failureMessage: string | null;
  id: string;
  message: string;
  severity: "critical" | "warning";
  title: string;
};

export type OpsAlertStateSummary = {
  acknowledgedAt: string | null;
  acknowledgedByUserId: string | null;
  code: string;
  firstObservedAt: string;
  id: string;
  lastDeliveredAt: string | null;
  lastObservedAt: string;
  message: string;
  mutedUntil: string | null;
  severity: "critical" | "warning";
  status: "active" | "resolved";
  title: string;
};

export type OpsAlertMuteSummary = {
  code: string;
  id: string;
  mutedUntil: string;
};

export type OpsCaptureAutomation = {
  enabled: boolean;
  intervalSeconds: number | null;
  jitterSeconds: number | null;
  lastCaptureAgeSeconds: number | null;
  lastCapturedAt: string | null;
  lockTtlSeconds: number | null;
  message: string;
  runOnStart: boolean | null;
  status: "disabled" | "healthy" | "stale" | "unreachable";
};

type OwnerPersistedObservabilityHistory = {
  activeAlerts: OpsAlertStateSummary[];
  activeMutes: OpsAlertMuteSummary[];
  captures: OpsPersistedCaptureSummary[];
  deliveries: OpsAlertDeliverySummary[];
  message: string;
  status: "ok" | "unreachable";
};

export type OpsRuntimeSnapshot = {
  generationBackend: {
    endpoints: {
      generateUrl: string | null;
      healthUrl: string | null;
      readinessUrl: string | null;
    };
    health: GenerationBackendHealthState;
    readiness: GenerationBackendReadinessState;
  };
  operator: {
    activity: OwnerGenerationActivity | null;
    captureAutomation: OpsCaptureAutomation | null;
    history: OwnerPersistedObservabilityHistory | null;
    observability: OpsOperatorObservability | null;
    queue: OpsQueueSnapshot | null;
    session: CurrentSession;
  };
  web: HealthPayload;
};

type LoadOpsRuntimeInput = {
  fetchFn?: FetchLike;
  loadOperatorActivity?: (input: {
    ownerUserId: string;
    rawEnvironment: NodeJS.ProcessEnv;
  }) => Promise<OwnerGenerationActivity>;
  loadOperatorHistory?: (input: {
    ownerUserId: string;
    rawEnvironment: NodeJS.ProcessEnv;
  }) => Promise<OwnerPersistedObservabilityHistory>;
  loadOperatorObservability?: (input: {
    checkedAt: string;
    generationBackendReadiness: GenerationBackendReadinessState;
    ownerUserId: string;
    queueSnapshot: OpsQueueSnapshot | null;
    rawEnvironment: NodeJS.ProcessEnv;
    referenceTime: Date;
  }) => Promise<OpsOperatorObservability>;
  loadQueueSnapshot?: (input: {
    checkedAt: string;
    rawEnvironment: NodeJS.ProcessEnv;
  }) => Promise<OpsQueueSnapshot>;
  now?: () => Date;
  rawEnvironment?: NodeJS.ProcessEnv;
  resolveSession?: () => Promise<CurrentSession>;
};

type EndpointSet = {
  generateUrl: string;
  healthUrl: string;
  readinessUrl: string;
};

type GenerationActivityRepository = ReturnType<
  typeof createGenerationRequestRepository
>;
type PersistedCaptureRepository = ReturnType<
  typeof createOpsObservabilityCaptureRepository
>;
type PersistedAlertDeliveryRepository = ReturnType<
  typeof createOpsAlertDeliveryRepository
>;
type PersistedAlertMuteRepository = ReturnType<
  typeof createOpsAlertMuteRepository
>;
type PersistedAlertStateRepository = ReturnType<
  typeof createOpsAlertStateRepository
>;

type GenerationActivityRecord = Awaited<
  ReturnType<GenerationActivityRepository["listRecentForOwnerUserId"]>
>[number];
type PersistedCaptureRecord = Awaited<
  ReturnType<PersistedCaptureRepository["listRecentForOwnerUserId"]>
>[number];
type PersistedAlertDeliveryRecord = Awaited<
  ReturnType<PersistedAlertDeliveryRepository["listRecentForOwnerUserId"]>
>[number];
type PersistedAlertMuteRecord = Awaited<
  ReturnType<PersistedAlertMuteRepository["listActiveByOwnerUserId"]>
>[number];
type PersistedAlertStateRecord = Awaited<
  ReturnType<PersistedAlertStateRepository["listActiveByOwnerUserId"]>
>[number];

type OwnerGenerationMetrics = {
  checkedAt: string;
  message: string;
  oldestQueuedAgeSeconds: number | null;
  oldestRunningAgeSeconds: number | null;
  status: "ok" | "unreachable";
  windows: OpsGenerationWindowSummary[];
};

const probeTimeoutMs = 5_000;
const activeGenerationLimit = 6;
const retryableFailureLimit = 6;
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

function resolveGenerationBackendEndpoints(
  rawEnvironment: NodeJS.ProcessEnv
): EndpointSet | null {
  const generateUrlValue = rawEnvironment.GENERATION_BACKEND_URL?.trim();

  if (!generateUrlValue) {
    return null;
  }

  const generateUrl = new URL(generateUrlValue);
  const healthUrl = new URL("/health", generateUrl);
  const readinessUrl = new URL("/ready", generateUrl);

  return {
    generateUrl: generateUrl.toString(),
    healthUrl: healthUrl.toString(),
    readinessUrl: readinessUrl.toString()
  };
}

async function readJsonResponse(response: Response) {
  return response.json().catch(() => null);
}

async function loadGenerationBackendHealth(input: {
  checkedAt: string;
  endpoints: EndpointSet | null;
  fetchFn: FetchLike;
}): Promise<GenerationBackendHealthState> {
  if (!input.endpoints) {
    return {
      checkedAt: input.checkedAt,
      message: "GENERATION_BACKEND_URL is not configured for the web runtime.",
      payload: null,
      status: "unconfigured"
    };
  }

  try {
    const response = await input.fetchFn(input.endpoints.healthUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(probeTimeoutMs)
    });
    const payload = generationBackendHealthResponseSchema.parse(
      await readJsonResponse(response)
    );

    if (!response.ok) {
      return {
        checkedAt: input.checkedAt,
        message: `Generation backend health returned ${response.status}.`,
        payload: null,
        status: "unreachable"
      };
    }

    return {
      checkedAt: input.checkedAt,
      message: `Generation backend responded with provider ${payload.provider.kind}.`,
      payload,
      status: "ok"
    };
  } catch (error) {
    return {
      checkedAt: input.checkedAt,
      message:
        error instanceof Error
          ? error.message
          : "Generation backend health probe failed.",
      payload: null,
      status: "unreachable"
    };
  }
}

async function loadGenerationBackendReadiness(input: {
  checkedAt: string;
  endpoints: EndpointSet | null;
  fetchFn: FetchLike;
}): Promise<GenerationBackendReadinessState> {
  if (!input.endpoints) {
    return {
      checkedAt: input.checkedAt,
      message: "GENERATION_BACKEND_URL is not configured for the web runtime.",
      payload: null,
      status: "unconfigured"
    };
  }

  try {
    const response = await input.fetchFn(input.endpoints.readinessUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(probeTimeoutMs)
    });
    const payload = generationBackendReadinessResponseSchema.parse(
      await readJsonResponse(response)
    );

    if (response.ok || response.status === 503) {
      return {
        checkedAt: input.checkedAt,
        message: payload.probe.message,
        payload,
        status: payload.status
      };
    }

    return {
      checkedAt: input.checkedAt,
      message: `Generation backend readiness returned ${response.status}.`,
      payload: null,
      status: "unreachable"
    };
  } catch (error) {
    return {
      checkedAt: input.checkedAt,
      message:
        error instanceof Error
          ? error.message
          : "Generation backend readiness probe failed.",
      payload: null,
      status: "unreachable"
    };
  }
}

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

function serializeGenerationActivity(
  generation: GenerationActivityRecord
): OpsGenerationActivitySummary {
  return {
    completedAt: generation.completedAt?.toISOString() ?? null,
    createdAt: generation.createdAt.toISOString(),
    failedAt: generation.failedAt?.toISOString() ?? null,
    failureCode: generation.failureCode,
    failureMessage: generation.failureMessage,
    generatedAssetCount: generation._count.generatedAssets,
    id: generation.id,
    pipelineKey: generation.pipelineKey,
    queueJobId: generation.queueJobId,
    requestedVariantCount: generation.requestedVariantCount,
    sourceAsset: {
      id: generation.sourceAsset.id,
      originalFilename: generation.sourceAsset.originalFilename,
      status: generation.sourceAsset.status
    },
    startedAt: generation.startedAt?.toISOString() ?? null,
    status: generation.status,
    storedAssetCount: parseStoredAssetCount(
      generation.resultJson,
      generation._count.generatedAssets
    )
  };
}

function createGenerationRepository(rawEnvironment: NodeJS.ProcessEnv) {
  return createGenerationRequestRepository(getDatabaseClient(rawEnvironment));
}

function createPersistedCaptureRepository(rawEnvironment: NodeJS.ProcessEnv) {
  return createOpsObservabilityCaptureRepository(
    getDatabaseClient(rawEnvironment)
  );
}

function createPersistedAlertDeliveryRepository(
  rawEnvironment: NodeJS.ProcessEnv
) {
  return createOpsAlertDeliveryRepository(getDatabaseClient(rawEnvironment));
}

function createPersistedAlertMuteRepository(rawEnvironment: NodeJS.ProcessEnv) {
  return createOpsAlertMuteRepository(getDatabaseClient(rawEnvironment));
}

function createPersistedAlertStateRepository(
  rawEnvironment: NodeJS.ProcessEnv
) {
  return createOpsAlertStateRepository(getDatabaseClient(rawEnvironment));
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

function createAgeSeconds(from: Date, referenceTime: Date) {
  const ageSeconds = Math.round(
    (referenceTime.getTime() - from.getTime()) / 1000
  );

  return Math.max(0, ageSeconds);
}

function createGenerationWindowSummary(input: {
  checkedAt: string;
  from: Date;
  generations: GenerationActivityRecord[];
  label: string;
  windowKey: OpsGenerationWindowKey;
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
    checkedAt: input.checkedAt,
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

function serializePersistedCapture(
  capture: PersistedCaptureRecord
): OpsPersistedCaptureSummary {
  return {
    backendReadinessMessage: capture.backendReadinessMessage,
    backendReadinessStatus: capture.backendReadinessStatus,
    capturedAt: capture.capturedAt.toISOString(),
    criticalAlertCount: capture.criticalAlertCount,
    id: capture.id,
    observabilityMessage: capture.observabilityMessage,
    observabilityStatus: capture.observabilityStatus,
    oldestQueuedAgeSeconds: capture.oldestQueuedAgeSeconds,
    oldestRunningAgeSeconds: capture.oldestRunningAgeSeconds,
    queueCounts: {
      active: capture.queueActiveCount,
      completed: capture.queueCompletedCount,
      delayed: capture.queueDelayedCount,
      failed: capture.queueFailedCount,
      paused: capture.queuePausedCount,
      waiting: capture.queueWaitingCount
    },
    queueStatus: capture.queueStatus,
    warningAlertCount: capture.warningAlertCount,
    windows: capture.windowSnapshots.map(
      (window): OpsGenerationWindowSummary => ({
        averageCompletionSeconds: window.averageCompletionSeconds,
        checkedAt: window.capturedAt.toISOString(),
        failedCount: window.failedCount,
        from: window.from.toISOString(),
        label: window.label,
        maxCompletionSeconds: window.maxCompletionSeconds,
        queuedCount: window.queuedCount,
        runningCount: window.runningCount,
        storedAssetCount: window.storedAssetCount,
        succeededCount: window.succeededCount,
        successRatePercent: window.successRatePercent,
        totalCount: window.totalCount,
        windowKey: window.windowKey as OpsGenerationWindowKey
      })
    ),
    workerAdapter: capture.workerAdapter
  };
}

function serializeAlertDelivery(
  delivery: PersistedAlertDeliveryRecord
): OpsAlertDeliverySummary {
  return {
    code: delivery.code,
    createdAt: delivery.createdAt.toISOString(),
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    deliveryChannel: delivery.deliveryChannel,
    deliveryState: delivery.deliveryState,
    failureMessage: delivery.failureMessage,
    id: delivery.id,
    message: delivery.message,
    severity: delivery.severity,
    title: delivery.title
  };
}

function serializeAlertState(
  alertState: PersistedAlertStateRecord,
  mutedUntil: Date | null
): OpsAlertStateSummary {
  return opsAlertStateSummarySchema.parse({
    acknowledgedAt: alertState.acknowledgedAt?.toISOString() ?? null,
    acknowledgedByUserId: alertState.acknowledgedByUserId,
    code: alertState.code,
    firstObservedAt: alertState.firstObservedAt.toISOString(),
    id: alertState.id,
    lastDeliveredAt: alertState.lastDeliveredAt?.toISOString() ?? null,
    lastObservedAt: alertState.lastObservedAt.toISOString(),
    message: alertState.message,
    mutedUntil: mutedUntil?.toISOString() ?? null,
    severity: alertState.severity,
    status: alertState.status,
    title: alertState.title
  });
}

function serializeAlertMute(
  mute: PersistedAlertMuteRecord
): OpsAlertMuteSummary {
  return opsAlertMuteSummarySchema.parse({
    code: mute.code,
    id: mute.id,
    mutedUntil: mute.mutedUntil.toISOString()
  });
}

async function loadOwnerGenerationActivity(input: {
  ownerUserId: string;
  rawEnvironment: NodeJS.ProcessEnv;
}): Promise<OwnerGenerationActivity> {
  try {
    const repository = createGenerationRepository(input.rawEnvironment);
    const [activeGenerations, retryableFailures] = await Promise.all([
      repository.listRecentForOwnerUserId({
        limit: activeGenerationLimit,
        ownerUserId: input.ownerUserId,
        statuses: ["queued", "running"]
      }),
      repository.listRecentForOwnerUserId({
        limit: retryableFailureLimit,
        orderBy: "failedAtDesc",
        ownerUserId: input.ownerUserId,
        statuses: ["failed"]
      })
    ]);

    return {
      active: activeGenerations.map(serializeGenerationActivity),
      message: "Recent generation activity loaded from PostgreSQL.",
      retryableFailures: retryableFailures.map(serializeGenerationActivity),
      status: "ok"
    };
  } catch (error) {
    return {
      active: [],
      message:
        error instanceof Error
          ? error.message
          : "Generation activity could not be loaded.",
      retryableFailures: [],
      status: "unreachable"
    };
  }
}

async function loadOwnerGenerationMetrics(input: {
  checkedAt: string;
  ownerUserId: string;
  rawEnvironment: NodeJS.ProcessEnv;
  referenceTime: Date;
}): Promise<OwnerGenerationMetrics> {
  try {
    const repository = createGenerationRepository(input.rawEnvironment);
    const [oldestQueuedGeneration, oldestRunningGeneration, ...windowResults] =
      await Promise.all([
        repository.findOldestForOwnerUserId({
          ownerUserId: input.ownerUserId,
          statuses: ["queued"]
        }),
        repository.findOldestForOwnerUserId({
          ownerUserId: input.ownerUserId,
          statuses: ["running"]
        }),
        ...observabilityWindows.map((window) =>
          repository.listRecentForOwnerUserIdSince({
            ownerUserId: input.ownerUserId,
            since: new Date(input.referenceTime.getTime() - window.durationMs)
          })
        )
      ]);

    return {
      checkedAt: input.checkedAt,
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
          checkedAt: input.checkedAt,
          from: new Date(input.referenceTime.getTime() - window.durationMs),
          generations: windowResults[index] ?? [],
          label: window.label,
          windowKey: window.key
        })
      )
    };
  } catch (error) {
    return {
      checkedAt: input.checkedAt,
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
  queueSnapshot: OpsQueueSnapshot | null;
  readiness: GenerationBackendReadinessState;
}) {
  const alerts: OpsOperatorAlertSummary[] = [];
  const lastHourWindow = input.metrics.windows.find(
    (window) => window.windowKey === "1h"
  );

  if (
    input.queueSnapshot?.status === "ok" &&
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

  if (input.queueSnapshot?.status === "unreachable") {
    alerts.push({
      code: "QUEUE_DIAGNOSTICS_UNAVAILABLE",
      message: input.queueSnapshot.message,
      severity: "warning",
      title: "Queue diagnostics could not be loaded."
    });
  }

  if (
    input.queueSnapshot?.status === "ok" &&
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

async function loadOwnerGenerationObservability(input: {
  checkedAt: string;
  generationBackendReadiness: GenerationBackendReadinessState;
  ownerUserId: string;
  queueSnapshot: OpsQueueSnapshot | null;
  rawEnvironment: NodeJS.ProcessEnv;
  referenceTime: Date;
}): Promise<OpsOperatorObservability> {
  const metrics = await loadOwnerGenerationMetrics({
    checkedAt: input.checkedAt,
    ownerUserId: input.ownerUserId,
    rawEnvironment: input.rawEnvironment,
    referenceTime: input.referenceTime
  });
  const alerts = createOperatorAlertSummary({
    metrics,
    queueSnapshot: input.queueSnapshot,
    readiness: input.generationBackendReadiness
  });
  const criticalAlertCount = alerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const warningAlertCount = alerts.filter(
    (alert) => alert.severity === "warning"
  ).length;

  return {
    alerts,
    checkedAt: input.checkedAt,
    message:
      criticalAlertCount > 0
        ? `${criticalAlertCount} critical and ${warningAlertCount} warning operator alerts are active.`
        : warningAlertCount > 0
          ? `${warningAlertCount} warning operator alerts are active.`
          : metrics.status === "ok"
            ? "Recent operator metrics and runtime alerts look healthy."
            : metrics.message,
    oldestQueuedAgeSeconds: metrics.oldestQueuedAgeSeconds,
    oldestRunningAgeSeconds: metrics.oldestRunningAgeSeconds,
    status:
      criticalAlertCount > 0
        ? "critical"
        : warningAlertCount > 0
          ? "warning"
          : metrics.status === "ok"
            ? "ok"
            : "unreachable",
    windows: metrics.windows
  };
}

async function loadOwnerPersistedObservabilityHistory(input: {
  ownerUserId: string;
  rawEnvironment: NodeJS.ProcessEnv;
}): Promise<OwnerPersistedObservabilityHistory> {
  try {
    const captureRepository = createPersistedCaptureRepository(
      input.rawEnvironment
    );
    const alertStateRepository = createPersistedAlertStateRepository(
      input.rawEnvironment
    );
    const alertMuteRepository = createPersistedAlertMuteRepository(
      input.rawEnvironment
    );
    const alertDeliveryRepository = createPersistedAlertDeliveryRepository(
      input.rawEnvironment
    );
    const referenceTime = new Date();
    const [activeAlerts, activeMutes, captures, deliveries] = await Promise.all(
      [
        alertStateRepository.listActiveByOwnerUserId(input.ownerUserId),
        alertMuteRepository.listActiveByOwnerUserId({
          observedAt: referenceTime,
          ownerUserId: input.ownerUserId
        }),
        captureRepository.listRecentForOwnerUserId({
          limit: 7,
          ownerUserId: input.ownerUserId
        }),
        alertDeliveryRepository.listRecentForOwnerUserId({
          limit: 12,
          ownerUserId: input.ownerUserId
        })
      ]
    );
    const muteByCode = new Map(activeMutes.map((mute) => [mute.code, mute]));

    return {
      activeAlerts: activeAlerts.map((alertState) =>
        serializeAlertState(
          alertState,
          muteByCode.get(alertState.code)?.mutedUntil ?? null
        )
      ),
      activeMutes: activeMutes.map(serializeAlertMute),
      captures: captures.map(serializePersistedCapture),
      deliveries: deliveries.map(serializeAlertDelivery),
      message:
        "Persisted observability captures and alert deliveries loaded from PostgreSQL.",
      status: "ok"
    };
  } catch (error) {
    return {
      activeAlerts: [],
      activeMutes: [],
      captures: [],
      deliveries: [],
      message:
        error instanceof Error
          ? error.message
          : "Persisted observability history could not be loaded.",
      status: "unreachable"
    };
  }
}

function loadOpsCaptureAutomation(input: {
  history: OwnerPersistedObservabilityHistory | null;
  rawEnvironment: NodeJS.ProcessEnv;
  referenceTime: Date;
}): OpsCaptureAutomation {
  try {
    const workerEnv = parseWorkerEnv(input.rawEnvironment);
    const latestCapture = input.history?.captures[0] ?? null;
    const lastCapturedAt = latestCapture?.capturedAt ?? null;
    const lastCaptureAgeSeconds = lastCapturedAt
      ? createAgeSeconds(new Date(lastCapturedAt), input.referenceTime)
      : null;

    if (!workerEnv.OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED) {
      return {
        enabled: false,
        intervalSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
        lastCaptureAgeSeconds,
        lastCapturedAt,
        lockTtlSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
        message:
          "Automatic capture scheduling is disabled. Run ops:capture manually or from an external scheduler.",
        runOnStart: workerEnv.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START,
        status: "disabled"
      };
    }

    if (input.history?.status === "unreachable") {
      return {
        enabled: true,
        intervalSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
        lastCaptureAgeSeconds: null,
        lastCapturedAt: null,
        lockTtlSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
        message:
          "Automatic capture scheduling is enabled, but persisted history could not be loaded to verify the latest run.",
        runOnStart: workerEnv.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START,
        status: "unreachable"
      };
    }

    if (!lastCapturedAt || lastCaptureAgeSeconds === null) {
      return {
        enabled: true,
        intervalSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
        lastCaptureAgeSeconds: null,
        lastCapturedAt: null,
        lockTtlSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
        message:
          "Automatic capture scheduling is enabled, but no persisted captures are available yet.",
        runOnStart: workerEnv.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START,
        status: "stale"
      };
    }

    const staleThresholdSeconds =
      workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS +
      workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS +
      Math.max(
        60,
        Math.round(workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS / 2)
      );

    if (lastCaptureAgeSeconds > staleThresholdSeconds) {
      return {
        enabled: true,
        intervalSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
        jitterSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
        lastCaptureAgeSeconds,
        lastCapturedAt,
        lockTtlSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
        message: `Automatic capture scheduling is enabled, but the most recent persisted capture is ${lastCaptureAgeSeconds}s old.`,
        runOnStart: workerEnv.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START,
        status: "stale"
      };
    }

    return {
      enabled: true,
      intervalSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS,
      jitterSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS,
      lastCaptureAgeSeconds,
      lastCapturedAt,
      lockTtlSeconds: workerEnv.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS,
      message:
        "Automatic capture scheduling is active and recent persisted history is arriving on schedule.",
      runOnStart: workerEnv.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START,
      status: "healthy"
    };
  } catch (error) {
    return {
      enabled: false,
      intervalSeconds: null,
      jitterSeconds: null,
      lastCaptureAgeSeconds: null,
      lastCapturedAt: null,
      lockTtlSeconds: null,
      message:
        error instanceof Error
          ? error.message
          : "Ops capture automation could not be evaluated.",
      runOnStart: null,
      status: "unreachable"
    };
  }
}

async function loadQueueSnapshot(input: {
  checkedAt: string;
  rawEnvironment: NodeJS.ProcessEnv;
}): Promise<OpsQueueSnapshot> {
  try {
    const workerEnv = parseWorkerEnv(input.rawEnvironment);
    const counts = await getGenerationDispatchQueueCounts(input.rawEnvironment);

    return {
      checkedAt: input.checkedAt,
      concurrency: workerEnv.GENERATION_QUEUE_CONCURRENCY,
      counts,
      message: "Generation dispatch queue metrics loaded from Redis.",
      queueName: generationQueueNames.generationDispatch,
      service: workerEnv.WORKER_SERVICE_NAME,
      status: "ok",
      workerAdapter: workerEnv.GENERATION_ADAPTER_KIND
    };
  } catch (error) {
    return {
      checkedAt: input.checkedAt,
      concurrency: null,
      counts: null,
      message:
        error instanceof Error
          ? error.message
          : "Generation dispatch queue probe failed.",
      queueName: generationQueueNames.generationDispatch,
      service: null,
      status: "unreachable",
      workerAdapter: null
    };
  }
}

export async function loadOpsRuntime(
  input: LoadOpsRuntimeInput = {}
): Promise<OpsRuntimeSnapshot> {
  const fetchFn = input.fetchFn ?? fetch;
  const now = input.now ?? (() => new Date());
  const rawEnvironment = input.rawEnvironment ?? process.env;
  const referenceTime = now();
  const checkedAt = referenceTime.toISOString();
  const endpoints = resolveGenerationBackendEndpoints(rawEnvironment);
  const resolveSession =
    input.resolveSession ?? (() => getCurrentAuthSession());
  const [health, readiness, session] = await Promise.all([
    loadGenerationBackendHealth({
      checkedAt,
      endpoints,
      fetchFn
    }),
    loadGenerationBackendReadiness({
      checkedAt,
      endpoints,
      fetchFn
    }),
    resolveSession()
  ]);

  let operatorQueue: OpsQueueSnapshot | null = null;
  let operatorActivity: OwnerGenerationActivity | null = null;
  let operatorCaptureAutomation: OpsCaptureAutomation | null = null;
  let operatorHistory: OwnerPersistedObservabilityHistory | null = null;
  let operatorObservability: OpsOperatorObservability | null = null;

  if (session?.user.id) {
    const queueSnapshotLoader = input.loadQueueSnapshot ?? loadQueueSnapshot;
    const operatorActivityLoader =
      input.loadOperatorActivity ?? loadOwnerGenerationActivity;
    const operatorHistoryLoader =
      input.loadOperatorHistory ?? loadOwnerPersistedObservabilityHistory;
    const operatorObservabilityLoader =
      input.loadOperatorObservability ?? loadOwnerGenerationObservability;

    [operatorQueue, operatorActivity, operatorHistory] = await Promise.all([
      queueSnapshotLoader({
        checkedAt,
        rawEnvironment
      }),
      operatorActivityLoader({
        ownerUserId: session.user.id,
        rawEnvironment
      }),
      operatorHistoryLoader({
        ownerUserId: session.user.id,
        rawEnvironment
      })
    ]);

    operatorObservability = await operatorObservabilityLoader({
      checkedAt,
      generationBackendReadiness: readiness,
      ownerUserId: session.user.id,
      queueSnapshot: operatorQueue,
      rawEnvironment,
      referenceTime
    });
    operatorCaptureAutomation = loadOpsCaptureAutomation({
      history: operatorHistory,
      rawEnvironment,
      referenceTime
    });
  }

  return {
    generationBackend: {
      endpoints: {
        generateUrl: endpoints?.generateUrl ?? null,
        healthUrl: endpoints?.healthUrl ?? null,
        readinessUrl: endpoints?.readinessUrl ?? null
      },
      health,
      readiness
    },
    operator: {
      activity: operatorActivity,
      captureAutomation: operatorCaptureAutomation,
      history: operatorHistory,
      observability: operatorObservability,
      queue: operatorQueue,
      session
    },
    web: createHealthPayload()
  };
}
