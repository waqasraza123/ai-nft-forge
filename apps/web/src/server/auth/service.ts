import {
  authNonceResponseSchema,
  authSessionResponseSchema,
  type WebAuthEnv
} from "@ai-nft-forge/shared";

import { AuthServiceError } from "./error";
import { createAuthMessage, normalizeWalletAddress } from "./message";

type AuthRepositorySet = {
  auditLogRepository: {
    create(input: {
      action: string;
      actorId: string;
      actorType: string;
      entityId: string;
      entityType: string;
      metadataJson: unknown;
    }): Promise<unknown>;
  };
  authNonceRepository: {
    create(input: {
      expiresAt: Date;
      nonce: string;
      walletAddress: string;
    }): Promise<{
      expiresAt: Date;
      id: string;
    }>;
    findActiveByWalletAddressAndNonce(input: {
      nonce: string;
      now: Date;
      walletAddress: string;
    }): Promise<{
      id: string;
    } | null>;
    markUsed(id: string, usedAt: Date): Promise<unknown>;
  };
  authSessionRepository: {
    create(input: {
      expiresAt: Date;
      ipHash?: string | null;
      userAgent?: string | null;
      userId: string;
    }): Promise<{
      expiresAt: Date;
      id: string;
      userId: string;
    }>;
    findActiveById(
      id: string,
      now: Date
    ): Promise<{
      expiresAt: Date;
      id: string;
      userId: string;
    } | null>;
    revoke(id: string, revokedAt: Date): Promise<unknown>;
  };
  userRepository: {
    findById(id: string): Promise<{
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    } | null>;
    findByWalletAddress(walletAddress: string): Promise<{
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    } | null>;
    upsertWalletUser(input: {
      avatarUrl?: string | null;
      displayName?: string | null;
      walletAddress: string;
    }): Promise<{
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    }>;
  };
  workspaceInvitationRepository: {
    deleteByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<{ count: number }>;
    listActiveByWalletAddress(input: {
      now: Date;
      walletAddress: string;
    }): Promise<
      Array<{
        id: string;
        role: "operator" | "owner" | "viewer";
        walletAddress: string;
        workspace: {
          id: string;
          ownerUserId: string;
        };
        workspaceId: string;
      }>
    >;
  };
  workspaceMembershipRepository: {
    create(input: {
      role?: "operator" | "owner" | "viewer";
      userId: string;
      workspaceId: string;
    }): Promise<{
      id: string;
    }>;
    findFirstByUserId(userId: string): Promise<{
      workspace: {
        id: string;
      };
    } | null>;
  };
  workspaceRepository: {
    findFirstByOwnerUserId(ownerUserId: string): Promise<{
      id: string;
    } | null>;
  };
};

type AuthenticatedSession = NonNullable<
  ReturnType<typeof authSessionResponseSchema.parse>["session"]
>;

type VerifiedSessionResult = {
  session: AuthenticatedSession;
  sessionId: string;
};

type AuthServiceDependencies = {
  config: WebAuthEnv;
  createNonce: () => string;
  hashValue: (value: string) => string;
  now: () => Date;
  repositories: AuthRepositorySet;
  runTransaction: <T>(
    operation: (repositories: AuthRepositorySet) => Promise<T>
  ) => Promise<T>;
  verifyMessageSignature: (input: {
    expectedDomain?: string | null;
    nonce: string;
    signature: `0x${string}`;
    signedMessage?: string;
    statement: string;
    walletAddress: string;
  }) => Promise<boolean>;
};

export function createAuthService(dependencies: AuthServiceDependencies) {
  const nonceTtlMilliseconds =
    dependencies.config.AUTH_NONCE_TTL_MINUTES * 60 * 1000;
  const sessionTtlMilliseconds =
    dependencies.config.AUTH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

  return {
    async issueNonce(input: {
      walletAddress: string;
    }): Promise<ReturnType<typeof authNonceResponseSchema.parse>> {
      const walletAddress = normalizeWalletAddress(input.walletAddress);
      const nonce = dependencies.createNonce();
      const expiresAt = new Date(
        dependencies.now().getTime() + nonceTtlMilliseconds
      );

      await dependencies.repositories.authNonceRepository.create({
        expiresAt,
        nonce,
        walletAddress
      });

      return authNonceResponseSchema.parse({
        expiresAt: expiresAt.toISOString(),
        message: createAuthMessage({
          nonce,
          statement: dependencies.config.AUTH_MESSAGE_STATEMENT,
          walletAddress
        }),
        nonce,
        walletAddress
      });
    },

    async verifyAndCreateSession(input: {
      avatarUrl?: string;
      displayName?: string;
      expectedDomain?: string | null;
      ipAddress: string | null;
      nonce: string;
      signature: `0x${string}`;
      signedMessage?: string;
      userAgent: string | null;
      walletAddress: string;
    }): Promise<VerifiedSessionResult> {
      const walletAddress = normalizeWalletAddress(input.walletAddress);
      const now = dependencies.now();

      return dependencies.runTransaction(async (repositories) => {
        const authNonce =
          await repositories.authNonceRepository.findActiveByWalletAddressAndNonce(
            {
              nonce: input.nonce,
              now,
              walletAddress
            }
          );

        if (!authNonce) {
          throw new AuthServiceError(
            "NONCE_INVALID",
            "Nonce is invalid, expired, or already used.",
            401
          );
        }

        const signatureValid = await dependencies.verifyMessageSignature({
          nonce: input.nonce,
          signature: input.signature,
          statement: dependencies.config.AUTH_MESSAGE_STATEMENT,
          walletAddress,
          ...(input.expectedDomain !== undefined
            ? {
                expectedDomain: input.expectedDomain
              }
            : {}),
          ...(input.signedMessage !== undefined
            ? {
                signedMessage: input.signedMessage
              }
            : {})
        });

        if (!signatureValid) {
          throw new AuthServiceError(
            "SIGNATURE_INVALID",
            "Signature verification failed.",
            401
          );
        }

        await repositories.authNonceRepository.markUsed(authNonce.id, now);

        const user = await repositories.userRepository.upsertWalletUser({
          walletAddress,
          ...(input.avatarUrl !== undefined
            ? { avatarUrl: input.avatarUrl }
            : {}),
          ...(input.displayName !== undefined
            ? { displayName: input.displayName }
            : {})
        });

        const existingOwnedWorkspace =
          await repositories.workspaceRepository.findFirstByOwnerUserId(
            user.id
          );
        const existingWorkspaceMembership =
          await repositories.workspaceMembershipRepository.findFirstByUserId(
            user.id
          );

        if (!existingOwnedWorkspace && !existingWorkspaceMembership) {
          const pendingInvitations =
            await repositories.workspaceInvitationRepository.listActiveByWalletAddress(
              {
                now,
                walletAddress
              }
            );
          const acceptedInvitation = pendingInvitations[0] ?? null;

          if (acceptedInvitation) {
            const createdMembership =
              await repositories.workspaceMembershipRepository.create({
                role: acceptedInvitation.role,
                userId: user.id,
                workspaceId: acceptedInvitation.workspaceId
              });

            await repositories.workspaceInvitationRepository.deleteByIdForWorkspace(
              {
                id: acceptedInvitation.id,
                workspaceId: acceptedInvitation.workspaceId
              }
            );
            await repositories.auditLogRepository.create({
              action: "workspace_invitation_accepted",
              actorId: user.id,
              actorType: "user",
              entityId: acceptedInvitation.workspaceId,
              entityType: "workspace",
              metadataJson: {
                actorWalletAddress: user.walletAddress,
                membershipId: createdMembership.id,
                role: acceptedInvitation.role,
                targetUserId: user.id,
                targetWalletAddress: user.walletAddress
              }
            });

            for (const invitation of pendingInvitations.slice(1)) {
              await repositories.workspaceInvitationRepository.deleteByIdForWorkspace(
                {
                  id: invitation.id,
                  workspaceId: invitation.workspaceId
                }
              );
              await repositories.auditLogRepository.create({
                action: "workspace_invitation_canceled",
                actorId: user.id,
                actorType: "user",
                entityId: invitation.workspaceId,
                entityType: "workspace",
                metadataJson: {
                  actorWalletAddress: user.walletAddress,
                  role: invitation.role,
                  targetUserId: user.id,
                  targetWalletAddress: user.walletAddress
                }
              });
            }
          }
        }

        const expiresAt = new Date(now.getTime() + sessionTtlMilliseconds);
        const ipHash = input.ipAddress
          ? dependencies.hashValue(input.ipAddress)
          : null;
        const session = await repositories.authSessionRepository.create({
          expiresAt,
          ipHash,
          userAgent: input.userAgent,
          userId: user.id
        });

        return {
          session: authSessionResponseSchema.parse({
            authenticated: true,
            session: {
              expiresAt: session.expiresAt.toISOString(),
              user: {
                avatarUrl: user.avatarUrl,
                displayName: user.displayName,
                id: user.id,
                walletAddress: user.walletAddress
              }
            }
          }).session as AuthenticatedSession,
          sessionId: session.id
        };
      });
    },

    async getSession(input: {
      sessionId: string;
    }): Promise<AuthenticatedSession | null> {
      const authSession =
        await dependencies.repositories.authSessionRepository.findActiveById(
          input.sessionId,
          dependencies.now()
        );

      if (!authSession) {
        return null;
      }

      const user = await dependencies.repositories.userRepository.findById(
        authSession.userId
      );

      if (!user) {
        return null;
      }

      return authSessionResponseSchema.parse({
        authenticated: true,
        session: {
          expiresAt: authSession.expiresAt.toISOString(),
          user: {
            avatarUrl: user.avatarUrl,
            displayName: user.displayName,
            id: user.id,
            walletAddress: user.walletAddress
          }
        }
      }).session as AuthenticatedSession;
    },

    async revokeSession(input: { sessionId: string }): Promise<void> {
      const authSession =
        await dependencies.repositories.authSessionRepository.findActiveById(
          input.sessionId,
          dependencies.now()
        );

      if (!authSession) {
        return;
      }

      await dependencies.repositories.authSessionRepository.revoke(
        authSession.id,
        dependencies.now()
      );
    }
  };
}
