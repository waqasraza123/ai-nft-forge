import {
  createGeneratedAssetRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";
import {
  createObjectStorageClient,
  createSignedStorageDownload,
  getStorageConfig,
  headStorageObject
} from "@ai-nft-forge/shared";

import { createGeneratedAssetService } from "./service";

export function createRuntimeGeneratedAssetService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const objectStorageClient = createObjectStorageClient(rawEnvironment);
  const storageConfig = getStorageConfig(rawEnvironment);

  return createGeneratedAssetService({
    repositories: {
      generatedAssetRepository: createGeneratedAssetRepository(databaseClient)
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
      headPrivateObject: (input) =>
        headStorageObject({
          bucket: input.bucket,
          client: objectStorageClient,
          key: input.key
        })
    }
  });
}
