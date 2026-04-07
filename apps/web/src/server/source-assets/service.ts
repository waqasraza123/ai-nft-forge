import {
  generatedAssetSummarySchema,
  generationRequestSummarySchema,
  generationResultSummarySchema,
  sourceAssetCompletionResponseSchema,
  sourceAssetContentTypeSchema,
  sourceAssetListResponseSchema,
  sourceAssetSummarySchema,
  sourceAssetUploadIntentRequestSchema,
  sourceAssetUploadIntentResponseSchema,
  type GenerationRequestStatus,
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

type GenerationRequestRecord = {
  completedAt: Date | null;
  createdAt: Date;
  failedAt: Date | null;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
  pipelineKey: string;
  queueJobId: string | null;
  requestedVariantCount: number;
  resultJson: unknown;
  sourceAssetId: string;
  startedAt: Date | null;
  status: GenerationRequestStatus;
};

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

type SourceAssetRepositorySet = {
  generatedAssetRepository: {
    listByGenerationRequestIds(
      generationRequestIds: string[]
    ): Promise<GeneratedAssetRecord[]>;
  };
  generationRequestRepository: {
    listBySourceAssetIds(
      sourceAssetIds: string[]
    ): Promise<GenerationRequestRecord[]>;
  };
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

function compareGenerationRequestsDesc(
  left: GenerationRequestRecord,
  right: GenerationRequestRecord
) {
  const createdAtDifference =
    right.createdAt.getTime() - left.createdAt.getTime();

  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return right.id.localeCompare(left.id);
}

function compareGeneratedAssets(
  left: GeneratedAssetRecord,
  right: GeneratedAssetRecord
) {
  if (left.variantIndex !== right.variantIndex) {
    return left.variantIndex - right.variantIndex;
  }

  return left.id.localeCompare(right.id);
}

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

function serializeGeneratedAsset(asset: GeneratedAssetRecord) {
  return generatedAssetSummarySchema.parse({
    byteSize: asset.byteSize,
    contentType: asset.contentType,
    createdAt: asset.createdAt.toISOString(),
    generationRequestId: asset.generationRequestId,
    id: asset.id,
    sourceAssetId: asset.sourceAssetId,
    storageBucket: asset.storageBucket,
    storageObjectKey: asset.storageObjectKey,
    variantIndex: asset.variantIndex
  });
}

function serializeGenerationRequest(
  generationRequest: GenerationRequestRecord | null,
  generatedAssets: GeneratedAssetRecord[]
) {
  if (!generationRequest) {
    return null;
  }

  return generationRequestSummarySchema.parse({
    completedAt: generationRequest.completedAt?.toISOString() ?? null,
    createdAt: generationRequest.createdAt.toISOString(),
    failedAt: generationRequest.failedAt?.toISOString() ?? null,
    failureCode: generationRequest.failureCode,
    failureMessage: generationRequest.failureMessage,
    generatedAssets: generatedAssets.map((asset) =>
      serializeGeneratedAsset(asset)
    ),
    id: generationRequest.id,
    pipelineKey: generationRequest.pipelineKey,
    queueJobId: generationRequest.queueJobId,
    requestedVariantCount: generationRequest.requestedVariantCount,
    result: generationRequest.resultJson
      ? generationResultSummarySchema.parse(generationRequest.resultJson)
      : null,
    sourceAssetId: generationRequest.sourceAssetId,
    startedAt: generationRequest.startedAt?.toISOString() ?? null,
    status: generationRequest.status
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
      const generationRequests =
        await dependencies.repositories.generationRequestRepository.listBySourceAssetIds(
          assets.map((asset) => asset.id)
        );
      const generatedAssets =
        await dependencies.repositories.generatedAssetRepository.listByGenerationRequestIds(
          generationRequests.map((generationRequest) => generationRequest.id)
        );
      const generationHistoryBySourceAssetId = new Map<
        string,
        GenerationRequestRecord[]
      >();
      const generatedAssetsByGenerationRequestId = new Map<
        string,
        GeneratedAssetRecord[]
      >();

      for (const generationRequest of [...generationRequests].sort(
        compareGenerationRequestsDesc
      )) {
        const currentGenerationHistory =
          generationHistoryBySourceAssetId.get(
            generationRequest.sourceAssetId
          ) ?? [];

        currentGenerationHistory.push(generationRequest);
        generationHistoryBySourceAssetId.set(
          generationRequest.sourceAssetId,
          currentGenerationHistory
        );
      }

      for (const generatedAsset of generatedAssets) {
        const currentGeneratedAssets =
          generatedAssetsByGenerationRequestId.get(
            generatedAsset.generationRequestId
          ) ?? [];

        currentGeneratedAssets.push(generatedAsset);
        currentGeneratedAssets.sort(compareGeneratedAssets);
        generatedAssetsByGenerationRequestId.set(
          generatedAsset.generationRequestId,
          currentGeneratedAssets
        );
      }

      return sourceAssetListResponseSchema.parse({
        assets: assets.map((asset) => {
          const generationHistoryRecords =
            generationHistoryBySourceAssetId.get(asset.id) ?? [];
          const generationHistory = generationHistoryRecords.map(
            (generationRequest) =>
              serializeGenerationRequest(
                generationRequest,
                generatedAssetsByGenerationRequestId.get(
                  generationRequest.id
                ) ?? []
              )
          );
          const latestGeneration = generationHistory[0] ?? null;

          return {
            ...serializeSourceAssetSummary(asset),
            generationHistory,
            latestGeneratedAssets: latestGeneration?.generatedAssets ?? [],
            latestGeneration
          };
        })
      });
    }
  };
}
