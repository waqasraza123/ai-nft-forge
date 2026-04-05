import { describe, expect, it } from "vitest";

import { parseWorkerEnv } from "./worker-env.js";

describe("parseWorkerEnv", () => {
  it("applies stable defaults for the worker shell", () => {
    const env = parseWorkerEnv({});

    expect(env.WORKER_SERVICE_NAME).toBe("ai-nft-forge-worker");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(1);
    expect(env.REDIS_URL).toBe("redis://127.0.0.1:6379");
  });

  it("parses explicit values", () => {
    const env = parseWorkerEnv({
      LOG_LEVEL: "debug",
      NOOP_QUEUE_CONCURRENCY: "3",
      REDIS_URL: "redis://localhost:6379",
      WORKER_SERVICE_NAME: "forge-worker"
    });

    expect(env.WORKER_SERVICE_NAME).toBe("forge-worker");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(3);
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });
});
