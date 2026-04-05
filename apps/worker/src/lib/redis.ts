import { Redis } from "ioredis";

import type { WorkerEnv } from "@ai-nft-forge/shared";

export function createRedisConnection(env: WorkerEnv) {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null
  });
}
