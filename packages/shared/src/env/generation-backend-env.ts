import { z } from "zod";

import { workerLogLevels } from "./worker-env.js";

export const generationBackendProviderKinds = [
  "deterministic_transform",
  "comfyui"
] as const;

export const generationBackendEnvSchema = z
  .object({
    COMFYUI_API_BEARER_TOKEN: z.string().trim().min(1).optional(),
    COMFYUI_BASE_URL: z.string().url().optional(),
    COMFYUI_CFG_SCALE: z.coerce.number().positive().default(7),
    COMFYUI_CHECKPOINT_NAME: z.string().trim().min(1).optional(),
    COMFYUI_DENOISE: z.coerce.number().positive().max(1).default(0.42),
    COMFYUI_NEGATIVE_PROMPT: z
      .string()
      .trim()
      .min(1)
      .default(
        "blurry, low quality, deformed hands, extra limbs, watermark, text"
      ),
    COMFYUI_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(60_000)
      .default(1_500),
    COMFYUI_POSITIVE_PROMPT: z
      .string()
      .trim()
      .min(1)
      .default(
        "editorial collectible portrait, premium nft artwork, cinematic lighting, highly detailed, clean background, polished stylization"
      ),
    COMFYUI_SAMPLER_NAME: z.string().trim().min(1).default("euler"),
    COMFYUI_SCHEDULER: z.string().trim().min(1).default("normal"),
    COMFYUI_STEPS: z.coerce.number().int().positive().max(150).default(28),
    COMFYUI_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(900_000)
      .default(180_000),
    COMFYUI_WORKFLOW_PATH: z.string().trim().min(1).optional(),
    GENERATION_BACKEND_AUTH_TOKEN: z.string().trim().min(1).optional(),
    GENERATION_BACKEND_BIND_HOST: z.string().trim().min(1).default("0.0.0.0"),
    GENERATION_BACKEND_PORT: z.coerce
      .number()
      .int()
      .positive()
      .max(65535)
      .default(8787),
    GENERATION_BACKEND_READINESS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(60_000)
      .default(5_000),
    GENERATION_BACKEND_PROVIDER_KIND: z
      .enum(generationBackendProviderKinds)
      .default("deterministic_transform"),
    GENERATION_BACKEND_SERVICE_NAME: z
      .string()
      .trim()
      .min(1)
      .default("ai-nft-forge-generation-backend"),
    LOG_LEVEL: z.enum(workerLogLevels).default("info")
  })
  .superRefine((value, context) => {
    if (
      value.GENERATION_BACKEND_PROVIDER_KIND === "comfyui" &&
      !value.COMFYUI_BASE_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "COMFYUI_BASE_URL is required when GENERATION_BACKEND_PROVIDER_KIND=comfyui.",
        path: ["COMFYUI_BASE_URL"]
      });
    }

    if (
      value.GENERATION_BACKEND_PROVIDER_KIND === "comfyui" &&
      !value.COMFYUI_CHECKPOINT_NAME
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "COMFYUI_CHECKPOINT_NAME is required when GENERATION_BACKEND_PROVIDER_KIND=comfyui.",
        path: ["COMFYUI_CHECKPOINT_NAME"]
      });
    }
  });

export type GenerationBackendEnv = z.infer<typeof generationBackendEnvSchema>;

export function parseGenerationBackendEnv(
  rawEnvironment: NodeJS.ProcessEnv
): GenerationBackendEnv {
  return generationBackendEnvSchema.parse(rawEnvironment);
}
