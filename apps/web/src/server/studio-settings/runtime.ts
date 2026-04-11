import {
  createAuditLogRepository,
  createBrandRepository,
  createPublishedCollectionRepository,
  createUserRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRoleEscalationRequestRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";

import { createStudioSettingsService } from "./service";

function createStudioSettingsRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    brandRepository: createBrandRepository(database),
    publishedCollectionRepository:
      createPublishedCollectionRepository(database),
    userRepository: createUserRepository(database),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(database),
    workspaceMembershipRepository:
      createWorkspaceMembershipRepository(database),
    workspaceRoleEscalationRequestRepository:
      createWorkspaceRoleEscalationRequestRepository(database),
    workspaceRepository: createWorkspaceRepository(database)
  };
}

export function createRuntimeStudioSettingsService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);

  return createStudioSettingsService({
    repositories: createStudioSettingsRepositories(databaseClient),
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, (transaction) =>
        operation(createStudioSettingsRepositories(transaction))
      )
  });
}
