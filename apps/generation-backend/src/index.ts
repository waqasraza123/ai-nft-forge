import "dotenv/config";

import { bootstrapGenerationBackendApplication } from "./bootstrap/application.js";
import { registerGenerationBackendSignalHandlers } from "./bootstrap/signals.js";
import { createGenerationBackendHealthSnapshot } from "./lib/health.js";

async function runGenerationBackendCommand(argv: string[]) {
  const command = argv[0] ?? "start";

  if (command === "health") {
    process.stdout.write(
      `${JSON.stringify(createGenerationBackendHealthSnapshot(process.env))}\n`
    );
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
