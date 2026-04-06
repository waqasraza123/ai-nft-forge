import {
  createObjectStorageClient,
  deleteStorageObject,
  generationBackendRequestSchema,
  generationBackendResponseSchema,
  headStorageObject
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import type {
  GenerationAdapter,
  MaterializeGenerationOutputsInput,
  MaterializeGenerationOutputsResult,
  MaterializedGeneratedAsset
} from "./adapter.js";
import { resolveGenerationOutputGroupKey } from "./adapter.js";

type HttpBackendGenerationAdapterDependencies = {
  authToken?: string;
  backendUrl: string;
  logger: Logger;
  storageClient: ReturnType<typeof createObjectStorageClient>;
  targetBucketName: string;
  timeoutMs: number;
};

function createBackendErrorMessage(input: {
  responseBody: string | null;
  status: number;
  statusText: string;
}) {
  const trimmedBody = input.responseBody?.trim() ?? "";

  if (trimmedBody.length > 0) {
    const message =
      trimmedBody.length > 240
        ? `${trimmedBody.slice(0, 237)}...`
        : trimmedBody;

    return `Generation backend request failed with status ${input.status} ${input.statusText}: ${message}`;
  }

  return `Generation backend request failed with status ${input.status} ${input.statusText}.`;
}

async function parseBackendResponse(response: Response) {
  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(
      createBackendErrorMessage({
        responseBody,
        status: response.status,
        statusText: response.statusText
      })
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(responseBody);
  } catch {
    throw new Error("Generation backend returned invalid JSON.");
  }

  return generationBackendResponseSchema.parse(parsedBody);
}

function assertBackendArtifacts(
  input: MaterializeGenerationOutputsInput,
  response: Awaited<ReturnType<typeof parseBackendResponse>>,
  targetBucketName: string,
  outputGroupKey: string
) {
  if (response.outputGroupKey !== outputGroupKey) {
    throw new Error(
      `Generation backend returned unexpected output group key ${response.outputGroupKey}.`
    );
  }

  if (
    response.artifacts.length !== input.generationRequest.requestedVariantCount
  ) {
    throw new Error(
      `Generation backend returned ${response.artifacts.length} artifacts for a request expecting ${input.generationRequest.requestedVariantCount}.`
    );
  }

  const seenVariantIndexes = new Set<number>();

  for (const artifact of response.artifacts) {
    if (artifact.storageBucket !== targetBucketName) {
      throw new Error(
        `Generation backend returned artifact in unexpected bucket ${artifact.storageBucket}.`
      );
    }

    if (!artifact.storageObjectKey.startsWith(`${outputGroupKey}/`)) {
      throw new Error(
        `Generation backend returned artifact outside the target output group: ${artifact.storageObjectKey}.`
      );
    }

    if (seenVariantIndexes.has(artifact.variantIndex)) {
      throw new Error(
        `Generation backend returned duplicate variant index ${artifact.variantIndex}.`
      );
    }

    seenVariantIndexes.add(artifact.variantIndex);
  }
}

async function resolveMaterializedArtifacts(input: {
  response: Awaited<ReturnType<typeof parseBackendResponse>>;
  storageClient: ReturnType<typeof createObjectStorageClient>;
}) {
  const generatedAssets: MaterializedGeneratedAsset[] = [];

  for (const artifact of input.response.artifacts) {
    const objectHead = await headStorageObject({
      bucket: artifact.storageBucket,
      client: input.storageClient,
      key: artifact.storageObjectKey
    });

    if (!objectHead) {
      throw new Error(
        `Generated asset ${artifact.storageObjectKey} was not found after backend completion.`
      );
    }

    generatedAssets.push({
      byteSize: objectHead.byteSize,
      contentType: objectHead.contentType ?? artifact.contentType,
      storageBucket: artifact.storageBucket,
      storageObjectKey: artifact.storageObjectKey,
      variantIndex: artifact.variantIndex
    });
  }

  generatedAssets.sort((left, right) => left.variantIndex - right.variantIndex);

  return generatedAssets;
}

export function createHttpBackendGenerationAdapter({
  authToken,
  backendUrl,
  logger,
  storageClient,
  targetBucketName,
  timeoutMs
}: HttpBackendGenerationAdapterDependencies): GenerationAdapter {
  return {
    async cleanupMaterializedOutputs(outputs) {
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
    ): Promise<MaterializeGenerationOutputsResult> {
      const outputGroupKey = resolveGenerationOutputGroupKey({
        generationRequestId: input.generationRequest.id,
        ownerUserId: input.generationRequest.ownerUserId
      });
      const requestBody = generationBackendRequestSchema.parse({
        generationRequestId: input.generationRequest.id,
        ownerUserId: input.generationRequest.ownerUserId,
        pipelineKey: input.generationRequest.pipelineKey,
        requestedVariantCount: input.generationRequest.requestedVariantCount,
        sourceAsset: input.sourceAsset,
        target: {
          bucket: targetBucketName,
          outputGroupKey
        }
      });

      let response: Response;

      try {
        response = await fetch(backendUrl, {
          body: JSON.stringify(requestBody),
          headers: {
            ...(authToken
              ? {
                  Authorization: `Bearer ${authToken}`
                }
              : {}),
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          method: "POST",
          signal: AbortSignal.timeout(timeoutMs)
        });
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          throw new Error(
            `Generation backend request timed out after ${timeoutMs}ms.`,
            {
              cause: error
            }
          );
        }

        throw error;
      }

      const parsedResponse = await parseBackendResponse(response);

      assertBackendArtifacts(
        input,
        parsedResponse,
        targetBucketName,
        outputGroupKey
      );

      const generatedAssets = await resolveMaterializedArtifacts({
        response: parsedResponse,
        storageClient
      });

      logger.info("Materialized generated assets through HTTP backend", {
        backendUrl,
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
