import {
  createGeneratedAssetRepository,
  createGenerationRequestRepository,
  createSourceAssetRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";

import {
  createObjectStorageClient,
  createSignedSourceAssetUpload,
  getStorageConfig,
  headPrivateStorageObject
} from "./storage";
import { createSourceAssetService } from "./service";

export function createRuntimeSourceAssetService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);

  return createSourceAssetService({
    now: () => new Date(),
    repositories: {
      generatedAssetRepository: createGeneratedAssetRepository(databaseClient),
      generationRequestRepository:
        createGenerationRequestRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient)
    },
    storage: {
      createUploadDescriptor: (input) =>
        createSignedSourceAssetUpload({
          client: objectStorageClient,
          contentType: input.contentType,
          env: storageConfig,
          fileName: input.fileName,
          ownerUserId: input.ownerUserId
        }),
      headPrivateObject: (input) =>
        headPrivateStorageObject({
          bucket: input.bucket,
          client: objectStorageClient,
          key: input.key
        }),
      privateBucketName: storageConfig.S3_BUCKET_PRIVATE
    }
  });
}
