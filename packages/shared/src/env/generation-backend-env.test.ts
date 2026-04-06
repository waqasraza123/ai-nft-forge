import { describe, expect, it } from "vitest";

import { parseGenerationBackendEnv } from "./generation-backend-env.js";

describe("parseGenerationBackendEnv", () => {
  it("applies stable defaults for the generation backend shell", () => {
    const env = parseGenerationBackendEnv({});

    expect(env.GENERATION_BACKEND_PROVIDER_KIND).toBe(
      "deterministic_transform"
    );
    expect(env.GENERATION_BACKEND_BIND_HOST).toBe("0.0.0.0");
    expect(env.GENERATION_BACKEND_PORT).toBe(8787);
    expect(env.GENERATION_BACKEND_READINESS_TIMEOUT_MS).toBe(5000);
    expect(env.GENERATION_BACKEND_SERVICE_NAME).toBe(
      "ai-nft-forge-generation-backend"
    );
    expect(env.COMFYUI_TIMEOUT_MS).toBe(180000);
    expect(env.COMFYUI_POLL_INTERVAL_MS).toBe(1500);
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("parses explicit values", () => {
    const env = parseGenerationBackendEnv({
      COMFYUI_API_BEARER_TOKEN: "comfy-token",
      COMFYUI_BASE_URL: "http://127.0.0.1:8188",
      COMFYUI_CFG_SCALE: "8.5",
      COMFYUI_CHECKPOINT_NAME: "flux.safetensors",
      COMFYUI_DENOISE: "0.5",
      COMFYUI_NEGATIVE_PROMPT: "bad anatomy",
      COMFYUI_POLL_INTERVAL_MS: "2000",
      COMFYUI_POSITIVE_PROMPT: "premium portrait",
      COMFYUI_SAMPLER_NAME: "dpmpp_2m",
      COMFYUI_SCHEDULER: "karras",
      COMFYUI_STEPS: "32",
      COMFYUI_TIMEOUT_MS: "240000",
      COMFYUI_WORKFLOW_PATH: "./workflows/comfyui.json",
      GENERATION_BACKEND_AUTH_TOKEN: "test-token",
      GENERATION_BACKEND_BIND_HOST: "127.0.0.1",
      GENERATION_BACKEND_PORT: "8788",
      GENERATION_BACKEND_READINESS_TIMEOUT_MS: "6500",
      GENERATION_BACKEND_PROVIDER_KIND: "comfyui",
      GENERATION_BACKEND_SERVICE_NAME: "forge-backend",
      LOG_LEVEL: "debug"
    });

    expect(env.COMFYUI_API_BEARER_TOKEN).toBe("comfy-token");
    expect(env.COMFYUI_BASE_URL).toBe("http://127.0.0.1:8188");
    expect(env.COMFYUI_CFG_SCALE).toBe(8.5);
    expect(env.COMFYUI_CHECKPOINT_NAME).toBe("flux.safetensors");
    expect(env.COMFYUI_DENOISE).toBe(0.5);
    expect(env.COMFYUI_NEGATIVE_PROMPT).toBe("bad anatomy");
    expect(env.COMFYUI_POLL_INTERVAL_MS).toBe(2000);
    expect(env.COMFYUI_POSITIVE_PROMPT).toBe("premium portrait");
    expect(env.COMFYUI_SAMPLER_NAME).toBe("dpmpp_2m");
    expect(env.COMFYUI_SCHEDULER).toBe("karras");
    expect(env.COMFYUI_STEPS).toBe(32);
    expect(env.COMFYUI_TIMEOUT_MS).toBe(240000);
    expect(env.COMFYUI_WORKFLOW_PATH).toBe("./workflows/comfyui.json");
    expect(env.GENERATION_BACKEND_AUTH_TOKEN).toBe("test-token");
    expect(env.GENERATION_BACKEND_BIND_HOST).toBe("127.0.0.1");
    expect(env.GENERATION_BACKEND_PORT).toBe(8788);
    expect(env.GENERATION_BACKEND_READINESS_TIMEOUT_MS).toBe(6500);
    expect(env.GENERATION_BACKEND_PROVIDER_KIND).toBe("comfyui");
    expect(env.GENERATION_BACKEND_SERVICE_NAME).toBe("forge-backend");
    expect(env.LOG_LEVEL).toBe("debug");
  });

  it("requires ComfyUI configuration when the ComfyUI provider is enabled", () => {
    expect(() =>
      parseGenerationBackendEnv({
        GENERATION_BACKEND_PROVIDER_KIND: "comfyui"
      })
    ).toThrow(
      "COMFYUI_BASE_URL is required when GENERATION_BACKEND_PROVIDER_KIND=comfyui."
    );
  });
});
