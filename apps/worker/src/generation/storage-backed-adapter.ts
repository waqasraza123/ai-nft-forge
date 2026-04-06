import {
  createObjectStorageClient,
  copyStorageObject,
  deleteStorageObject,
  headStorageObject,
  sanitizeStorageFileName
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

export type MaterializedGeneratedAsset = {
  byteSize: number | null;
  contentType: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

type StorageBackedGenerationAdapterDependencies = {
  logger: Logger;
  storageClient: ReturnType<typeof createObjectStorageClient>;
};

type MaterializeGenerationOutputsInput = {
  generationRequest: {
    id: string;
    ownerUserId: string;
    pipelineKey: string;
    requestedVariantCount: number;
    sourceAssetId: string;
  };
  sourceAsset: {
    contentType: string;
    originalFilename: string;
    storageBucket: string;
    storageObjectKey: string;
  };
};

function resolveOutputExtension(input: {
  contentType: string;
  originalFilename: string;
}) {
  const fileNameMatch = /\.([A-Za-z0-9]+)$/.exec(input.originalFilename);

  if (fileNameMatch?.[1]) {
    return fileNameMatch[1].toLowerCase();
  }

  switch (input.contentType) {
    case "image/avif":
      return "avif";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function resolveOutputBaseName(originalFilename: string) {
  const sanitizedFileName = sanitizeStorageFileName(originalFilename);
  const withoutExtension = sanitizedFileName.replace(/\.[^.]+$/, "");

  return withoutExtension.length > 0 ? withoutExtension : "generated-asset";
}

export function createStorageBackedGenerationAdapter({
  logger,
  storageClient
}: StorageBackedGenerationAdapterDependencies) {
  return {
    async cleanupMaterializedOutputs(outputs: MaterializedGeneratedAsset[]) {
      await Promise.all(
        outputs.map(async (output) =>
          deleteStorageObject({
            bucket: output.storageBucket,
            client: storageClient,
            key: output.storageObjectKey
          })
        )
      );
    },

    async materializeGenerationOutputs(
      input: MaterializeGenerationOutputsInput
    ): Promise<{
      generatedAssets: MaterializedGeneratedAsset[];
      outputGroupKey: string;
    }> {
      const outputGroupKey = [
        "generated-assets",
        input.generationRequest.ownerUserId,
        input.generationRequest.id
      ].join("/");
      const outputFileExtension = resolveOutputExtension({
        contentType: input.sourceAsset.contentType,
        originalFilename: input.sourceAsset.originalFilename
      });
      const outputBaseName = resolveOutputBaseName(
        input.sourceAsset.originalFilename
      );
      const generatedAssets: MaterializedGeneratedAsset[] = [];

      for (
        let variantIndex = 1;
        variantIndex <= input.generationRequest.requestedVariantCount;
        variantIndex += 1
      ) {
        const objectKey = [
          outputGroupKey,
          `variant-${String(variantIndex).padStart(2, "0")}-${outputBaseName}.${outputFileExtension}`
        ].join("/");

        await copyStorageObject({
          bucket: input.sourceAsset.storageBucket,
          client: storageClient,
          contentType: input.sourceAsset.contentType,
          key: objectKey,
          metadata: {
            generationRequestId: input.generationRequest.id,
            pipelineKey: input.generationRequest.pipelineKey,
            sourceAssetId: input.generationRequest.sourceAssetId,
            variantIndex: String(variantIndex)
          },
          sourceBucket: input.sourceAsset.storageBucket,
          sourceKey: input.sourceAsset.storageObjectKey
        });

        const copiedObjectHead = await headStorageObject({
          bucket: input.sourceAsset.storageBucket,
          client: storageClient,
          key: objectKey
        });

        if (!copiedObjectHead) {
          throw new Error(
            `Generated asset ${objectKey} was not found after materialization.`
          );
        }

        generatedAssets.push({
          byteSize: copiedObjectHead.byteSize,
          contentType:
            copiedObjectHead.contentType ?? input.sourceAsset.contentType,
          storageBucket: input.sourceAsset.storageBucket,
          storageObjectKey: objectKey,
          variantIndex
        });
      }

      logger.info("Materialized generated asset outputs", {
        generationRequestId: input.generationRequest.id,
        outputCount: generatedAssets.length,
        outputGroupKey,
        sourceAssetId: input.generationRequest.sourceAssetId
      });

      return {
        generatedAssets,
        outputGroupKey
      };
    }
  };
}
