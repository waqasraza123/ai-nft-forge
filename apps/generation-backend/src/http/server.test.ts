import { afterEach, describe, expect, it, vi } from "vitest";

import { createGenerationBackendServer } from "./server.js";

const serversToClose = new Set<{
  close: (callback: (error?: Error | undefined) => void) => void;
}>();

async function listen(
  server: ReturnType<typeof createGenerationBackendServer>
) {
  serversToClose.add(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Server did not bind to an IP socket.");
  }

  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    Array.from(serversToClose).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        })
    )
  );
  serversToClose.clear();
});

describe("createGenerationBackendServer", () => {
  it("serves the generation backend liveness snapshot", async () => {
    const server = createGenerationBackendServer({
      generationService: {
        generate: vi.fn()
      },
      healthReporter: {
        createHealthSnapshot() {
          return {
            bindHost: "127.0.0.1",
            port: 8787,
            provider: {
              baseUrl: null,
              checkpointName: null,
              kind: "deterministic_transform",
              mode: "deterministic_transform",
              workflowSource: null
            },
            readinessTimeoutMs: 5000,
            service: "forge-backend",
            status: "ok",
            uptimeSeconds: 12.3
          };
        },
        async createReadinessSnapshot() {
          return {
            provider: {
              baseUrl: null,
              checkpointName: null,
              kind: "deterministic_transform",
              mode: "deterministic_transform",
              workflowSource: null
            },
            probe: {
              checkedAt: "2026-04-06T12:00:00.000Z",
              latencyMs: 0,
              message: "Ready.",
              status: "ready"
            },
            service: "forge-backend",
            status: "ready",
            uptimeSeconds: 12.3
          };
        }
      },
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      }
    });
    const baseUrl = await listen(server);
    const response = await fetch(`${baseUrl}/health`);
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      service: "forge-backend",
      status: "ok"
    });
  });

  it("returns 503 when provider readiness is not ready", async () => {
    const server = createGenerationBackendServer({
      generationService: {
        generate: vi.fn()
      },
      healthReporter: {
        createHealthSnapshot() {
          return {
            bindHost: "127.0.0.1",
            port: 8787,
            provider: {
              baseUrl: "http://127.0.0.1:8188",
              checkpointName: "flux.safetensors",
              kind: "comfyui",
              mode: "remote_comfyui",
              workflowSource: "embedded_default"
            },
            readinessTimeoutMs: 5000,
            service: "forge-backend",
            status: "ok",
            uptimeSeconds: 12.3
          };
        },
        async createReadinessSnapshot() {
          return {
            provider: {
              baseUrl: "http://127.0.0.1:8188",
              checkpointName: "flux.safetensors",
              kind: "comfyui",
              mode: "remote_comfyui",
              workflowSource: "embedded_default"
            },
            probe: {
              checkedAt: "2026-04-06T12:00:00.000Z",
              latencyMs: 5000,
              message: "ComfyUI probe timed out.",
              status: "not_ready"
            },
            service: "forge-backend",
            status: "not_ready",
            uptimeSeconds: 12.3
          };
        }
      },
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      }
    });
    const baseUrl = await listen(server);
    const response = await fetch(`${baseUrl}/ready`);
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      status: "not_ready"
    });
  });
});
