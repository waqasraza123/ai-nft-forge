import {
  generatedAssetDownloadIntentResponseSchema,
  generatedAssetModerationResponseSchema,
  generatedAssetModerationUpdateRequestSchema,
  type GeneratedAssetModerationStatus
} from "@ai-nft-forge/shared";

import { GeneratedAssetServiceError } from "./error";

type GeneratedAssetRecord = {
  byteSize: number | null;
  contentType: string;
  createdAt: Date;
  generationRequestId: string;
  id: string;
  moderatedAt: Date | null;
  moderationStatus: GeneratedAssetModerationStatus;
  sourceAssetId: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

type GeneratedAssetRepositorySet = {
  generatedAssetRepository: {
    findByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<GeneratedAssetRecord | null>;
    updateModerationByIdForWorkspace(input: {
      id: string;
      moderatedAt: Date | null;
      moderationStatus: GeneratedAssetModerationStatus;
      workspaceId: string;
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
  now: () => Date;
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
    moderatedAt: asset.moderatedAt?.toISOString() ?? null,
    moderationStatus: asset.moderationStatus,
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
      workspaceId: string;
    }) {
      const asset =
        await dependencies.repositories.generatedAssetRepository.findByIdForWorkspace(
          {
            id: input.generatedAssetId,
            workspaceId: input.workspaceId
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
    },

    async updateModeration(input: {
      generatedAssetId: string;
      moderationStatus: GeneratedAssetModerationStatus;
      workspaceId: string;
    }) {
      const parsedInput = generatedAssetModerationUpdateRequestSchema.parse({
        moderationStatus: input.moderationStatus
      });
      const updatedAsset =
        await dependencies.repositories.generatedAssetRepository.updateModerationByIdForWorkspace(
          {
            id: input.generatedAssetId,
            moderatedAt:
              parsedInput.moderationStatus === "pending_review"
                ? null
                : dependencies.now(),
            moderationStatus: parsedInput.moderationStatus,
            workspaceId: input.workspaceId
          }
        );

      if (!updatedAsset) {
        throw new GeneratedAssetServiceError(
          "GENERATED_ASSET_NOT_FOUND",
          "Generated asset was not found.",
          404
        );
      }

      return generatedAssetModerationResponseSchema.parse({
        asset: serializeGeneratedAsset(updatedAsset)
      });
    }
  };
}
