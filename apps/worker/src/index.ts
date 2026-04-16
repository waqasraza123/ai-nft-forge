import { loadRepositoryEnvironment } from "@ai-nft-forge/shared/server";

import { bootstrapWorkerApplication } from "./bootstrap/application.js";
import { registerWorkerSignalHandlers } from "./bootstrap/signals.js";
import { createWorkerHealthSnapshot } from "./lib/health.js";
import { reconcileRuntimeOps } from "./ops/reconciliation-runtime.js";
import { captureRuntimeOpsObservability } from "./ops/runtime.js";
import { runWorkspaceLifecycleAutomation } from "./workspaces/automation-runtime.js";

loadRepositoryEnvironment(process.env);

async function runWorkerCommand(argv: string[]) {
  const command = argv[0] ?? "start";

  if (command === "health") {
    process.stdout.write(
      `${JSON.stringify(createWorkerHealthSnapshot(process.env))}\n`
    );
    return;
  }

  if (command === "capture-observability") {
    const captureSummary = await captureRuntimeOpsObservability(process.env);

    process.stdout.write(`${JSON.stringify(captureSummary)}\n`);
    return;
  }

  if (command === "reconcile") {
    const reconciliationSummary = await reconcileRuntimeOps(process.env);

    process.stdout.write(`${JSON.stringify(reconciliationSummary)}\n`);
    return;
  }

  if (command === "run-lifecycle-automation") {
    const automationSummary = await runWorkspaceLifecycleAutomation(
      process.env
    );

    process.stdout.write(`${JSON.stringify(automationSummary)}\n`);
    return;
  }

  if (command !== "start") {
    throw new Error(`Unknown worker command: ${command}`);
  }

  const workerApplication = await bootstrapWorkerApplication(process.env);

  registerWorkerSignalHandlers(workerApplication);
  await new Promise<void>(() => undefined);
}

runWorkerCommand(process.argv.slice(2)).catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown worker error";

  process.stderr.write(
    `${JSON.stringify({
      error: message,
      level: "error",
      service: "worker",
      timestamp: new Date().toISOString()
    })}\n`
  );
  process.exitCode = 1;
});
