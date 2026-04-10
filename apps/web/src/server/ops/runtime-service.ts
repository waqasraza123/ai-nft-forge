import {
  createCollectionDraftRepository,
  createGeneratedAssetRepository,
  createOpsAlertEscalationPolicyRepository,
  createOpsAlertMuteRepository,
  createOpsAlertRoutingPolicyRepository,
  createOpsAlertSchedulePolicyRepository,
  createOpsAlertStateRepository,
  createOpsReconciliationIssueRepository,
  createOpsReconciliationRunRepository,
  createPublishedCollectionItemRepository,
  createPublishedCollectionRepository,
  createSourceAssetRepository,
  createUserRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";
import {
  copyStorageObject,
  createObjectStorageClient,
  getStorageConfig,
  headStorageObject
} from "@ai-nft-forge/shared";

import { createOpsService } from "./service";
import { createPublishedCollectionOnchainInspector } from "./onchain-reconciliation";

export function createRuntimeOpsService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);
  const onchainInspector =
    createPublishedCollectionOnchainInspector(rawEnvironment);

  return createOpsService({
    now: () => new Date(),
    onchain: onchainInspector,
    repositories: {
      collectionDraftRepository: createCollectionDraftRepository(databaseClient),
      generatedAssetRepository: createGeneratedAssetRepository(databaseClient),
      opsAlertEscalationPolicyRepository:
        createOpsAlertEscalationPolicyRepository(databaseClient),
      opsAlertMuteRepository: createOpsAlertMuteRepository(databaseClient),
      opsAlertRoutingPolicyRepository:
        createOpsAlertRoutingPolicyRepository(databaseClient),
      opsAlertSchedulePolicyRepository:
        createOpsAlertSchedulePolicyRepository(databaseClient),
      opsAlertStateRepository: createOpsAlertStateRepository(databaseClient),
      opsReconciliationIssueRepository:
        createOpsReconciliationIssueRepository(databaseClient),
      opsReconciliationRunRepository:
        createOpsReconciliationRunRepository(databaseClient),
      publishedCollectionItemRepository:
        createPublishedCollectionItemRepository(databaseClient),
      publishedCollectionRepository:
        createPublishedCollectionRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient),
      userRepository: createUserRepository(databaseClient)
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
}
