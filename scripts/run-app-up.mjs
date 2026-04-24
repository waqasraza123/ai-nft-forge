import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

import {
  resolveAppRuntimeMode,
  resolveAppStartupMode,
  resolveRepositoryEnvironment,
  resolveScriptPaths,
  validateCloudRuntimeEnvironment
} from "./runtime-environment.mjs";

const { repoRoot } = resolveScriptPaths();
const defaultPorts = {
  generationBackend: "8787",
  minioConsole: "59001",
  web: "3000"
};
let activeMode = null;
let activeComposeChild = null;
let activeLocalProcesses = [];
let cleaningUp = false;

function printUsage() {
  console.log(`Usage:
  pnpm app:up
  APP_RUNTIME_MODE=cloud DATABASE_MODE=neon pnpm app:up
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

function parsePort(rawValue, fallbackPort, label) {
  const value = rawValue?.trim();

  if (!value) {
    return fallbackPort;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > 65535
  ) {
    throw new Error(`${label} must be a valid TCP port.`);
  }

  return parsedValue;
}

async function canBindPort(port, host) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const probeServer = createServer();
    const cleanupListeners = () => {
      probeServer.removeAllListeners("error");
      probeServer.removeAllListeners("listening");
    };

    probeServer.once("error", (error) => {
      cleanupListeners();

      if (error && error.code === "EADDRINUSE") {
        resolvePromise(false);
        return;
      }

      rejectPromise(error);
    });

    probeServer.once("listening", () => {
      cleanupListeners();
      probeServer.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }

        resolvePromise(true);
      });
    });

    probeServer.listen({
      exclusive: true,
      host,
      port
    });
  });
}

function canBindPortInSubprocess(port, host) {
  const script = `
const { createServer } = require("node:net");
const server = createServer();

server.once("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    process.exit(10);
    return;
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(11);
});

server.once("listening", () => {
  server.close((error) => {
    if (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(12);
      return;
    }

    process.exit(0);
  });
});

server.listen({
  exclusive: true,
  host: ${JSON.stringify(host)},
  port: ${JSON.stringify(port)}
});
`;
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: repoRoot,
    env: process.env,
    shell: false,
    stdio: "pipe"
  });

  if (result.status === 0) {
    return true;
  }

  if (result.status === 10) {
    return false;
  }

  const stderr = result.stderr?.toString().trim();
  throw new Error(
    stderr.length > 0
      ? stderr
      : `Port availability probe failed for ${host}:${port}.`
  );
}

async function resolveAvailablePort({ host, label, preferredPort }) {
  for (let port = preferredPort; port <= 65535; port += 1) {
    let isAvailable = false;

    try {
      // eslint-disable-next-line no-await-in-loop
      isAvailable = await canBindPort(port, host);
    } catch (error) {
      if (port === preferredPort) {
        isAvailable = canBindPortInSubprocess(port, host);

        if (!isAvailable) {
          continue;
        }
      } else {
        throw error;
      }
    }

    if (!isAvailable && port === preferredPort) {
      isAvailable = canBindPortInSubprocess(port, host);
    }

    if (isAvailable) {
      if (port !== preferredPort) {
        console.warn(
          `${label} port ${preferredPort} is already in use on ${host}; using ${port} for this run.`
        );
      }

      return port;
    }
  }

  throw new Error(
    `Unable to find a free TCP port for ${label} starting at ${preferredPort}.`
  );
}

function replaceUrlPort(urlValue, port, fallbackPathname) {
  if (typeof urlValue === "string" && urlValue.trim().length > 0) {
    const resolvedUrl = new URL(urlValue);
    resolvedUrl.port = String(port);
    return resolvedUrl.toString();
  }

  return `http://127.0.0.1:${port}${fallbackPathname}`;
}

async function resolveLocalProcessEnvironment() {
  const runtimeEnvironment = resolveRepositoryEnvironment();
  const webPort = await resolveAvailablePort({
    host: "127.0.0.1",
    label: "Web",
    preferredPort: parsePort(runtimeEnvironment.PORT, 3000, "PORT")
  });
  const generationBackendPort = await resolveAvailablePort({
    host:
      runtimeEnvironment.GENERATION_BACKEND_BIND_HOST?.trim() || "127.0.0.1",
    label: "Generation backend",
    preferredPort: parsePort(
      runtimeEnvironment.GENERATION_BACKEND_PORT,
      8787,
      "GENERATION_BACKEND_PORT"
    )
  });
  const generationBackendUrl = replaceUrlPort(
    runtimeEnvironment.GENERATION_BACKEND_URL,
    generationBackendPort,
    "/generate"
  );

  return {
    ...process.env,
    GENERATION_BACKEND_PORT: String(generationBackendPort),
    GENERATION_BACKEND_URL: generationBackendUrl,
    PORT: String(webPort)
  };
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

function spawnPrefixedProcess(label, command, args, envOverrides = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      ...envOverrides
    },
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

  const descendantProcessIds = collectDescendantProcessIds(child.pid);

  for (const pid of descendantProcessIds.reverse()) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Ignore processes that have already exited.
    }
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function collectDescendantProcessIds(rootPid) {
  const discoveredProcessIds = new Set();
  const pendingParentIds = [rootPid];

  while (pendingParentIds.length > 0) {
    const parentPid = pendingParentIds.pop();

    if (typeof parentPid !== "number" || !Number.isInteger(parentPid)) {
      continue;
    }

    const result = spawnSync("pgrep", ["-P", String(parentPid)], {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: "pipe"
    });

    if (result.status !== 0) {
      continue;
    }

    const childProcessIds = result.stdout
      .toString()
      .split(/\s+/u)
      .map((value) => Number.parseInt(value, 10))
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value > 0 &&
          !discoveredProcessIds.has(value)
      );

    for (const pid of childProcessIds) {
      discoveredProcessIds.add(pid);
      pendingParentIds.push(pid);
    }
  }

  return Array.from(discoveredProcessIds);
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

async function cleanupCloud() {
  const runningProcesses = [...activeLocalProcesses];
  activeLocalProcesses = [];

  for (const child of runningProcesses) {
    terminateChildProcess(child);
  }

  await Promise.all(runningProcesses.map(waitForExit));
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

    if (mode === "cloud") {
      await cleanupCloud();
      return;
    }

    await cleanupLocal();
  } finally {
    cleaningUp = false;
  }
}

function printStartupUrls(mode, runtimeMode, rawEnvironment = null) {
  const runtimeEnvironment = rawEnvironment ?? resolveRepositoryEnvironment();
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

  if (runtimeMode === "cloud") {
    console.log(`Application URLs:
  Web: http://127.0.0.1:${webPort}
  Generation backend: http://127.0.0.1:${generationBackendPort}`);
    return;
  }

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
  printStartupUrls("selfhost", "docker");
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
  const localProcessEnvironment = await resolveLocalProcessEnvironment();

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

  printStartupUrls("local", "docker", localProcessEnvironment);
  registerSignalHandlers("local");

  await runAppProcesses("local", localProcessEnvironment);
}

async function runCloudMode() {
  validateCloudRuntimeEnvironment(resolveRepositoryEnvironment());
  const localProcessEnvironment = await resolveLocalProcessEnvironment();
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

  printStartupUrls("local", "cloud", localProcessEnvironment);
  registerSignalHandlers("cloud");
  await runAppProcesses("cloud", localProcessEnvironment);
}

async function runAppProcesses(mode, childEnvironment) {
  const children = [
    spawnPrefixedProcess(
      "generation-backend",
      "pnpm",
      ["--filter", "@ai-nft-forge/generation-backend", "start"],
      childEnvironment
    ),
    spawnPrefixedProcess(
      "worker",
      "pnpm",
      ["--filter", "@ai-nft-forge/worker", "start"],
      childEnvironment
    ),
    spawnPrefixedProcess(
      "web",
      "pnpm",
      ["--filter", "@ai-nft-forge/web", "dev"],
      childEnvironment
    )
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
    console.error(`An app process exited unexpectedly: ${exitResult.label}.`);
    await cleanup(mode);
  }

  if (exitResult.signal) {
    process.exit(0);
  }

  process.exit(exitResult.code ?? 1);
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const runtimeEnvironment = resolveRepositoryEnvironment();
  const runtimeMode = resolveAppRuntimeMode(runtimeEnvironment);
  const mode = resolveAppStartupMode(argv, runtimeMode);
  activeMode = mode;

  if (runtimeMode === "cloud") {
    activeMode = "cloud";
    await runCloudMode();
    return;
  }

  if (mode === "selfhost") {
    await runSelfhostMode();
    return;
  }

  await runLocalMode();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);

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

  if (
    message.includes("Unsupported mode") ||
    message.includes("Remove --mode=selfhost")
  ) {
    printUsage();
  }

  process.exit(1);
});
