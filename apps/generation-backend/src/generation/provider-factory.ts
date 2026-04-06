import { readFile } from "node:fs/promises";

import type { GenerationBackendEnv } from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

import {
  createDefaultComfyWorkflowTemplate,
  validateComfyWorkflowTemplate,
  type ComfyWorkflowTemplate
} from "./comfyui-workflow.js";
import { createComfyUiProvider } from "./comfyui-provider.js";
import { createDeterministicTransformProvider } from "./deterministic-transform-provider.js";
import type { GenerationArtifactProvider } from "./provider.js";

async function loadWorkflowTemplateFromFile(filePath: string) {
  const contents = await readFile(filePath, "utf8");
  const parsed = JSON.parse(contents) as ComfyWorkflowTemplate;

  validateComfyWorkflowTemplate(parsed);

  return parsed;
}

export async function createGenerationArtifactProvider(input: {
  env: GenerationBackendEnv;
  logger: Logger;
}): Promise<GenerationArtifactProvider> {
  switch (input.env.GENERATION_BACKEND_PROVIDER_KIND) {
    case "deterministic_transform":
      return createDeterministicTransformProvider();
    case "comfyui": {
      const workflowTemplate = input.env.COMFYUI_WORKFLOW_PATH
        ? await loadWorkflowTemplateFromFile(input.env.COMFYUI_WORKFLOW_PATH)
        : createDefaultComfyWorkflowTemplate();

      validateComfyWorkflowTemplate(workflowTemplate);

      return createComfyUiProvider({
        ...(input.env.COMFYUI_API_BEARER_TOKEN
          ? {
              authToken: input.env.COMFYUI_API_BEARER_TOKEN
            }
          : {}),
        baseUrl: input.env.COMFYUI_BASE_URL!,
        checkpointName: input.env.COMFYUI_CHECKPOINT_NAME!,
        cfgScale: input.env.COMFYUI_CFG_SCALE,
        denoise: input.env.COMFYUI_DENOISE,
        logger: input.logger,
        negativePrompt: input.env.COMFYUI_NEGATIVE_PROMPT,
        pollIntervalMs: input.env.COMFYUI_POLL_INTERVAL_MS,
        positivePrompt: input.env.COMFYUI_POSITIVE_PROMPT,
        samplerName: input.env.COMFYUI_SAMPLER_NAME,
        scheduler: input.env.COMFYUI_SCHEDULER,
        steps: input.env.COMFYUI_STEPS,
        timeoutMs: input.env.COMFYUI_TIMEOUT_MS,
        workflowTemplate
      });
    }
  }

  throw new Error("Unsupported generation backend provider kind.");
}
