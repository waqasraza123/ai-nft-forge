import type { GenerationBackendApplication } from "./application.js";

export function registerGenerationBackendSignalHandlers(
  application: GenerationBackendApplication
) {
  let isShuttingDown = false;

  const handleSignal = (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    application.logger.info("Received shutdown signal", {
      signal
    });
    void application.close().finally(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);
}
