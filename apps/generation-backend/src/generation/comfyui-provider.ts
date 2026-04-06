import { createHash, randomInt } from "node:crypto";

import {
  sanitizeStorageFileName,
  type GenerationBackendRequest,
  type GenerationPipelineKey
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import { GenerationBackendServiceError } from "./error.js";
import {
  materializeComfyWorkflowTemplate,
  type ComfyWorkflowTemplate
} from "./comfyui-workflow.js";
import type {
  GeneratedVariantArtifact,
  GenerationArtifactProvider
} from "./provider.js";
import { resolvePipelinePrompts } from "./provider.js";

type FetchLike = typeof fetch;

type ComfyUiProviderDependencies = {
  authToken?: string;
  baseUrl: string;
  checkpointName: string;
  cfgScale: number;
  denoise: number;
  fetchFn?: FetchLike;
  logger: Logger;
  negativePrompt: string;
  pollIntervalMs: number;
  positivePrompt: string;
  samplerName: string;
  scheduler: string;
  steps: number;
  timeoutMs: number;
  workflowTemplate: ComfyWorkflowTemplate;
};

type ComfyUiHistoryOutputImage = {
  filename: string;
  subfolder: string;
  type: string;
};

type ComfyUiHistoryResponse = Record<
  string,
  {
    outputs?: Record<
      string,
      {
        images?: ComfyUiHistoryOutputImage[];
      }
    >;
    status?: {
      completed?: boolean;
      messages?: Array<[string, unknown]>;
      status_str?: string;
    };
  }
>;

function createAbsoluteUrl(baseUrl: string, pathname: string) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

function resolveSourceFileExtension(request: GenerationBackendRequest) {
  const fileName = sanitizeStorageFileName(
    request.sourceAsset.originalFilename
  );
  const extension = fileName.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase();

  if (extension && extension.length > 0) {
    return extension;
  }

  switch (request.sourceAsset.contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

function resolveContentTypeFromFilename(filename: string) {
  const normalized = filename.toLowerCase();

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return {
      contentType: "image/jpeg",
      fileExtension: "jpg"
    };
  }

  if (normalized.endsWith(".webp")) {
    return {
      contentType: "image/webp",
      fileExtension: "webp"
    };
  }

  return {
    contentType: "image/png",
    fileExtension: "png"
  };
}

function resolvePipelinePromptOverrides(
  pipelineKey: GenerationPipelineKey,
  input: {
    negativePrompt: string;
    positivePrompt: string;
  }
) {
  const defaults = resolvePipelinePrompts(pipelineKey);

  return {
    negativePrompt: `${defaults.negativePrompt}, ${input.negativePrompt}`,
    positivePrompt: `${defaults.positivePrompt}, ${input.positivePrompt}`
  };
}

async function parseJsonResponse<T>(response: Response, message: string) {
  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `${message} ${response.status} ${response.statusText}: ${responseBody.trim() || "empty response body"}`
    );
  }

  try {
    return JSON.parse(responseBody) as T;
  } catch (error) {
    throw new Error(`${message} returned invalid JSON.`, {
      cause: error
    });
  }
}

async function parseBinaryResponse(response: Response, message: string) {
  if (!response.ok) {
    const bodyText = await response.text();

    throw new Error(
      `${message} ${response.status} ${response.statusText}: ${bodyText.trim() || "empty response body"}`
    );
  }

  const body = new Uint8Array(await response.arrayBuffer());

  if (body.byteLength === 0) {
    throw new Error(`${message} returned an empty body.`);
  }

  return body;
}

function resolvePromptId(response: { prompt_id?: string }) {
  if (!response.prompt_id || response.prompt_id.trim().length === 0) {
    throw new Error("ComfyUI prompt submission did not return a prompt_id.");
  }

  return response.prompt_id;
}

function resolveHistoryOutputImage(
  historyResponse: ComfyUiHistoryResponse,
  promptId: string
) {
  const historyEntry = historyResponse[promptId];

  if (!historyEntry) {
    return null;
  }

  const images = Object.values(historyEntry.outputs ?? {})
    .flatMap((output) => output.images ?? [])
    .filter((image) => image.filename.trim().length > 0);

  if (images.length === 0) {
    return null;
  }

  return images[0] ?? null;
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

function sleep(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function fetchWithTimeout(
  input: {
    fetchFn: FetchLike;
    request: Request | URL | string;
    timeoutMs: number;
  } & RequestInit
) {
  const requestInit: RequestInit = {
    signal: AbortSignal.timeout(input.timeoutMs)
  };

  if (input.body !== undefined) {
    requestInit.body = input.body;
  }

  if (input.headers !== undefined) {
    requestInit.headers = input.headers;
  }

  if (input.method !== undefined) {
    requestInit.method = input.method;
  }

  try {
    return await input.fetchFn(input.request, requestInit);
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new GenerationBackendServiceError(
        "MODEL_BACKEND_TIMEOUT",
        `ComfyUI request timed out after ${input.timeoutMs}ms.`,
        504,
        {
          cause: error
        }
      );
    }

    throw new GenerationBackendServiceError(
      "MODEL_BACKEND_ERROR",
      "ComfyUI request failed before a response was received.",
      502,
      {
        cause: error
      }
    );
  }
}

export function createComfyUiProvider(
  dependencies: ComfyUiProviderDependencies
): GenerationArtifactProvider {
  const fetchFn = dependencies.fetchFn ?? fetch;
  const requestHeaders = {
    ...(dependencies.authToken
      ? {
          Authorization: `Bearer ${dependencies.authToken}`
        }
      : {})
  };

  async function uploadSourceImage(input: {
    request: GenerationBackendRequest;
    sourceBytes: Uint8Array;
  }) {
    const sourceExtension = resolveSourceFileExtension(input.request);
    const digest = createHash("sha256")
      .update(input.sourceBytes)
      .digest("hex")
      .slice(0, 16);
    const fileName = `ai-nft-forge-${digest}.${sourceExtension}`;
    const formData = new FormData();

    formData.set(
      "image",
      new Blob([Buffer.from(input.sourceBytes)], {
        type: input.request.sourceAsset.contentType
      }),
      fileName
    );
    formData.set("overwrite", "true");

    const response = await fetchWithTimeout({
      body: formData,
      fetchFn,
      headers: requestHeaders,
      method: "POST",
      request: createAbsoluteUrl(dependencies.baseUrl, "/upload/image"),
      timeoutMs: dependencies.timeoutMs
    });
    const parsedBody = await parseJsonResponse<{ name?: string }>(
      response,
      "ComfyUI image upload failed with"
    );

    if (!parsedBody.name || parsedBody.name.trim().length === 0) {
      throw new GenerationBackendServiceError(
        "MODEL_BACKEND_ERROR",
        "ComfyUI image upload did not return an uploaded file name.",
        502
      );
    }

    return parsedBody.name;
  }

  async function submitPrompt(input: {
    outputPrefix: string;
    pipelineKey: GenerationPipelineKey;
    sourceImage: string;
    variantIndex: number;
  }) {
    const promptOverrides = resolvePipelinePromptOverrides(input.pipelineKey, {
      negativePrompt: dependencies.negativePrompt,
      positivePrompt: dependencies.positivePrompt
    });
    const prompt = materializeComfyWorkflowTemplate({
      checkpointName: dependencies.checkpointName,
      cfgScale: dependencies.cfgScale,
      denoise: dependencies.denoise,
      negativePrompt: promptOverrides.negativePrompt,
      outputPrefix: input.outputPrefix,
      positivePrompt: promptOverrides.positivePrompt,
      samplerName: dependencies.samplerName,
      scheduler: dependencies.scheduler,
      seed: randomInt(1, 2_147_483_647),
      sourceImage: input.sourceImage,
      steps: dependencies.steps,
      template: dependencies.workflowTemplate
    });

    const response = await fetchWithTimeout({
      body: JSON.stringify({
        prompt
      }),
      fetchFn,
      headers: {
        ...requestHeaders,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      request: createAbsoluteUrl(dependencies.baseUrl, "/prompt"),
      timeoutMs: dependencies.timeoutMs
    });
    const parsedBody = await parseJsonResponse<{ prompt_id?: string }>(
      response,
      "ComfyUI prompt submission failed with"
    );

    dependencies.logger.info("Submitted ComfyUI generation prompt", {
      outputPrefix: input.outputPrefix,
      pipelineKey: input.pipelineKey,
      promptId: parsedBody.prompt_id ?? null,
      variantIndex: input.variantIndex
    });

    return resolvePromptId(parsedBody);
  }

  async function waitForOutputImage(promptId: string) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < dependencies.timeoutMs) {
      const response = await fetchWithTimeout({
        fetchFn,
        headers: {
          ...requestHeaders,
          Accept: "application/json"
        },
        method: "GET",
        request: createAbsoluteUrl(
          dependencies.baseUrl,
          `/history/${encodeURIComponent(promptId)}`
        ),
        timeoutMs: dependencies.timeoutMs
      });
      const historyResponse = await parseJsonResponse<ComfyUiHistoryResponse>(
        response,
        "ComfyUI history lookup failed with"
      );
      const outputImage = resolveHistoryOutputImage(historyResponse, promptId);

      if (outputImage) {
        return outputImage;
      }

      const historyEntry = historyResponse[promptId];

      if (historyEntry?.status?.status_str === "error") {
        throw new GenerationBackendServiceError(
          "MODEL_BACKEND_ERROR",
          `ComfyUI generation failed for prompt ${promptId}.`,
          502
        );
      }

      await sleep(dependencies.pollIntervalMs);
    }

    throw new GenerationBackendServiceError(
      "MODEL_BACKEND_TIMEOUT",
      `ComfyUI generation timed out after ${dependencies.timeoutMs}ms.`,
      504
    );
  }

  async function fetchOutputImage(outputImage: ComfyUiHistoryOutputImage) {
    const response = await fetchWithTimeout({
      fetchFn,
      headers: requestHeaders,
      method: "GET",
      request: (() => {
        const url = createAbsoluteUrl(dependencies.baseUrl, "/view");
        url.searchParams.set("filename", outputImage.filename);
        url.searchParams.set("subfolder", outputImage.subfolder);
        url.searchParams.set("type", outputImage.type);
        return url;
      })(),
      timeoutMs: dependencies.timeoutMs
    });
    const body = await parseBinaryResponse(
      response,
      "ComfyUI output fetch failed with"
    );
    const contentType = response.headers
      .get("content-type")
      ?.split(";")[0]
      ?.trim();
    const resolved = resolveContentTypeFromFilename(outputImage.filename);

    return {
      body,
      contentType:
        contentType && contentType.startsWith("image/")
          ? contentType
          : resolved.contentType,
      fileExtension: resolved.fileExtension
    };
  }

  return {
    async generateArtifacts(input) {
      const uploadedSourceImage = await uploadSourceImage({
        request: input.generationRequest,
        sourceBytes: input.sourceObject.body
      });
      const artifacts: GeneratedVariantArtifact[] = [];

      for (
        let variantIndex = 1;
        variantIndex <= input.generationRequest.requestedVariantCount;
        variantIndex += 1
      ) {
        const outputPrefix = [
          "ai-nft-forge",
          input.generationRequest.generationRequestId,
          `variant-${String(variantIndex).padStart(2, "0")}`
        ].join("-");
        const promptId = await submitPrompt({
          outputPrefix,
          pipelineKey: input.generationRequest.pipelineKey,
          sourceImage: uploadedSourceImage,
          variantIndex
        });
        const outputImage = await waitForOutputImage(promptId);
        const renderedArtifact = await fetchOutputImage(outputImage);

        artifacts.push({
          body: renderedArtifact.body,
          contentType: renderedArtifact.contentType,
          fileExtension: renderedArtifact.fileExtension,
          variantIndex
        });
      }

      return artifacts;
    },
    kind: "comfyui"
  };
}
