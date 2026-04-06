import { describe, expect, it, vi } from "vitest";

import {
  createGenerationBackendHealthSnapshot,
  createGenerationBackendReadinessSnapshot
} from "./health.js";

describe("generation backend health snapshots", () => {
  const provider = {
    async checkReadiness() {
      return {
        checkedAt: "2026-04-06T12:00:00.000Z",
        latencyMs: 42,
        message: "Provider probe succeeded.",
        status: "ready" as const
      };
    },
    describeConfiguration() {
      return {
        baseUrl: "http://127.0.0.1:8188",
        checkpointName: "flux.safetensors",
        kind: "comfyui" as const,
        mode: "remote_comfyui" as const,
        workflowSource: "embedded_default" as const
      };
    },
    generateArtifacts: vi.fn(),
    kind: "comfyui" as const
  };

  it("includes provider configuration in the liveness snapshot", () => {
    const snapshot = createGenerationBackendHealthSnapshot({
      provider,
      rawEnvironment: {
        COMFYUI_BASE_URL: "http://127.0.0.1:8188",
        COMFYUI_CHECKPOINT_NAME: "flux.safetensors",
        GENERATION_BACKEND_PROVIDER_KIND: "comfyui",
        GENERATION_BACKEND_READINESS_TIMEOUT_MS: "5000",
        GENERATION_BACKEND_SERVICE_NAME: "forge-backend"
      }
    });

    expect(snapshot).toMatchObject({
      provider: {
        baseUrl: "http://127.0.0.1:8188",
        checkpointName: "flux.safetensors",
        kind: "comfyui",
        mode: "remote_comfyui",
        workflowSource: "embedded_default"
      },
      readinessTimeoutMs: 5000,
      service: "forge-backend",
      status: "ok"
    });
    expect(snapshot.uptimeSeconds).toBeTypeOf("number");
  });

  it("includes provider readiness in the readiness snapshot", async () => {
    const snapshot = await createGenerationBackendReadinessSnapshot({
      provider,
      rawEnvironment: {
        COMFYUI_BASE_URL: "http://127.0.0.1:8188",
        COMFYUI_CHECKPOINT_NAME: "flux.safetensors",
        GENERATION_BACKEND_PROVIDER_KIND: "comfyui",
        GENERATION_BACKEND_SERVICE_NAME: "forge-backend"
      }
    });

    expect(snapshot).toMatchObject({
      probe: {
        latencyMs: 42,
        message: "Provider probe succeeded.",
        status: "ready"
      },
      service: "forge-backend",
      status: "ready"
    });
    expect(snapshot.uptimeSeconds).toBeTypeOf("number");
  });
});
