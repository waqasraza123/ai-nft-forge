import {
  createWorkspaceLifecycleAutomationRunRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";

import {
  createWorkspaceLifecycleAutomationHealth,
  serializeWorkspaceLifecycleAutomationRun
} from "./lifecycle-automation-health";

export async function loadWorkspaceLifecycleAutomationSnapshot(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const database = getDatabaseClient(rawEnvironment);
  const automationRunRepository =
    createWorkspaceLifecycleAutomationRunRepository(database);
  const [latestRun, recentRuns] = await Promise.all([
    automationRunRepository.findLatest(),
    automationRunRepository.listRecent({
      limit: 5
    })
  ]);

  return {
    lifecycleAutomationHealth: createWorkspaceLifecycleAutomationHealth({
      latestRun,
      now: new Date(),
      rawEnvironment
    }),
    recentLifecycleAutomationRuns: recentRuns.map(
      (run: (typeof recentRuns)[number]) =>
        serializeWorkspaceLifecycleAutomationRun(run)
    )
  };
}
