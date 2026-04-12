import {
  createAuditLogRepository,
  createBrandRepository,
  createPublishedCollectionRepository,
  createUserRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceLifecycleNotificationDeliveryRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRoleEscalationRequestRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";

import { createStudioSettingsService } from "./service";
import { createRuntimeWorkspaceLifecycleDeliveryService } from "../workspaces/lifecycle-delivery-runtime";
import { loadWorkspaceLifecycleAutomationSnapshot } from "../workspaces/lifecycle-automation-runtime";

function createStudioSettingsRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    brandRepository: createBrandRepository(database),
    publishedCollectionRepository:
      createPublishedCollectionRepository(database),
    userRepository: createUserRepository(database),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(database),
    workspaceLifecycleNotificationDeliveryRepository:
      createWorkspaceLifecycleNotificationDeliveryRepository(database),
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
    lifecycleAutomationSnapshotLoader: () =>
      loadWorkspaceLifecycleAutomationSnapshot(rawEnvironment),
    lifecycleDeliveryService:
      createRuntimeWorkspaceLifecycleDeliveryService(rawEnvironment),
    repositories: createStudioSettingsRepositories(databaseClient),
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, (transaction) =>
        operation(createStudioSettingsRepositories(transaction))
      )
  });
}
