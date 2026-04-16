import {
  createAuditLogRepository,
  createAuthNonceRepository,
  createAuthSessionRepository,
  createUserRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import { parseWebAuthEnv, type WebAuthEnv } from "@ai-nft-forge/shared";

import { createAuthNonce, hashAuthRequestValue } from "./request-context";
import { createAuthService } from "./service";
import { createAuthSignatureVerifier } from "./signature";

function createAuthRepositories(executor: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(executor),
    authNonceRepository: createAuthNonceRepository(executor),
    authSessionRepository: createAuthSessionRepository(executor),
    userRepository: createUserRepository(executor),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(executor),
    workspaceMembershipRepository:
      createWorkspaceMembershipRepository(executor),
    workspaceRepository: createWorkspaceRepository(executor)
  };
}

export function getWebAuthConfig(
  rawEnvironment: NodeJS.ProcessEnv = process.env
): WebAuthEnv {
  return parseWebAuthEnv(rawEnvironment);
}

export function createRuntimeAuthService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);

  return createAuthService({
    config: getWebAuthConfig(rawEnvironment),
    createNonce: createAuthNonce,
    hashValue: hashAuthRequestValue,
    now: () => new Date(),
    repositories: createAuthRepositories(databaseClient),
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, async (transaction) =>
        operation(createAuthRepositories(transaction))
      ),
    verifyMessageSignature: createAuthSignatureVerifier(rawEnvironment)
  });
}
