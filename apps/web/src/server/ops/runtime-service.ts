import {
  createOpsAlertEscalationPolicyRepository,
  createOpsAlertMuteRepository,
  createOpsAlertRoutingPolicyRepository,
  createOpsAlertSchedulePolicyRepository,
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
      opsAlertEscalationPolicyRepository:
        createOpsAlertEscalationPolicyRepository(databaseClient),
      opsAlertMuteRepository: createOpsAlertMuteRepository(databaseClient),
      opsAlertRoutingPolicyRepository:
        createOpsAlertRoutingPolicyRepository(databaseClient),
      opsAlertSchedulePolicyRepository:
        createOpsAlertSchedulePolicyRepository(databaseClient),
      opsAlertStateRepository: createOpsAlertStateRepository(databaseClient)
    }
  });
}
