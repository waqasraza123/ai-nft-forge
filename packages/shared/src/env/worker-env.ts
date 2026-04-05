import { z } from "zod";

export const workerLogLevels = ["debug", "info", "warn", "error"] as const;

export type WorkerLogLevel = (typeof workerLogLevels)[number];

export const workerEnvSchema = z.object({
  LOG_LEVEL: z.enum(workerLogLevels).default("info"),
  NOOP_QUEUE_CONCURRENCY: z.coerce.number().int().positive().max(32).default(1),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:56379"),
  WORKER_SERVICE_NAME: z.string().trim().min(1).default("ai-nft-forge-worker")
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function parseWorkerEnv(rawEnvironment: NodeJS.ProcessEnv): WorkerEnv {
  return workerEnvSchema.parse(rawEnvironment);
}
