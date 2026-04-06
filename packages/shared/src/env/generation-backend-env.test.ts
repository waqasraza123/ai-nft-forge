import { describe, expect, it } from "vitest";

import { parseGenerationBackendEnv } from "./generation-backend-env.js";

describe("parseGenerationBackendEnv", () => {
  it("applies stable defaults for the generation backend shell", () => {
    const env = parseGenerationBackendEnv({});

    expect(env.GENERATION_BACKEND_BIND_HOST).toBe("0.0.0.0");
    expect(env.GENERATION_BACKEND_PORT).toBe(8787);
    expect(env.GENERATION_BACKEND_SERVICE_NAME).toBe(
      "ai-nft-forge-generation-backend"
    );
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("parses explicit values", () => {
    const env = parseGenerationBackendEnv({
      GENERATION_BACKEND_AUTH_TOKEN: "test-token",
      GENERATION_BACKEND_BIND_HOST: "127.0.0.1",
      GENERATION_BACKEND_PORT: "8788",
      GENERATION_BACKEND_SERVICE_NAME: "forge-backend",
      LOG_LEVEL: "debug"
    });

    expect(env.GENERATION_BACKEND_AUTH_TOKEN).toBe("test-token");
    expect(env.GENERATION_BACKEND_BIND_HOST).toBe("127.0.0.1");
    expect(env.GENERATION_BACKEND_PORT).toBe(8788);
    expect(env.GENERATION_BACKEND_SERVICE_NAME).toBe("forge-backend");
    expect(env.LOG_LEVEL).toBe("debug");
  });
});
