type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type ComfyWorkflowTemplate = Record<string, JsonValue>;

export const comfyWorkflowTokenValues = {
  cfgScale: "__COMFY_CFG_SCALE__",
  checkpointName: "__COMFY_CHECKPOINT_NAME__",
  denoise: "__COMFY_DENOISE__",
  negativePrompt: "__COMFY_NEGATIVE_PROMPT__",
  outputPrefix: "__COMFY_OUTPUT_PREFIX__",
  positivePrompt: "__COMFY_POSITIVE_PROMPT__",
  samplerName: "__COMFY_SAMPLER_NAME__",
  scheduler: "__COMFY_SCHEDULER__",
  seed: "__COMFY_SEED__",
  sourceImage: "__COMFY_SOURCE_IMAGE__",
  steps: "__COMFY_STEPS__"
} as const;

export function createDefaultComfyWorkflowTemplate(): ComfyWorkflowTemplate {
  return {
    "3": {
      class_type: "KSampler",
      inputs: {
        cfg: comfyWorkflowTokenValues.cfgScale,
        denoise: comfyWorkflowTokenValues.denoise,
        latent_image: ["5", 0],
        model: ["4", 0],
        negative: ["7", 0],
        positive: ["6", 0],
        sampler_name: comfyWorkflowTokenValues.samplerName,
        scheduler: comfyWorkflowTokenValues.scheduler,
        seed: comfyWorkflowTokenValues.seed,
        steps: comfyWorkflowTokenValues.steps
      }
    },
    "4": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: comfyWorkflowTokenValues.checkpointName
      }
    },
    "5": {
      class_type: "VAEEncode",
      inputs: {
        pixels: ["10", 0],
        vae: ["4", 2]
      }
    },
    "6": {
      class_type: "CLIPTextEncode",
      inputs: {
        clip: ["4", 1],
        text: comfyWorkflowTokenValues.positivePrompt
      }
    },
    "7": {
      class_type: "CLIPTextEncode",
      inputs: {
        clip: ["4", 1],
        text: comfyWorkflowTokenValues.negativePrompt
      }
    },
    "8": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["3", 0],
        vae: ["4", 2]
      }
    },
    "9": {
      class_type: "SaveImage",
      inputs: {
        filename_prefix: comfyWorkflowTokenValues.outputPrefix,
        images: ["8", 0]
      }
    },
    "10": {
      class_type: "LoadImage",
      inputs: {
        image: comfyWorkflowTokenValues.sourceImage
      }
    }
  };
}

function replaceTokens(
  value: JsonValue,
  replacements: Record<string, JsonValue>
): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => replaceTokens(item, replacements));
  }

  if (typeof value === "string") {
    return value in replacements ? (replacements[value] ?? null) : value;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        replaceTokens(nestedValue, replacements)
      ])
    );
  }

  return value;
}

export function materializeComfyWorkflowTemplate(input: {
  checkpointName: string;
  cfgScale: number;
  denoise: number;
  negativePrompt: string;
  outputPrefix: string;
  positivePrompt: string;
  samplerName: string;
  scheduler: string;
  seed: number;
  sourceImage: string;
  steps: number;
  template: ComfyWorkflowTemplate;
}): ComfyWorkflowTemplate {
  return replaceTokens(input.template, {
    [comfyWorkflowTokenValues.cfgScale]: input.cfgScale,
    [comfyWorkflowTokenValues.checkpointName]: input.checkpointName,
    [comfyWorkflowTokenValues.denoise]: input.denoise,
    [comfyWorkflowTokenValues.negativePrompt]: input.negativePrompt,
    [comfyWorkflowTokenValues.outputPrefix]: input.outputPrefix,
    [comfyWorkflowTokenValues.positivePrompt]: input.positivePrompt,
    [comfyWorkflowTokenValues.samplerName]: input.samplerName,
    [comfyWorkflowTokenValues.scheduler]: input.scheduler,
    [comfyWorkflowTokenValues.seed]: input.seed,
    [comfyWorkflowTokenValues.sourceImage]: input.sourceImage,
    [comfyWorkflowTokenValues.steps]: input.steps
  }) as ComfyWorkflowTemplate;
}

function collectTokenStrings(value: JsonValue, tokenSet: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTokenStrings(item, tokenSet);
    }

    return;
  }

  if (typeof value === "string") {
    tokenSet.add(value);
    return;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      collectTokenStrings(nestedValue, tokenSet);
    }
  }
}

export function validateComfyWorkflowTemplate(template: ComfyWorkflowTemplate) {
  const seenStrings = new Set<string>();

  collectTokenStrings(template, seenStrings);

  const requiredTokens = Object.values(comfyWorkflowTokenValues);
  const missingTokens = requiredTokens.filter(
    (token) => !seenStrings.has(token)
  );

  if (missingTokens.length > 0) {
    throw new Error(
      `ComfyUI workflow template is missing required placeholders: ${missingTokens.join(", ")}.`
    );
  }
}
