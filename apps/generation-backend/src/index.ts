import { loadRepositoryEnvironment } from "@ai-nft-forge/shared";

import {
  bootstrapGenerationBackendApplication,
  createGenerationBackendRuntime
} from "./bootstrap/application.js";
import { registerGenerationBackendSignalHandlers } from "./bootstrap/signals.js";
import {
  createGenerationBackendHealthSnapshot,
  createGenerationBackendReadinessSnapshot
} from "./lib/health.js";

loadRepositoryEnvironment(process.env);

async function runGenerationBackendCommand(argv: string[]) {
  const command = argv[0] ?? "start";

  if (command === "health" || command === "ready") {
    const runtime = await createGenerationBackendRuntime(process.env);

    if (command === "health") {
      process.stdout.write(
        `${JSON.stringify(
          createGenerationBackendHealthSnapshot({
            provider: runtime.provider,
            rawEnvironment: process.env
          })
        )}\n`
      );
      return;
    }

    const readinessSnapshot = await createGenerationBackendReadinessSnapshot({
      provider: runtime.provider,
      rawEnvironment: process.env
    });

    process.stdout.write(`${JSON.stringify(readinessSnapshot)}\n`);

    if (readinessSnapshot.status !== "ready") {
      process.exitCode = 1;
    }

    return;
  }

  if (command !== "start") {
    throw new Error(`Unknown generation backend command: ${command}`);
  }

  const application = await bootstrapGenerationBackendApplication(process.env);

  registerGenerationBackendSignalHandlers(application);
  await new Promise<void>(() => undefined);
}

runGenerationBackendCommand(process.argv.slice(2)).catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown generation backend error";

  process.stderr.write(
    `${JSON.stringify({
      error: message,
      level: "error",
      service: "generation-backend",
      timestamp: new Date().toISOString()
    })}\n`
  );
  process.exitCode = 1;
});
