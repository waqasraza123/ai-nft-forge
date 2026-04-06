import { describe, expect, it } from "vitest";

import { parseWorkerEnv } from "./worker-env.js";

describe("parseWorkerEnv", () => {
  it("applies stable defaults for the worker shell", () => {
    const env = parseWorkerEnv({});

    expect(env.GENERATION_ADAPTER_KIND).toBe("storage_copy");
    expect(env.WORKER_SERVICE_NAME).toBe("ai-nft-forge-worker");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(1);
    expect(env.REDIS_URL).toBe("redis://127.0.0.1:56379");
  });

  it("parses explicit values", () => {
    const env = parseWorkerEnv({
      GENERATION_ADAPTER_KIND: "http_backend",
      GENERATION_BACKEND_TIMEOUT_MS: "45000",
      GENERATION_BACKEND_URL: "http://127.0.0.1:8787/generate",
      LOG_LEVEL: "debug",
      NOOP_QUEUE_CONCURRENCY: "3",
      REDIS_URL: "redis://localhost:6379",
      WORKER_SERVICE_NAME: "forge-worker"
    });

    expect(env.GENERATION_ADAPTER_KIND).toBe("http_backend");
    expect(env.GENERATION_BACKEND_TIMEOUT_MS).toBe(45000);
    expect(env.GENERATION_BACKEND_URL).toBe("http://127.0.0.1:8787/generate");
    expect(env.WORKER_SERVICE_NAME).toBe("forge-worker");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(3);
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("requires a backend URL when the http adapter is enabled", () => {
    expect(() =>
      parseWorkerEnv({
        GENERATION_ADAPTER_KIND: "http_backend"
      })
    ).toThrow(
      "GENERATION_BACKEND_URL is required when GENERATION_ADAPTER_KIND=http_backend."
    );
  });
});
