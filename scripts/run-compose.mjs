import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supportedDatabaseModes = new Set(["local", "neon"]);
const supportedStacks = new Set(["local", "selfhost"]);

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

function parseEnvironmentFile(filePath) {
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

function resolveDatabaseMode() {
  const resolvedEnvironment = {
    ...parseEnvironmentFile(resolve(repoRoot, ".env")),
    ...parseEnvironmentFile(resolve(repoRoot, ".env.local")),
    ...process.env
  };
  const configuredDatabaseMode =
    resolvedEnvironment.DATABASE_MODE?.trim() ?? "local";

  if (!supportedDatabaseModes.has(configuredDatabaseMode)) {
    throw new Error(
      `Unsupported DATABASE_MODE "${configuredDatabaseMode}". Expected one of: ${Array.from(
        supportedDatabaseModes
      ).join(", ")}.`
    );
  }

  return configuredDatabaseMode;
}

function resolveComposeFiles(input) {
  const databaseMode = resolveDatabaseMode();
  const baseFilePath =
    input.stack === "selfhost"
      ? databaseMode === "neon"
        ? "infra/docker/docker-compose.selfhost.neon.yml"
        : "infra/docker/docker-compose.selfhost.yml"
      : databaseMode === "neon"
        ? "infra/docker/docker-compose.neon.yml"
        : "infra/docker/docker-compose.yml";
  const composeFilePaths = [resolve(repoRoot, baseFilePath)];

  if (input.includeGpuCompose && input.stack === "local") {
    composeFilePaths.push(
      resolve(repoRoot, "infra/docker/docker-compose.gpu.yml")
    );
  }

  return composeFilePaths;
}

const [stack, ...rawArgs] = process.argv.slice(2);

if (!stack || !supportedStacks.has(stack)) {
  throw new Error(
    `Expected the first argument to be one of: ${Array.from(
      supportedStacks
    ).join(", ")}.`
  );
}

const dockerComposeArgs = [];
let includeGpuCompose = false;

for (const arg of rawArgs) {
  if (arg === "--with-gpu-compose") {
    includeGpuCompose = true;
    continue;
  }

  dockerComposeArgs.push(arg);
}

const composeFilePaths = resolveComposeFiles({
  includeGpuCompose,
  stack
});
const result = spawnSync(
  "docker",
  [
    "compose",
    ...composeFilePaths.flatMap((composeFilePath) => ["-f", composeFilePath]),
    ...dockerComposeArgs
  ],
  {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit"
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
