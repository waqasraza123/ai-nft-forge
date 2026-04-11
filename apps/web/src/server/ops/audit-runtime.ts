import {
  createAuditLogRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";

import { createOpsAuditService } from "./audit-service";

export function createRuntimeOpsAuditService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);

  return createOpsAuditService({
    repositories: {
      auditLogRepository: createAuditLogRepository(databaseClient)
    }
  });
}
