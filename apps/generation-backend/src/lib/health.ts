import { parseGenerationBackendEnv } from "@ai-nft-forge/shared";

export function createGenerationBackendHealthSnapshot(
  rawEnvironment: NodeJS.ProcessEnv
) {
  const env = parseGenerationBackendEnv(rawEnvironment);

  return {
    bindHost: env.GENERATION_BACKEND_BIND_HOST,
    port: env.GENERATION_BACKEND_PORT,
    providerKind: env.GENERATION_BACKEND_PROVIDER_KIND,
    service: env.GENERATION_BACKEND_SERVICE_NAME,
    status: "ok" as const
  };
}
