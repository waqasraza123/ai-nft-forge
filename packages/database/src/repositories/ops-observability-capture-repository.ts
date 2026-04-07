import type {
  OpsBackendReadinessStatus,
  OpsObservabilityCapture,
  OpsObservabilityStatus,
  OpsQueueStatus,
  Prisma
} from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type OpsObservabilityCaptureRepositoryDatabase = Pick<
  DatabaseExecutor,
  "opsObservabilityCapture"
>;

type CreateOpsWindowSnapshotInput = {
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
};

type CreateOpsObservabilityCaptureInput = {
  backendReadinessMessage: string;
  backendReadinessStatus: OpsBackendReadinessStatus;
  capturedAt: Date;
  criticalAlertCount: number;
  observabilityMessage: string;
  observabilityStatus: OpsObservabilityStatus;
  oldestQueuedAgeSeconds: number | null;
  oldestRunningAgeSeconds: number | null;
  ownerUserId: string;
  queueActiveCount: number | null;
  queueCompletedCount: number | null;
  queueConcurrency: number | null;
  queueDelayedCount: number | null;
  queueFailedCount: number | null;
  queuePausedCount: number | null;
  queueStatus: OpsQueueStatus;
  queueWaitingCount: number | null;
  warningAlertCount: number;
  windows: CreateOpsWindowSnapshotInput[];
  workerAdapter: string | null;
};

const opsObservabilityCaptureInclude = {
  windowSnapshots: {
    orderBy: [
      {
        capturedAt: "desc" as const
      },
      {
        windowKey: "asc" as const
      }
    ]
  }
} satisfies Prisma.OpsObservabilityCaptureInclude;

export function createOpsObservabilityCaptureRepository(
  database: OpsObservabilityCaptureRepositoryDatabase
) {
  return {
    create(
      input: CreateOpsObservabilityCaptureInput
    ): Promise<OpsObservabilityCapture> {
      return database.opsObservabilityCapture.create({
        data: {
          backendReadinessMessage: input.backendReadinessMessage,
          backendReadinessStatus: input.backendReadinessStatus,
          capturedAt: input.capturedAt,
          criticalAlertCount: input.criticalAlertCount,
          observabilityMessage: input.observabilityMessage,
          observabilityStatus: input.observabilityStatus,
          oldestQueuedAgeSeconds: input.oldestQueuedAgeSeconds,
          oldestRunningAgeSeconds: input.oldestRunningAgeSeconds,
          ownerUserId: input.ownerUserId,
          queueActiveCount: input.queueActiveCount,
          queueCompletedCount: input.queueCompletedCount,
          queueConcurrency: input.queueConcurrency,
          queueDelayedCount: input.queueDelayedCount,
          queueFailedCount: input.queueFailedCount,
          queuePausedCount: input.queuePausedCount,
          queueStatus: input.queueStatus,
          queueWaitingCount: input.queueWaitingCount,
          warningAlertCount: input.warningAlertCount,
          windowSnapshots: {
            create: input.windows.map((window) => ({
              averageCompletionSeconds: window.averageCompletionSeconds,
              capturedAt: window.capturedAt,
              failedCount: window.failedCount,
              from: window.from,
              label: window.label,
              maxCompletionSeconds: window.maxCompletionSeconds,
              ownerUserId: window.ownerUserId,
              queuedCount: window.queuedCount,
              runningCount: window.runningCount,
              storedAssetCount: window.storedAssetCount,
              succeededCount: window.succeededCount,
              successRatePercent: window.successRatePercent,
              totalCount: window.totalCount,
              windowKey: window.windowKey
            }))
          },
          workerAdapter: input.workerAdapter
        }
      });
    },

    listRecentForOwnerUserId(input: { limit: number; ownerUserId: string }) {
      return database.opsObservabilityCapture.findMany({
        include: opsObservabilityCaptureInclude,
        orderBy: [
          {
            capturedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: input.limit,
        where: {
          ownerUserId: input.ownerUserId
        }
      });
    }
  };
}

export type OpsObservabilityCaptureRepository = ReturnType<
  typeof createOpsObservabilityCaptureRepository
>;
