import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supportedAppRuntimeModes = new Set(["docker", "cloud"]);
const supportedAppStartupModes = new Set(["local", "selfhost"]);
const localHosts = new Set(["127.0.0.1", "0.0.0.0", "localhost", "redis"]);

/**
 * @typedef {"cloud" | "docker"} AppRuntimeMode
 * @typedef {"local" | "selfhost"} AppStartupMode
 */

function normalizeEnvironmentValue(rawValue) {
  const trimmedValue = rawValue.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

export function parseEnvironmentFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

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

    if (key.length === 0) {
      continue;
    }

    entries[key] = normalizeEnvironmentValue(line.slice(separatorIndex + 1));
  }

  return entries;
}

export function resolveRepositoryEnvironment() {
  return {
    ...parseEnvironmentFile(resolve(repoRoot, ".env")),
    ...parseEnvironmentFile(resolve(repoRoot, ".env.local")),
    ...process.env
  };
}

function isBlankString(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function isLocalHost(hostname) {
  const normalizedHost = hostname.trim().toLowerCase();

  return (
    localHosts.has(normalizedHost) ||
    normalizedHost.endsWith(".local") ||
    normalizedHost.startsWith("127.") ||
    normalizedHost.startsWith("10.") ||
    normalizedHost.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./u.test(normalizedHost)
  );
}

function parseUrl(value, label) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
}

function requireEnvironmentValue(rawEnvironment, key, context) {
  const value = rawEnvironment[key];

  if (!isBlankString(value)) {
    return value.trim();
  }

  throw new Error(`${key} is required ${context}.`);
}

export function resolveAppRuntimeMode(
  rawEnvironment = resolveRepositoryEnvironment()
) {
  const configuredRuntimeMode =
    rawEnvironment.APP_RUNTIME_MODE?.trim() ?? "docker";

  if (!supportedAppRuntimeModes.has(configuredRuntimeMode)) {
    throw new Error(
      `Unsupported APP_RUNTIME_MODE "${configuredRuntimeMode}". Expected one of: ${Array.from(
        supportedAppRuntimeModes
      ).join(", ")}.`
    );
  }

  return configuredRuntimeMode;
}

export function resolveAppStartupMode(argv, runtimeMode) {
  let startupMode = runtimeMode === "cloud" ? "local" : "selfhost";

  for (const arg of argv) {
    if (arg.startsWith("--mode=")) {
      startupMode = arg.slice("--mode=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return startupMode;
    }
  }

  if (!supportedAppStartupModes.has(startupMode)) {
    throw new Error(
      `Unsupported mode "${startupMode}". Use one of: ${Array.from(
        supportedAppStartupModes
      ).join(", ")}.`
    );
  }

  if (runtimeMode === "cloud" && startupMode === "selfhost") {
    throw new Error(
      "APP_RUNTIME_MODE=cloud only supports local-process startup. Remove --mode=selfhost."
    );
  }

  return startupMode;
}

export function validateCloudRuntimeEnvironment(
  rawEnvironment = resolveRepositoryEnvironment()
) {
  const runtimeMode = resolveAppRuntimeMode(rawEnvironment);

  if (runtimeMode !== "cloud") {
    throw new Error(
      "Cloud runtime validation requires APP_RUNTIME_MODE=cloud."
    );
  }

  const databaseMode = rawEnvironment.DATABASE_MODE?.trim() ?? "local";

  if (databaseMode !== "neon") {
    throw new Error("APP_RUNTIME_MODE=cloud requires DATABASE_MODE=neon.");
  }

  const databaseRuntimeUrl = requireEnvironmentValue(
    rawEnvironment,
    "DATABASE_NEON_URL",
    "when APP_RUNTIME_MODE=cloud"
  );
  const databaseDirectUrl = requireEnvironmentValue(
    rawEnvironment,
    "DATABASE_NEON_DIRECT_URL",
    "when APP_RUNTIME_MODE=cloud"
  );
  const redisUrl = requireEnvironmentValue(
    rawEnvironment,
    "REDIS_URL",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3AccessKeyId = requireEnvironmentValue(
    rawEnvironment,
    "S3_ACCESS_KEY_ID",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3SecretAccessKey = requireEnvironmentValue(
    rawEnvironment,
    "S3_SECRET_ACCESS_KEY",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3Endpoint = requireEnvironmentValue(
    rawEnvironment,
    "S3_ENDPOINT",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3Region = requireEnvironmentValue(
    rawEnvironment,
    "S3_REGION",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3BucketPrivate = requireEnvironmentValue(
    rawEnvironment,
    "S3_BUCKET_PRIVATE",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3BucketPublic = requireEnvironmentValue(
    rawEnvironment,
    "S3_BUCKET_PUBLIC",
    "when APP_RUNTIME_MODE=cloud"
  );
  const s3PublicBaseUrl = requireEnvironmentValue(
    rawEnvironment,
    "S3_PUBLIC_BASE_URL",
    "when APP_RUNTIME_MODE=cloud"
  );

  const runtimeDatabase = parseUrl(databaseRuntimeUrl, "DATABASE_NEON_URL");
  const directDatabase = parseUrl(
    databaseDirectUrl,
    "DATABASE_NEON_DIRECT_URL"
  );
  const parsedRedisUrl = parseUrl(redisUrl, "REDIS_URL");
  const parsedS3Endpoint = parseUrl(s3Endpoint, "S3_ENDPOINT");
  const parsedS3PublicBaseUrl = parseUrl(s3PublicBaseUrl, "S3_PUBLIC_BASE_URL");

  if (runtimeDatabase.protocol !== "postgresql:") {
    throw new Error(
      "DATABASE_NEON_URL must be a postgresql:// connection string when APP_RUNTIME_MODE=cloud."
    );
  }

  if (directDatabase.protocol !== "postgresql:") {
    throw new Error(
      "DATABASE_NEON_DIRECT_URL must be a postgresql:// connection string when APP_RUNTIME_MODE=cloud."
    );
  }

  if (isLocalHost(runtimeDatabase.hostname)) {
    throw new Error(
      "DATABASE_NEON_URL must point to a hosted Neon database when APP_RUNTIME_MODE=cloud."
    );
  }

  if (isLocalHost(directDatabase.hostname)) {
    throw new Error(
      "DATABASE_NEON_DIRECT_URL must point to a hosted Neon database when APP_RUNTIME_MODE=cloud."
    );
  }

  if (parsedRedisUrl.protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL must use a hosted TLS Redis URL such as rediss://... when APP_RUNTIME_MODE=cloud."
    );
  }

  if (isLocalHost(parsedRedisUrl.hostname)) {
    throw new Error(
      "REDIS_URL must point to a hosted Redis service such as Upstash when APP_RUNTIME_MODE=cloud."
    );
  }

  if (parsedS3Endpoint.protocol !== "https:") {
    throw new Error(
      "S3_ENDPOINT must use an https:// R2 S3 API endpoint when APP_RUNTIME_MODE=cloud."
    );
  }

  if (isLocalHost(parsedS3Endpoint.hostname)) {
    throw new Error(
      "S3_ENDPOINT must point to a hosted object-storage API such as Cloudflare R2 when APP_RUNTIME_MODE=cloud."
    );
  }

  if (parsedS3PublicBaseUrl.protocol !== "https:") {
    throw new Error(
      "S3_PUBLIC_BASE_URL must use an https:// public bucket URL when APP_RUNTIME_MODE=cloud."
    );
  }

  if (isLocalHost(parsedS3PublicBaseUrl.hostname)) {
    throw new Error(
      "S3_PUBLIC_BASE_URL must point to a hosted public bucket URL when APP_RUNTIME_MODE=cloud."
    );
  }

  return {
    databaseDirectUrl,
    databaseMode,
    databaseRuntimeUrl,
    redisUrl,
    runtimeMode,
    s3AccessKeyId,
    s3BucketPrivate,
    s3BucketPublic,
    s3Endpoint,
    s3PublicBaseUrl,
    s3Region,
    s3SecretAccessKey
  };
}

export function resolveScriptPaths() {
  return {
    repoRoot
  };
}
