import {
  createBrandRepository,
  createCollectionDraftItemRepository,
  createCollectionDraftRepository,
  createGeneratedAssetRepository,
  createPublishedCollectionItemRepository,
  createPublishedCollectionMintRepository,
  createPublishedCollectionRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  copyStorageObject,
  createPublicStorageUrl,
  createObjectStorageClient,
  createSignedStorageDownload,
  deleteStorageObject,
  getStorageConfig
} from "@ai-nft-forge/shared";

import { createPublicCollectionService } from "./public-service";
import { createCollectionDraftService } from "./service";

function createCollectionRepositories(database: DatabaseExecutor) {
  return {
    brandRepository: createBrandRepository(database),
    collectionDraftItemRepository:
      createCollectionDraftItemRepository(database),
    collectionDraftRepository: createCollectionDraftRepository(database),
    generatedAssetRepository: createGeneratedAssetRepository(database),
    publishedCollectionItemRepository:
      createPublishedCollectionItemRepository(database),
    publishedCollectionMintRepository:
      createPublishedCollectionMintRepository(database),
    publishedCollectionRepository: createPublishedCollectionRepository(database)
  };
}

export function createRuntimeCollectionDraftService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);

  return createCollectionDraftService({
    now: () => new Date(),
    repositories: createCollectionRepositories(databaseClient),
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, (transaction) =>
        operation(createCollectionRepositories(transaction))
      ),
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
      deletePublishedAsset: (input) =>
        deleteStorageObject({
          bucket: input.bucket,
          client: objectStorageClient,
          key: input.key
        })
    }
  });
}

export function createRuntimePublicCollectionService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);

  return createPublicCollectionService({
    repositories: {
      brandRepository: createBrandRepository(databaseClient),
      publishedCollectionRepository:
        createPublishedCollectionRepository(databaseClient)
    },
    storage: {
      createDownloadDescriptor: (input) =>
        createSignedStorageDownload({
          bucket: input.bucket,
          client: objectStorageClient,
          expiresInSeconds:
            storageConfig.GENERATED_ASSET_DOWNLOAD_URL_TTL_SECONDS,
          key: input.key
        }),
      createPublicUrl: (input) =>
        createPublicStorageUrl({
          bucket: input.bucket,
          endpoint: storageConfig.S3_ENDPOINT,
          forcePathStyle: storageConfig.S3_FORCE_PATH_STYLE,
          key: input.key
        })
    }
  });
}
