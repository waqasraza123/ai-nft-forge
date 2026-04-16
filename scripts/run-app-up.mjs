import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supportedModes = new Set(["local", "selfhost"]);
const defaultPorts = {
  generationBackend: "8787",
  minioConsole: "59001",
  web: "3000"
};
let activeMode = null;
let activeComposeChild = null;
let activeLocalProcesses = [];
let cleaningUp = false;

class UsageError extends Error {}

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

function resolveRuntimeEnvironment() {
  return {
    ...parseEnvironmentFile(resolve(repoRoot, ".env")),
    ...parseEnvironmentFile(resolve(repoRoot, ".env.local")),
    ...process.env
  };
}

function resolveMode(argv) {
  let mode = "selfhost";

  for (const arg of argv) {
    if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  if (!supportedModes.has(mode)) {
    throw new UsageError(
      `Unsupported mode "${mode}". Use one of: ${Array.from(
        supportedModes
      ).join(", ")}.`
    );
  }

  return mode;
}

function printUsage() {
  console.log(`Usage:
  pnpm app:up
  pnpm app:up -- --mode=local
  pnpm app:up -- --mode=selfhost`);
}

function runBlockingCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    shell: false,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function runCleanupCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    shell: false,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function prefixStream(stream, prefix) {
  let pending = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";

    for (const line of lines) {
      process.stdout.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (pending.length > 0) {
      process.stdout.write(`[${prefix}] ${pending}\n`);
    }
  });
}

function spawnPrefixedProcess(label, command, args) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: process.platform !== "win32",
    env: process.env,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"]
  });

  prefixStream(child.stdout, label);
  prefixStream(child.stderr, label);

  return child;
}

function terminateChildProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    child.kill("SIGTERM");
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function waitForExit(child) {
  return new Promise((resolvePromise) => {
    child.once("exit", () => {
      resolvePromise();
    });
  });
}

async function cleanupSelfhost() {
  if (activeComposeChild) {
    terminateChildProcess(activeComposeChild);
    await waitForExit(activeComposeChild);
    activeComposeChild = null;
  }

  runCleanupCommand(
    "node",
    ["scripts/run-compose.mjs", "selfhost", "down", "--remove-orphans"],
    "Self-host shutdown"
  );
}

async function cleanupLocal() {
  const runningProcesses = [...activeLocalProcesses];
  activeLocalProcesses = [];

  for (const child of runningProcesses) {
    terminateChildProcess(child);
  }

  await Promise.all(runningProcesses.map(waitForExit));
  runCleanupCommand("pnpm", ["infra:down"], "Local infra shutdown");
}

async function cleanup(mode) {
  if (cleaningUp) {
    return;
  }

  cleaningUp = true;

  try {
    if (mode === "selfhost") {
      await cleanupSelfhost();
      return;
    }

    await cleanupLocal();
  } finally {
    cleaningUp = false;
  }
}

function printStartupUrls(mode) {
  const runtimeEnvironment = resolveRuntimeEnvironment();
  const webPort =
    mode === "selfhost"
      ? (runtimeEnvironment.WEB_PORT_PUBLIC ?? defaultPorts.web)
      : (runtimeEnvironment.PORT ?? defaultPorts.web);
  const generationBackendPort =
    mode === "selfhost"
      ? (runtimeEnvironment.GENERATION_BACKEND_PORT_PUBLIC ??
        defaultPorts.generationBackend)
      : (runtimeEnvironment.GENERATION_BACKEND_PORT ??
        defaultPorts.generationBackend);
  const minioConsolePort =
    runtimeEnvironment.MINIO_CONSOLE_PORT ?? defaultPorts.minioConsole;

  console.log(`Application URLs:
  Web: http://127.0.0.1:${webPort}
  Generation backend: http://127.0.0.1:${generationBackendPort}
  MinIO console: http://127.0.0.1:${minioConsolePort}`);
}

function registerSignalHandlers(mode) {
  const handleSignal = (signal) => {
    process.off("SIGINT", handleSignal);
    process.off("SIGTERM", handleSignal);

    cleanup(mode)
      .then(() => {
        process.exit(signal === "SIGINT" ? 130 : 143);
      })
      .catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      });
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);
}

async function runSelfhostMode() {
  printStartupUrls("selfhost");
  registerSignalHandlers("selfhost");

  const child = spawn(
    "node",
    ["scripts/run-compose.mjs", "selfhost", "up", "--build"],
    {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: "inherit"
    }
  );

  activeComposeChild = child;

  const exitResult = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code, signal) => {
      resolvePromise({ code, signal });
    });
  });

  activeComposeChild = null;

  if (!cleaningUp) {
    await cleanup("selfhost");
  }

  if (exitResult.signal) {
    process.exit(0);
  }

  process.exit(exitResult.code ?? 0);
}

async function runLocalMode() {
  runBlockingCommand("pnpm", ["infra:up"], "Local infra startup");
  runBlockingCommand("pnpm", ["db:migrate:deploy"], "Database migrations");
  runBlockingCommand(
    "pnpm",
    ["--filter", "@ai-nft-forge/generation-backend", "build"],
    "Generation backend build"
  );
  runBlockingCommand(
    "pnpm",
    ["--filter", "@ai-nft-forge/worker", "build"],
    "Worker build"
  );

  printStartupUrls("local");
  registerSignalHandlers("local");

  const children = [
    spawnPrefixedProcess("generation-backend", "pnpm", [
      "--filter",
      "@ai-nft-forge/generation-backend",
      "start"
    ]),
    spawnPrefixedProcess("worker", "pnpm", [
      "--filter",
      "@ai-nft-forge/worker",
      "start"
    ]),
    spawnPrefixedProcess("web", "pnpm", [
      "--filter",
      "@ai-nft-forge/web",
      "dev"
    ])
  ];

  activeLocalProcesses = children;

  const exitResult = await new Promise((resolvePromise, rejectPromise) => {
    for (const child of children) {
      child.once("error", rejectPromise);
      child.once("exit", (code, signal) => {
        resolvePromise({ code, label: child.spawnargs.join(" "), signal });
      });
    }
  });

  if (!cleaningUp) {
    console.error(
      `A local app process exited unexpectedly: ${exitResult.label}.`
    );
    await cleanup("local");
  }

  if (exitResult.signal) {
    process.exit(0);
  }

  process.exit(exitResult.code ?? 1);
}

async function main() {
  const mode = resolveMode(process.argv.slice(2));
  activeMode = mode;

  if (mode === "selfhost") {
    await runSelfhostMode();
    return;
  }

  await runLocalMode();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));

  if (activeMode && !cleaningUp) {
    try {
      await cleanup(activeMode);
    } catch (cleanupError) {
      console.error(
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError)
      );
    }
  }

  if (error instanceof UsageError) {
    printUsage();
  }

  process.exit(1);
});
