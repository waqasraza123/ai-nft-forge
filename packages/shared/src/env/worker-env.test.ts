import { describe, expect, it } from "vitest";

import { parseWorkerEnv } from "./worker-env.js";

describe("parseWorkerEnv", () => {
  it("applies stable defaults for the worker shell", () => {
    const env = parseWorkerEnv({});

    expect(env.COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY).toBe(1);
    expect(env.GENERATION_ADAPTER_KIND).toBe("storage_copy");
    expect(env.WORKER_SERVICE_NAME).toBe("ai-nft-forge-worker");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(1);
    expect(env.OPS_ALERT_WEBHOOK_ENABLED).toBe(false);
    expect(env.OPS_ALERT_WEBHOOK_TIMEOUT_MS).toBe(5000);
    expect(env.OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED).toBe(false);
    expect(env.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START).toBe(true);
    expect(env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS).toBe(300);
    expect(env.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS).toBe(15);
    expect(env.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS).toBe(600);
    expect(env.OPS_RECONCILIATION_SCHEDULE_ENABLED).toBe(false);
    expect(env.OPS_RECONCILIATION_RUN_ON_START).toBe(true);
    expect(env.OPS_RECONCILIATION_INTERVAL_SECONDS).toBe(300);
    expect(env.OPS_RECONCILIATION_JITTER_SECONDS).toBe(15);
    expect(env.OPS_RECONCILIATION_LOCK_TTL_SECONDS).toBe(600);
    expect(env.REDIS_URL).toBe("redis://127.0.0.1:56379");
    expect(env.WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY).toBe(1);
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED).toBe(false);
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS).toBe(5000);
  });

  it("parses explicit values", () => {
    const env = parseWorkerEnv({
      COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY: "2",
      GENERATION_ADAPTER_KIND: "http_backend",
      GENERATION_BACKEND_TIMEOUT_MS: "45000",
      GENERATION_BACKEND_URL: "http://127.0.0.1:8787/generate",
      LOG_LEVEL: "debug",
      NOOP_QUEUE_CONCURRENCY: "3",
      OPS_ALERT_WEBHOOK_BEARER_TOKEN: "token_123",
      OPS_ALERT_WEBHOOK_ENABLED: "true",
      OPS_ALERT_WEBHOOK_TIMEOUT_MS: "9000",
      OPS_ALERT_WEBHOOK_URL: "https://alerts.example.com/hooks/ops",
      OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS: "900",
      OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS: "45",
      OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS: "1200",
      OPS_OBSERVABILITY_CAPTURE_RUN_ON_START: "false",
      OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED: "true",
      OPS_RECONCILIATION_INTERVAL_SECONDS: "1200",
      OPS_RECONCILIATION_JITTER_SECONDS: "60",
      OPS_RECONCILIATION_LOCK_TTL_SECONDS: "1500",
      OPS_RECONCILIATION_RUN_ON_START: "false",
      OPS_RECONCILIATION_SCHEDULE_ENABLED: "true",
      REDIS_URL: "redis://localhost:6379",
      WORKER_SERVICE_NAME: "forge-worker",
      WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY: "2",
      WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: "lifecycle_token_123",
      WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: "true",
      WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: "7000",
      WORKSPACE_LIFECYCLE_WEBHOOK_URL:
        "https://alerts.example.com/hooks/workspace-lifecycle"
    });

    expect(env.COMMERCE_FULFILLMENT_QUEUE_CONCURRENCY).toBe(2);
    expect(env.GENERATION_ADAPTER_KIND).toBe("http_backend");
    expect(env.GENERATION_BACKEND_TIMEOUT_MS).toBe(45000);
    expect(env.GENERATION_BACKEND_URL).toBe("http://127.0.0.1:8787/generate");
    expect(env.WORKER_SERVICE_NAME).toBe("forge-worker");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.NOOP_QUEUE_CONCURRENCY).toBe(3);
    expect(env.OPS_ALERT_WEBHOOK_BEARER_TOKEN).toBe("token_123");
    expect(env.OPS_ALERT_WEBHOOK_ENABLED).toBe(true);
    expect(env.OPS_ALERT_WEBHOOK_TIMEOUT_MS).toBe(9000);
    expect(env.OPS_ALERT_WEBHOOK_URL).toBe(
      "https://alerts.example.com/hooks/ops"
    );
    expect(env.OPS_OBSERVABILITY_CAPTURE_SCHEDULE_ENABLED).toBe(true);
    expect(env.OPS_OBSERVABILITY_CAPTURE_RUN_ON_START).toBe(false);
    expect(env.OPS_OBSERVABILITY_CAPTURE_INTERVAL_SECONDS).toBe(900);
    expect(env.OPS_OBSERVABILITY_CAPTURE_JITTER_SECONDS).toBe(45);
    expect(env.OPS_OBSERVABILITY_CAPTURE_LOCK_TTL_SECONDS).toBe(1200);
    expect(env.OPS_RECONCILIATION_SCHEDULE_ENABLED).toBe(true);
    expect(env.OPS_RECONCILIATION_RUN_ON_START).toBe(false);
    expect(env.OPS_RECONCILIATION_INTERVAL_SECONDS).toBe(1200);
    expect(env.OPS_RECONCILIATION_JITTER_SECONDS).toBe(60);
    expect(env.OPS_RECONCILIATION_LOCK_TTL_SECONDS).toBe(1500);
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
    expect(env.WORKSPACE_LIFECYCLE_QUEUE_CONCURRENCY).toBe(2);
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN).toBe(
      "lifecycle_token_123"
    );
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED).toBe(true);
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS).toBe(7000);
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_URL).toBe(
      "https://alerts.example.com/hooks/workspace-lifecycle"
    );
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

  it("requires a webhook URL when webhook delivery is enabled", () => {
    expect(() =>
      parseWorkerEnv({
        OPS_ALERT_WEBHOOK_ENABLED: "true"
      })
    ).toThrow(
      "OPS_ALERT_WEBHOOK_URL is required when OPS_ALERT_WEBHOOK_ENABLED=true."
    );
  });

  it("requires a lifecycle webhook URL when lifecycle delivery is enabled", () => {
    expect(() =>
      parseWorkerEnv({
        WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: "true"
      })
    ).toThrow(
      "WORKSPACE_LIFECYCLE_WEBHOOK_URL is required when WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED=true."
    );
  });

  it("treats blank optional webhook fields as undefined when delivery is disabled", () => {
    const env = parseWorkerEnv({
      OPS_ALERT_WEBHOOK_BEARER_TOKEN: "",
      OPS_ALERT_WEBHOOK_URL: "",
      WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: "",
      WORKSPACE_LIFECYCLE_WEBHOOK_URL: ""
    });

    expect(env.OPS_ALERT_WEBHOOK_BEARER_TOKEN).toBeUndefined();
    expect(env.OPS_ALERT_WEBHOOK_URL).toBeUndefined();
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN).toBeUndefined();
    expect(env.WORKSPACE_LIFECYCLE_WEBHOOK_URL).toBeUndefined();
  });
});
