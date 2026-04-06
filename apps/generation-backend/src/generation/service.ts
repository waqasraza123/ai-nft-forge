import sharp from "sharp";

import {
  generationBackendResponseSchema,
  generationBackendRequestSchema,
  sanitizeStorageFileName,
  type GenerationBackendRequest
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import { GenerationBackendServiceError } from "./error.js";

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
  storage: StorageBoundary;
  targetBucketName: string;
};

const outputContentType = "image/png";
const outputFileExtension = "png";
const supportedSourceContentTypePrefix = "image/";

function resolveOutputBaseName(originalFilename: string) {
  const sanitizedFileName = sanitizeStorageFileName(originalFilename);
  const withoutExtension = sanitizedFileName.replace(/\.[^.]+$/, "");

  return withoutExtension.length > 0 ? withoutExtension : "generated-asset";
}

function resolveOutputObjectKey(input: {
  outputBaseName: string;
  outputGroupKey: string;
  variantIndex: number;
}) {
  return [
    input.outputGroupKey,
    `variant-${String(input.variantIndex).padStart(2, "0")}-${input.outputBaseName}.${outputFileExtension}`
  ].join("/");
}

function applyVariantTransform(image: sharp.Sharp, variantIndex: number) {
  switch (((variantIndex - 1) % 8) + 1) {
    case 1:
      return image.modulate({
        brightness: 1.03,
        hue: 8,
        saturation: 1.16
      });
    case 2:
      return image.greyscale().tint("#8db1d8").linear(1.08, -4);
    case 3:
      return image.flop().modulate({
        brightness: 1.02,
        hue: -16,
        saturation: 1.24
      });
    case 4:
      return image.blur(0.35).gamma(1.12).modulate({
        brightness: 0.96,
        saturation: 0.9
      });
    case 5:
      return image.tint("#f6a95d").modulate({
        brightness: 1.01,
        saturation: 1.12
      });
    case 6:
      return image.greyscale().linear(1.24, -10).sharpen();
    case 7:
      return image.tint("#67b8ff").modulate({
        brightness: 1.04,
        saturation: 1.18
      });
    case 8:
      return image.modulate({
        brightness: 0.98,
        hue: 22,
        saturation: 1.08
      });
    default:
      return image;
  }
}

async function renderVariantImage(input: {
  sourceBytes: Uint8Array;
  variantIndex: number;
}) {
  try {
    return await applyVariantTransform(
      sharp(input.sourceBytes, {
        limitInputPixels: 40_000_000
      })
        .rotate()
        .resize({
          fit: "inside",
          height: 1536,
          width: 1536,
          withoutEnlargement: true
        }),
      input.variantIndex
    )
      .sharpen()
      .png({
        compressionLevel: 9
      })
      .toBuffer();
  } catch (error) {
    throw new GenerationBackendServiceError(
      "SOURCE_ASSET_UNSUPPORTED",
      "The source asset could not be transformed by the generation backend.",
      422,
      {
        cause: error
      }
    );
  }
}

export function createGenerationBackendService({
  logger,
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
      const uploadedArtifacts: Array<{
        contentType: string;
        storageBucket: string;
        storageObjectKey: string;
        variantIndex: number;
      }> = [];

      try {
        for (
          let variantIndex = 1;
          variantIndex <= input.requestedVariantCount;
          variantIndex += 1
        ) {
          const body = await renderVariantImage({
            sourceBytes: sourceObject.body,
            variantIndex
          });
          const storageObjectKey = resolveOutputObjectKey({
            outputBaseName,
            outputGroupKey: input.target.outputGroupKey,
            variantIndex
          });

          await storage.putObject({
            body,
            bucket: input.target.bucket,
            contentType: outputContentType,
            key: storageObjectKey,
            metadata: {
              generationRequestId: input.generationRequestId,
              pipelineKey: input.pipelineKey,
              sourceAssetId: input.sourceAsset.storageObjectKey,
              sourceContentType:
                sourceObject.contentType ?? input.sourceAsset.contentType,
              sourceObjectByteSize: String(sourceObject.byteSize),
              variantIndex: String(variantIndex)
            }
          });

          uploadedArtifacts.push({
            contentType: outputContentType,
            storageBucket: input.target.bucket,
            storageObjectKey,
            variantIndex
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

      logger.info("Generated transformed backend artifacts", {
        generationRequestId: input.generationRequestId,
        outputCount: uploadedArtifacts.length,
        outputGroupKey: input.target.outputGroupKey,
        sourceAssetId: input.sourceAsset.storageObjectKey
      });

      return generationBackendResponseSchema.parse({
        artifacts: uploadedArtifacts,
        outputGroupKey: input.target.outputGroupKey
      });
    }
  };
}
