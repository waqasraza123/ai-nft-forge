import { generatedAssetDownloadIntentResponseSchema } from "@ai-nft-forge/shared";

import { GeneratedAssetServiceError } from "./error";

type GeneratedAssetRecord = {
  byteSize: number | null;
  contentType: string;
  createdAt: Date;
  generationRequestId: string;
  id: string;
  sourceAssetId: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

type GeneratedAssetRepositorySet = {
  generatedAssetRepository: {
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<GeneratedAssetRecord | null>;
  };
};

type GeneratedAssetStorageBoundary = {
  createDownloadDescriptor(input: { bucket: string; key: string }): Promise<{
    expiresAt: string;
    method: "GET";
    url: string;
  }>;
  headPrivateObject(input: { bucket: string; key: string }): Promise<{
    byteSize: number | null;
    contentType: string | null;
  } | null>;
};

type GeneratedAssetServiceDependencies = {
  repositories: GeneratedAssetRepositorySet;
  storage: GeneratedAssetStorageBoundary;
};

function serializeGeneratedAsset(asset: GeneratedAssetRecord) {
  return {
    byteSize: asset.byteSize,
    contentType: asset.contentType,
    createdAt: asset.createdAt.toISOString(),
    generationRequestId: asset.generationRequestId,
    id: asset.id,
    sourceAssetId: asset.sourceAssetId,
    storageBucket: asset.storageBucket,
    storageObjectKey: asset.storageObjectKey,
    variantIndex: asset.variantIndex
  };
}

export function createGeneratedAssetService(
  dependencies: GeneratedAssetServiceDependencies
) {
  return {
    async createDownloadIntent(input: {
      generatedAssetId: string;
      ownerUserId: string;
    }) {
      const asset =
        await dependencies.repositories.generatedAssetRepository.findByIdForOwner(
          {
            id: input.generatedAssetId,
            ownerUserId: input.ownerUserId
          }
        );

      if (!asset) {
        throw new GeneratedAssetServiceError(
          "GENERATED_ASSET_NOT_FOUND",
          "Generated asset was not found.",
          404
        );
      }

      const objectHead = await dependencies.storage.headPrivateObject({
        bucket: asset.storageBucket,
        key: asset.storageObjectKey
      });

      if (!objectHead) {
        throw new GeneratedAssetServiceError(
          "GENERATED_ASSET_NOT_FOUND",
          "Generated asset was not found.",
          404
        );
      }

      const download = await dependencies.storage.createDownloadDescriptor({
        bucket: asset.storageBucket,
        key: asset.storageObjectKey
      });

      return generatedAssetDownloadIntentResponseSchema.parse({
        asset: serializeGeneratedAsset({
          ...asset,
          byteSize: objectHead.byteSize ?? asset.byteSize,
          contentType: objectHead.contentType ?? asset.contentType
        }),
        download
      });
    }
  };
}
