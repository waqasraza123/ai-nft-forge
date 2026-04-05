import {
  sourceAssetCompletionResponseSchema,
  sourceAssetContentTypeSchema,
  sourceAssetListResponseSchema,
  sourceAssetSummarySchema,
  sourceAssetUploadIntentRequestSchema,
  sourceAssetUploadIntentResponseSchema,
  type SourceAssetContentType,
  type SourceAssetStatus
} from "@ai-nft-forge/shared";

import { SourceAssetServiceError } from "./error";

type SourceAssetRecord = {
  byteSize: number | null;
  contentType: string;
  createdAt: Date;
  id: string;
  originalFilename: string;
  ownerUserId: string;
  status: SourceAssetStatus;
  storageBucket: string;
  storageObjectKey: string;
  uploadedAt: Date | null;
};

type SourceAssetRepositorySet = {
  sourceAssetRepository: {
    createPendingUpload(input: {
      contentType: string;
      originalFilename: string;
      ownerUserId: string;
      storageBucket: string;
      storageObjectKey: string;
    }): Promise<SourceAssetRecord>;
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<SourceAssetRecord | null>;
    listByOwnerUserId(ownerUserId: string): Promise<SourceAssetRecord[]>;
    updateUploadState(input: {
      byteSize: number | null;
      id: string;
      status: SourceAssetStatus;
      uploadedAt: Date | null;
    }): Promise<SourceAssetRecord>;
  };
};

type StorageBoundary = {
  createUploadDescriptor(input: {
    contentType: SourceAssetContentType;
    fileName: string;
    ownerUserId: string;
  }): Promise<{
    expiresAt: string;
    headers: {
      "content-type": SourceAssetContentType;
    };
    method: "PUT";
    objectKey: string;
    url: string;
  }>;
  headPrivateObject(input: { bucket: string; key: string }): Promise<{
    byteSize: number | null;
    contentType: string | null;
  } | null>;
  privateBucketName: string;
};

type SourceAssetServiceDependencies = {
  now: () => Date;
  repositories: SourceAssetRepositorySet;
  storage: StorageBoundary;
};

function serializeSourceAssetSummary(asset: SourceAssetRecord) {
  return sourceAssetSummarySchema.parse({
    byteSize: asset.byteSize,
    contentType: asset.contentType,
    createdAt: asset.createdAt.toISOString(),
    id: asset.id,
    originalFilename: asset.originalFilename,
    status: asset.status,
    uploadedAt: asset.uploadedAt?.toISOString() ?? null
  });
}

export function createSourceAssetService(
  dependencies: SourceAssetServiceDependencies
) {
  return {
    async createUploadIntent(input: {
      contentType: string;
      fileName: string;
      ownerUserId: string;
    }) {
      const parsedInput = sourceAssetUploadIntentRequestSchema.parse(input);
      const upload = await dependencies.storage.createUploadDescriptor({
        contentType: sourceAssetContentTypeSchema.parse(
          parsedInput.contentType
        ),
        fileName: parsedInput.fileName,
        ownerUserId: input.ownerUserId
      });
      const asset =
        await dependencies.repositories.sourceAssetRepository.createPendingUpload(
          {
            contentType: parsedInput.contentType,
            originalFilename: parsedInput.fileName,
            ownerUserId: input.ownerUserId,
            storageBucket: dependencies.storage.privateBucketName,
            storageObjectKey: upload.objectKey
          }
        );

      return sourceAssetUploadIntentResponseSchema.parse({
        asset: serializeSourceAssetSummary(asset),
        upload
      });
    },

    async completeUpload(input: { assetId: string; ownerUserId: string }) {
      const asset =
        await dependencies.repositories.sourceAssetRepository.findByIdForOwner({
          id: input.assetId,
          ownerUserId: input.ownerUserId
        });

      if (!asset) {
        throw new SourceAssetServiceError(
          "ASSET_NOT_FOUND",
          "Source asset was not found.",
          404
        );
      }

      if (asset.status === "uploaded") {
        return sourceAssetCompletionResponseSchema.parse({
          asset: serializeSourceAssetSummary(asset)
        });
      }

      const objectHead = await dependencies.storage.headPrivateObject({
        bucket: asset.storageBucket,
        key: asset.storageObjectKey
      });

      if (!objectHead) {
        throw new SourceAssetServiceError(
          "OBJECT_MISSING",
          "Uploaded source asset object is not available yet.",
          409
        );
      }

      const uploadedAsset =
        await dependencies.repositories.sourceAssetRepository.updateUploadState(
          {
            byteSize: objectHead.byteSize,
            id: asset.id,
            status: "uploaded",
            uploadedAt: dependencies.now()
          }
        );

      return sourceAssetCompletionResponseSchema.parse({
        asset: serializeSourceAssetSummary(uploadedAsset)
      });
    },

    async listSourceAssets(input: { ownerUserId: string }) {
      const assets =
        await dependencies.repositories.sourceAssetRepository.listByOwnerUserId(
          input.ownerUserId
        );

      return sourceAssetListResponseSchema.parse({
        assets: assets.map((asset) => serializeSourceAssetSummary(asset))
      });
    }
  };
}
