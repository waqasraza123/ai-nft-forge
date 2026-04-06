import {
  generationBackendResponseSchema,
  generationBackendRequestSchema,
  sanitizeStorageFileName,
  type GenerationBackendRequest
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import { GenerationBackendServiceError } from "./error.js";
import type { GenerationArtifactProvider } from "./provider.js";

type StorageBoundary = {
  deleteObject(input: { bucket: string; key: string }): Promise<void>;
  getObjectBytes(input: { bucket: string; key: string }): Promise<{
    body: Uint8Array;
    byteSize: number;
    contentType: string | null;
  }>;
  putObject(input: {
    body: Uint8Array;
    bucket: string;
    contentType: string;
    key: string;
    metadata?: Record<string, string>;
  }): Promise<void>;
};

type GenerationBackendServiceDependencies = {
  logger: Logger;
  provider: GenerationArtifactProvider;
  storage: StorageBoundary;
  targetBucketName: string;
};

const supportedSourceContentTypePrefix = "image/";

function resolveOutputBaseName(originalFilename: string) {
  const sanitizedFileName = sanitizeStorageFileName(originalFilename);
  const withoutExtension = sanitizedFileName.replace(/\.[^.]+$/, "");

  return withoutExtension.length > 0 ? withoutExtension : "generated-asset";
}

function resolveOutputObjectKey(input: {
  fileExtension: string;
  outputBaseName: string;
  outputGroupKey: string;
  variantIndex: number;
}) {
  return [
    input.outputGroupKey,
    `variant-${String(input.variantIndex).padStart(2, "0")}-${input.outputBaseName}.${input.fileExtension}`
  ].join("/");
}

export function createGenerationBackendService({
  logger,
  provider,
  storage,
  targetBucketName
}: GenerationBackendServiceDependencies) {
  return {
    async generate(
      rawInput: GenerationBackendRequest
    ): Promise<ReturnType<typeof generationBackendResponseSchema.parse>> {
      const input = generationBackendRequestSchema.parse(rawInput);

      if (
        !input.sourceAsset.contentType.startsWith(
          supportedSourceContentTypePrefix
        )
      ) {
        throw new GenerationBackendServiceError(
          "SOURCE_ASSET_UNSUPPORTED",
          "The source asset content type is not supported by the generation backend.",
          422
        );
      }

      if (input.target.bucket !== targetBucketName) {
        throw new GenerationBackendServiceError(
          "INVALID_REQUEST",
          `Generation backend target bucket ${input.target.bucket} is not allowed.`,
          400
        );
      }

      let sourceObject: {
        body: Uint8Array;
        byteSize: number;
        contentType: string | null;
      };

      try {
        sourceObject = await storage.getObjectBytes({
          bucket: input.sourceAsset.storageBucket,
          key: input.sourceAsset.storageObjectKey
        });
      } catch (error) {
        throw new GenerationBackendServiceError(
          "SOURCE_OBJECT_MISSING",
          "The source asset object is not available to the generation backend.",
          404,
          {
            cause: error
          }
        );
      }

      const outputBaseName = resolveOutputBaseName(
        input.sourceAsset.originalFilename
      );
      const renderedArtifacts = await provider.generateArtifacts({
        generationRequest: input,
        outputGroupKey: input.target.outputGroupKey,
        sourceObject
      });

      if (renderedArtifacts.length !== input.requestedVariantCount) {
        throw new GenerationBackendServiceError(
          "MODEL_BACKEND_ERROR",
          `Generation provider returned ${renderedArtifacts.length} artifacts for a request expecting ${input.requestedVariantCount}.`,
          502
        );
      }

      const uploadedArtifacts: Array<{
        contentType: string;
        storageBucket: string;
        storageObjectKey: string;
        variantIndex: number;
      }> = [];

      try {
        for (const artifact of renderedArtifacts) {
          const storageObjectKey = resolveOutputObjectKey({
            fileExtension: artifact.fileExtension,
            outputBaseName,
            outputGroupKey: input.target.outputGroupKey,
            variantIndex: artifact.variantIndex
          });

          await storage.putObject({
            body: artifact.body,
            bucket: input.target.bucket,
            contentType: artifact.contentType,
            key: storageObjectKey,
            metadata: {
              generationRequestId: input.generationRequestId,
              generationProviderKind: provider.kind,
              pipelineKey: input.pipelineKey,
              sourceAssetId: input.sourceAsset.storageObjectKey,
              sourceContentType:
                sourceObject.contentType ?? input.sourceAsset.contentType,
              sourceObjectByteSize: String(sourceObject.byteSize),
              variantIndex: String(artifact.variantIndex)
            }
          });

          uploadedArtifacts.push({
            contentType: artifact.contentType,
            storageBucket: input.target.bucket,
            storageObjectKey,
            variantIndex: artifact.variantIndex
          });
        }
      } catch (error) {
        await Promise.allSettled(
          uploadedArtifacts.map(async (artifact) =>
            storage.deleteObject({
              bucket: artifact.storageBucket,
              key: artifact.storageObjectKey
            })
          )
        );

        logger.error(
          "Generation backend failed and cleaned up partial outputs",
          {
            generationRequestId: input.generationRequestId,
            outputGroupKey: input.target.outputGroupKey,
            outputCount: uploadedArtifacts.length,
            sourceAssetId: input.sourceAsset.storageObjectKey
          }
        );

        throw error;
      }

      logger.info("Generated backend artifacts", {
        generationRequestId: input.generationRequestId,
        outputCount: uploadedArtifacts.length,
        outputGroupKey: input.target.outputGroupKey,
        providerKind: provider.kind,
        sourceAssetId: input.sourceAsset.storageObjectKey
      });

      return generationBackendResponseSchema.parse({
        artifacts: uploadedArtifacts,
        outputGroupKey: input.target.outputGroupKey
      });
    }
  };
}
