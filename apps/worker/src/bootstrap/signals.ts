import type { WorkerApplication } from "./application.js";

export function registerWorkerSignalHandlers(
  workerApplication: WorkerApplication
) {
  const handleSignal = async (signal: NodeJS.Signals) => {
    workerApplication.logger.info("Worker shutdown requested", {
      signal
    });

    await workerApplication.close();
    process.exit(0);
  };

  process.once("SIGINT", async () => handleSignal("SIGINT"));
  process.once("SIGTERM", async () => handleSignal("SIGTERM"));
}
