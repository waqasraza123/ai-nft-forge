import {
  generationBackendHealthResponseSchema,
  generationBackendReadinessResponseSchema,
  parseGenerationBackendEnv
} from "@ai-nft-forge/shared";

import type { GenerationArtifactProvider } from "../generation/provider.js";

export function createGenerationBackendHealthSnapshot(input: {
  provider: GenerationArtifactProvider;
  rawEnvironment: NodeJS.ProcessEnv;
}) {
  const env = parseGenerationBackendEnv(input.rawEnvironment);

  return generationBackendHealthResponseSchema.parse({
    bindHost: env.GENERATION_BACKEND_BIND_HOST,
    port: env.GENERATION_BACKEND_PORT,
    provider: input.provider.describeConfiguration(),
    readinessTimeoutMs: env.GENERATION_BACKEND_READINESS_TIMEOUT_MS,
    service: env.GENERATION_BACKEND_SERVICE_NAME,
    status: "ok",
    uptimeSeconds: Number(process.uptime().toFixed(3))
  });
}

export async function createGenerationBackendReadinessSnapshot(input: {
  provider: GenerationArtifactProvider;
  rawEnvironment: NodeJS.ProcessEnv;
}) {
  const env = parseGenerationBackendEnv(input.rawEnvironment);
  const probe = await input.provider.checkReadiness();

  return generationBackendReadinessResponseSchema.parse({
    provider: input.provider.describeConfiguration(),
    probe,
    service: env.GENERATION_BACKEND_SERVICE_NAME,
    status: probe.status,
    uptimeSeconds: Number(process.uptime().toFixed(3))
  });
}
