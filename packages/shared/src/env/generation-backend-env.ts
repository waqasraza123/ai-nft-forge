import { z } from "zod";

import { workerLogLevels } from "./worker-env.js";

export const generationBackendEnvSchema = z.object({
  GENERATION_BACKEND_AUTH_TOKEN: z.string().trim().min(1).optional(),
  GENERATION_BACKEND_BIND_HOST: z.string().trim().min(1).default("0.0.0.0"),
  GENERATION_BACKEND_PORT: z.coerce
    .number()
    .int()
    .positive()
    .max(65535)
    .default(8787),
  GENERATION_BACKEND_SERVICE_NAME: z
    .string()
    .trim()
    .min(1)
    .default("ai-nft-forge-generation-backend"),
  LOG_LEVEL: z.enum(workerLogLevels).default("info")
});

export type GenerationBackendEnv = z.infer<typeof generationBackendEnvSchema>;

export function parseGenerationBackendEnv(
  rawEnvironment: NodeJS.ProcessEnv
): GenerationBackendEnv {
  return generationBackendEnvSchema.parse(rawEnvironment);
}
