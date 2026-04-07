import {
  createOpsAlertMuteRepository,
  createOpsAlertStateRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";

import { createOpsService } from "./service";

export function createRuntimeOpsService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);

  return createOpsService({
    now: () => new Date(),
    repositories: {
      opsAlertMuteRepository: createOpsAlertMuteRepository(databaseClient),
      opsAlertStateRepository: createOpsAlertStateRepository(databaseClient)
    }
  });
}
