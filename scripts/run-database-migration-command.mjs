import { spawnSync } from "node:child_process";

import { resolveRepositoryEnvironment, resolveScriptPaths } from "./runtime-environment.mjs";

const { repoRoot } = resolveScriptPaths();
const runtimeEnvironment = resolveRepositoryEnvironment();
const supportedCommands = new Set(["deploy", "status"]);

function printBufferedOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function runCommand(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    shell: false
  });
}

function shouldUseNeonCloudFallback(output) {
  if ((runtimeEnvironment.APP_RUNTIME_MODE?.trim() ?? "docker") !== "cloud") {
    return false;
  }

  if ((runtimeEnvironment.DATABASE_MODE?.trim() ?? "local") !== "neon") {
    return false;
  }

  return (
    output.includes("P1001") ||
    output.includes("Schema engine error") ||
    output.includes("Can't reach database server")
  );
}

function printFallbackNotice(command) {
  process.stderr.write(
    `Prisma schema engine failed during migrate ${command} in cloud Neon mode. Falling back to the pg-based SQL migration runner.\n`
  );
}

const command = process.argv[2];

if (!command || !supportedCommands.has(command)) {
  throw new Error(
    `Expected one of: ${Array.from(supportedCommands).join(", ")}.`
  );
}

const prismaCommand = runCommand("pnpm", [
  "--filter",
  "@ai-nft-forge/database",
  `prisma:migrate:${command}`
]);

if (prismaCommand.status === 0) {
  printBufferedOutput(prismaCommand);
  process.exit(0);
}

const combinedOutput = `${prismaCommand.stdout ?? ""}\n${prismaCommand.stderr ?? ""}`;

if (!shouldUseNeonCloudFallback(combinedOutput)) {
  printBufferedOutput(prismaCommand);
  process.exit(prismaCommand.status ?? 1);
}

printFallbackNotice(command);

const fallbackCommand = runCommand("pnpm", [
  "--filter",
  "@ai-nft-forge/database",
  "exec",
  "node",
  "scripts/cloud-neon-migrate.mjs",
  command
]);

printBufferedOutput(fallbackCommand);
process.exit(fallbackCommand.status ?? 1);
