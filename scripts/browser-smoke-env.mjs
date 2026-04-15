import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envExamplePath = resolve(repoRoot, ".env.example");
const browserSmokeSchema = "browser_smoke";
const browserSmokeRedisDatabase = "15";
const browserSmokeBackendPort = "8877";
const browserSmokeWebPort = "3100";
const browserSmokeHost = "127.0.0.1";

function parseEnvironmentFile(filePath) {
  const contents = readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key.length === 0) {
      continue;
    }

    entries[key] = value;
  }

  return entries;
}

export function resolveBrowserSmokeEnvironment() {
  const baseEnvironment = {
    ...parseEnvironmentFile(envExamplePath),
    ...process.env
  };
  const databaseUrl = new URL(baseEnvironment.DATABASE_URL);
  const redisUrl = new URL(baseEnvironment.REDIS_URL);

  databaseUrl.searchParams.set("schema", browserSmokeSchema);
  databaseUrl.searchParams.set("connection_limit", "1");
  redisUrl.pathname = `/${browserSmokeRedisDatabase}`;

  const generationBackendUrl = new URL(
    `http://${browserSmokeHost}:${browserSmokeBackendPort}/generate`
  );

  return {
    ...baseEnvironment,
    BROWSER_SMOKE_STORAGE_PREFIX:
      baseEnvironment.BROWSER_SMOKE_STORAGE_PREFIX ?? "browser-smoke",
    DATABASE_URL: databaseUrl.toString(),
    GENERATION_BACKEND_BIND_HOST: browserSmokeHost,
    GENERATION_BACKEND_PORT: browserSmokeBackendPort,
    GENERATION_BACKEND_PROVIDER_KIND:
      baseEnvironment.GENERATION_BACKEND_PROVIDER_KIND ??
      "deterministic_transform",
    GENERATION_BACKEND_URL: generationBackendUrl.toString(),
    HOSTNAME: browserSmokeHost,
    PLAYWRIGHT_BACKEND_HEALTH_URL: new URL(
      "/health",
      generationBackendUrl
    ).toString(),
    PLAYWRIGHT_BASE_URL: `http://${browserSmokeHost}:${browserSmokeWebPort}`,
    PORT: browserSmokeWebPort,
    REDIS_URL: redisUrl.toString()
  };
}

export function resolveBrowserSmokePaths() {
  return {
    repoRoot
  };
}
