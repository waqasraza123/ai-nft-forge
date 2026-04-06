import {
  createGenerationRequestRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";
import {
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

const probeTimeoutMs = 5_000;
const activeGenerationLimit = 6;
const retryableFailureLimit = 6;

function createTimestamp(now: () => Date) {
  return now().toISOString();
}

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

async function loadOwnerGenerationActivity(input: {
  ownerUserId: string;
  rawEnvironment: NodeJS.ProcessEnv;
}): Promise<OwnerGenerationActivity> {
  try {
    const repository = createGenerationRequestRepository(
      getDatabaseClient(input.rawEnvironment)
    );
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

    const serializeGeneration = (
      generation: Awaited<
        ReturnType<typeof repository.listRecentForOwnerUserId>
      >[number]
    ): OpsGenerationActivitySummary => ({
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
    });

    return {
      active: activeGenerations.map(serializeGeneration),
      message: "Recent generation activity loaded from PostgreSQL.",
      retryableFailures: retryableFailures.map(serializeGeneration),
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
  const checkedAt = createTimestamp(now);
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

  if (session?.user.id) {
    const queueSnapshotLoader = input.loadQueueSnapshot ?? loadQueueSnapshot;
    const operatorActivityLoader =
      input.loadOperatorActivity ?? loadOwnerGenerationActivity;

    [operatorQueue, operatorActivity] = await Promise.all([
      queueSnapshotLoader({
        checkedAt,
        rawEnvironment
      }),
      operatorActivityLoader({
        ownerUserId: session.user.id,
        rawEnvironment
      })
    ]);
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
      queue: operatorQueue,
      session
    },
    web: createHealthPayload()
  };
}
