import { z } from "zod";

export const workerLogLevels = ["debug", "info", "warn", "error"] as const;
export const generationAdapterKinds = ["storage_copy", "http_backend"] as const;

export type WorkerLogLevel = (typeof workerLogLevels)[number];
export type GenerationAdapterKind = (typeof generationAdapterKinds)[number];

export const workerEnvSchema = z
  .object({
    GENERATION_ADAPTER_KIND: z
      .enum(generationAdapterKinds)
      .default("storage_copy"),
    GENERATION_BACKEND_AUTH_TOKEN: z.string().trim().min(1).optional(),
    GENERATION_BACKEND_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120000)
      .default(30000),
    GENERATION_BACKEND_URL: z.string().url().optional(),
    GENERATION_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    LOG_LEVEL: z.enum(workerLogLevels).default("info"),
    NOOP_QUEUE_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .max(32)
      .default(1),
    REDIS_URL: z.string().url().default("redis://127.0.0.1:56379"),
    WORKER_SERVICE_NAME: z.string().trim().min(1).default("ai-nft-forge-worker")
  })
  .superRefine((value, context) => {
    if (
      value.GENERATION_ADAPTER_KIND === "http_backend" &&
      !value.GENERATION_BACKEND_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "GENERATION_BACKEND_URL is required when GENERATION_ADAPTER_KIND=http_backend.",
        path: ["GENERATION_BACKEND_URL"]
      });
    }
  });

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function parseWorkerEnv(rawEnvironment: NodeJS.ProcessEnv): WorkerEnv {
  return workerEnvSchema.parse(rawEnvironment);
}
