import {
  createCollectionDraftRepository,
  createDatabaseClient,
  createGeneratedAssetRepository,
  createOpsReconciliationIssueRepository,
  createOpsReconciliationRunRepository,
  createPublishedCollectionItemRepository,
  createPublishedCollectionRepository,
  createSourceAssetRepository,
  createUserRepository,
  type DatabaseClient
} from "@ai-nft-forge/database";
import {
  copyStorageObject,
  createObjectStorageClient,
  createOpsReconciliationService,
  getStorageConfig,
  headStorageObject,
  parseWorkerEnv
} from "@ai-nft-forge/shared";

import { createLogger, type Logger } from "../lib/logger.js";
import { createPublishedCollectionOnchainInspector } from "./onchain-reconciliation.js";

type ReconcileRuntimeInput = {
  databaseClient: DatabaseClient;
  logger: Logger;
  rawEnvironment?: NodeJS.ProcessEnv;
};

export type OpsReconciliationSummary = {
  failedRunCount: number;
  issueCount: number;
  ownerCount: number;
  runCount: number;
};

export async function reconcileRuntimeOpsWithDependencies({
  databaseClient,
  logger,
  rawEnvironment = process.env
}: ReconcileRuntimeInput): Promise<OpsReconciliationSummary> {
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);
  const userRepository = createUserRepository(databaseClient);
  const ownerUserIds = await userRepository.listIds();
  const onchainInspector =
    createPublishedCollectionOnchainInspector(rawEnvironment);
  const service = createOpsReconciliationService({
    now: () => new Date(),
    onchain: onchainInspector,
    repositories: {
      collectionDraftRepository: createCollectionDraftRepository(databaseClient),
      generatedAssetRepository: createGeneratedAssetRepository(databaseClient),
      opsReconciliationIssueRepository:
        createOpsReconciliationIssueRepository(databaseClient),
      opsReconciliationRunRepository:
        createOpsReconciliationRunRepository(databaseClient),
      publishedCollectionItemRepository:
        createPublishedCollectionItemRepository(databaseClient),
      publishedCollectionRepository:
        createPublishedCollectionRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient),
      userRepository
    },
    storage: {
      copyPublishedAsset: async (input) => {
        await copyStorageObject({
          bucket: storageConfig.S3_BUCKET_PUBLIC,
          client: objectStorageClient,
          contentType: input.contentType,
          key: input.destinationKey,
          sourceBucket: input.sourceBucket,
          sourceKey: input.sourceKey
        });

        return {
          bucket: storageConfig.S3_BUCKET_PUBLIC,
          key: input.destinationKey
        };
      },
      headPrivateObject: (input) =>
        headStorageObject({
          bucket: input.bucket,
          client: objectStorageClient,
          key: input.key
        }),
      headPublicObject: (input) =>
        headStorageObject({
          bucket: input.bucket,
          client: objectStorageClient,
          key: input.key
        })
    }
  });
  let issueCount = 0;
  let failedRunCount = 0;
  let runCount = 0;

  try {
    for (const ownerUserId of ownerUserIds) {
      const result = await service.run({
        ownerUserId
      });

      runCount += 1;
      issueCount += result.run.issueCount;

      if (result.run.status === "failed") {
        failedRunCount += 1;
      }
    }

    logger.info("Ops reconciliation completed", {
      failedRunCount,
      issueCount,
      ownerCount: ownerUserIds.length,
      runCount
    });

    return {
      failedRunCount,
      issueCount,
      ownerCount: ownerUserIds.length,
      runCount
    };
  } finally {
    objectStorageClient.destroy();
  }
}

export async function reconcileRuntimeOps(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const env = parseWorkerEnv(rawEnvironment);
  const logger = createLogger({
    level: env.LOG_LEVEL,
    service: env.WORKER_SERVICE_NAME
  });
  const databaseClient = createDatabaseClient(rawEnvironment);

  try {
    return await reconcileRuntimeOpsWithDependencies({
      databaseClient,
      logger,
      rawEnvironment
    });
  } finally {
    await databaseClient.$disconnect();
  }
}
