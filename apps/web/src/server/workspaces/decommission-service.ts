import {
  createAuditLogRepository,
  createWorkspaceDecommissionRequestRepository,
  createWorkspaceRepository,
  createUserRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  workspaceDecommissionExecutionResponseSchema,
  workspaceDecommissionResponseSchema,
  type WorkspaceDecommissionSummary
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "../studio-settings/error";
import { createRuntimeWorkspaceOffboardingService } from "./offboarding-service";

type WorkspaceDecommissionRepositorySet = {
  auditLogRepository: {
    create(input: {
      action: string;
      actorId: string;
      actorType: string;
      entityId: string;
      entityType: string;
      metadataJson: unknown;
    }): Promise<{ id: string }>;
  };
  userRepository: {
    findById(id: string): Promise<{
      id: string;
      walletAddress: string;
    } | null>;
  };
  workspaceDecommissionRequestRepository: {
    create(input: {
      executeAfter: Date;
      exportConfirmedAt: Date;
      reason?: string | null;
      requestedByUserId: string;
      retentionDays: number;
      workspaceId: string;
    }): Promise<{ id: string }>;
    findScheduledByWorkspaceId(input: {
      workspaceId: string;
    }): Promise<{
      canceledAt: Date | null;
      canceledByUser: {
        walletAddress: string;
      } | null;
      canceledByUserId: string | null;
      createdAt: Date;
      executeAfter: Date;
      executedAt: Date | null;
      executedByUser: {
        walletAddress: string;
      } | null;
      executedByUserId: string | null;
      exportConfirmedAt: Date;
      id: string;
      reason: string | null;
      requestedByUser: {
        walletAddress: string;
      };
      requestedByUserId: string;
      retentionDays: number;
      status: "canceled" | "executed" | "scheduled";
      workspaceId: string;
    } | null>;
    cancelById(input: {
      canceledAt: Date;
      canceledByUserId: string;
      id: string;
    }): Promise<{ id: string }>;
    markExecutedById(input: {
      executedAt: Date;
      executedByUserId: string;
      id: string;
    }): Promise<{ id: string }>;
  };
  workspaceRepository: {
    deleteByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<{ count: number }>;
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<{
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    } | null>;
  };
};

type WorkspaceDecommissionOffboardingDependency = {
  exportOwnedWorkspace(input: {
    ownerUserId: string;
    workspaceId: string;
  }): Promise<{
    export: {
      offboarding: {
        blockerCodes: string[];
        cautionCodes: string[];
        readiness: "blocked" | "ready" | "review_required";
      };
      workspace: {
        id: string;
        name: string;
        slug: string;
        status: "active" | "archived" | "suspended";
      };
    };
  }>;
};

type WorkspaceDecommissionServiceDependencies = {
  createTransactionalRepositories?: (
    executor: DatabaseExecutor
  ) => WorkspaceDecommissionRepositorySet;
  now: () => Date;
  offboardingService: WorkspaceDecommissionOffboardingDependency;
  repositories: WorkspaceDecommissionRepositorySet;
  runInTransaction: <T>(
    callback: (repositories: WorkspaceDecommissionRepositorySet) => Promise<T>
  ) => Promise<T>;
};

function createWorkspaceDecommissionRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    userRepository: createUserRepository(database),
    workspaceDecommissionRequestRepository:
      createWorkspaceDecommissionRequestRepository(database),
    workspaceRepository: createWorkspaceRepository(database)
  };
}

function serializeWorkspaceDecommission(input: {
  canceledAt: Date | null;
  canceledByUser: {
    walletAddress: string;
  } | null;
  canceledByUserId: string | null;
  createdAt: Date;
  executeAfter: Date;
  executedAt: Date | null;
  executedByUser: {
    walletAddress: string;
  } | null;
  executedByUserId: string | null;
  exportConfirmedAt: Date;
  id: string;
  reason: string | null;
  requestedByUser: {
    walletAddress: string;
  };
  requestedByUserId: string;
  retentionDays: number;
  status: "canceled" | "executed" | "scheduled";
}): WorkspaceDecommissionSummary {
  return workspaceDecommissionResponseSchema.shape.decommission.parse({
    canceledAt: input.canceledAt?.toISOString() ?? null,
    canceledByUserId: input.canceledByUserId,
    canceledByWalletAddress: input.canceledByUser?.walletAddress ?? null,
    createdAt: input.createdAt.toISOString(),
    executeAfter: input.executeAfter.toISOString(),
    executedAt: input.executedAt?.toISOString() ?? null,
    executedByUserId: input.executedByUserId,
    executedByWalletAddress: input.executedByUser?.walletAddress ?? null,
    exportConfirmedAt: input.exportConfirmedAt.toISOString(),
    id: input.id,
    reason: input.reason,
    requestedByUserId: input.requestedByUserId,
    requestedByWalletAddress: input.requestedByUser.walletAddress,
    retentionDays: input.retentionDays,
    status: input.status
  });
}

async function requireOwnedWorkspace(input: {
  ownerUserId: string;
  repositories: Pick<
    WorkspaceDecommissionRepositorySet,
    "userRepository" | "workspaceRepository"
  >;
  workspaceId: string;
}) {
  const [owner, workspace] = await Promise.all([
    input.repositories.userRepository.findById(input.ownerUserId),
    input.repositories.workspaceRepository.findByIdForOwner({
      id: input.workspaceId,
      ownerUserId: input.ownerUserId
    })
  ]);

  if (!workspace) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_NOT_FOUND",
      "The requested workspace was not found.",
      404
    );
  }

  if (!owner) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_REQUIRED",
      "Workspace ownership could not be resolved.",
      409
    );
  }

  return {
    owner,
    workspace
  };
}

function assertWorkspaceSlugConfirmation(input: {
  confirmWorkspaceSlug: string;
  workspaceSlug: string;
}) {
  if (input.confirmWorkspaceSlug !== input.workspaceSlug) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_CONFIRMATION_MISMATCH",
      "Confirm the exact workspace slug before scheduling or executing decommission.",
      409
    );
  }
}

function assertWorkspaceArchived(input: {
  workspace: {
    status: "active" | "archived" | "suspended";
  };
}) {
  if (input.workspace.status !== "archived") {
    throw new StudioSettingsServiceError(
      "WORKSPACE_DECOMMISSION_REQUIRES_ARCHIVE",
      "Archive the workspace before scheduling or executing decommission.",
      409
    );
  }
}

function assertOffboardingReady(input: {
  offboarding: {
    blockerCodes: string[];
    cautionCodes: string[];
    readiness: "blocked" | "ready" | "review_required";
  };
}) {
  if (input.offboarding.readiness === "ready") {
    return;
  }

  const unresolvedCodes =
    input.offboarding.readiness === "blocked"
      ? input.offboarding.blockerCodes
      : input.offboarding.cautionCodes;

  throw new StudioSettingsServiceError(
    "WORKSPACE_DECOMMISSION_NOT_READY",
    `Resolve ${unresolvedCodes.join(", ")} before scheduling or executing decommission.`,
    409
  );
}

async function recordWorkspaceDecommissionAuditLog(input: {
  action:
    | "workspace_decommission_canceled"
    | "workspace_decommission_executed"
    | "workspace_decommission_scheduled";
  actor: {
    id: string;
    walletAddress: string;
  };
  executeAfter?: Date;
  exportConfirmedAt?: Date;
  reason?: string | null;
  repositories: Pick<WorkspaceDecommissionRepositorySet, "auditLogRepository">;
  requestId: string;
  retentionDays?: number;
  workspaceId: string;
}) {
  await input.repositories.auditLogRepository.create({
    action: input.action,
    actorId: input.actor.id,
    actorType: "user",
    entityId: input.workspaceId,
    entityType: "workspace",
    metadataJson: {
      actorWalletAddress: input.actor.walletAddress,
      requestId: input.requestId,
      ...(input.executeAfter
        ? {
            executeAfter: input.executeAfter.toISOString()
          }
        : {}),
      ...(input.exportConfirmedAt
        ? {
            exportConfirmedAt: input.exportConfirmedAt.toISOString()
          }
        : {}),
      ...(input.reason
        ? {
            reason: input.reason
          }
        : {}),
      ...(typeof input.retentionDays === "number"
        ? {
            retentionDays: input.retentionDays
          }
        : {})
    }
  });
}

export function createWorkspaceDecommissionService(
  dependencies: WorkspaceDecommissionServiceDependencies
) {
  return {
    async scheduleWorkspaceDecommission(input: {
      confirmWorkspaceSlug: string;
      exportConfirmed: true;
      ownerUserId: string;
      reason?: string | null | undefined;
      retentionDays: number;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      assertWorkspaceSlugConfirmation({
        confirmWorkspaceSlug: input.confirmWorkspaceSlug,
        workspaceSlug: workspace.slug
      });
      assertWorkspaceArchived({
        workspace
      });

      if (scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_ALREADY_SCHEDULED",
          "A decommission schedule already exists for this workspace.",
          409
        );
      }

      const offboardingExport =
        await dependencies.offboardingService.exportOwnedWorkspace({
          ownerUserId: input.ownerUserId,
          workspaceId: workspace.id
        });

      assertOffboardingReady({
        offboarding: offboardingExport.export.offboarding
      });

      const executeAfter = new Date(
        now.getTime() + input.retentionDays * 24 * 60 * 60 * 1000
      );

      await dependencies.repositories.workspaceDecommissionRequestRepository.create(
        {
          executeAfter,
          exportConfirmedAt: now,
          reason: input.reason ?? null,
          requestedByUserId: owner.id,
          retentionDays: input.retentionDays,
          workspaceId: workspace.id
        }
      );

      const createdRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      if (!createdRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_CREATE_FAILED",
          "The decommission schedule could not be loaded after creation.",
          500
        );
      }

      await recordWorkspaceDecommissionAuditLog({
        action: "workspace_decommission_scheduled",
        actor: owner,
        executeAfter,
        exportConfirmedAt: now,
        reason: input.reason ?? null,
        repositories: dependencies.repositories,
        requestId: createdRequest.id,
        retentionDays: input.retentionDays,
        workspaceId: workspace.id
      });

      return workspaceDecommissionResponseSchema.parse({
        decommission: serializeWorkspaceDecommission(createdRequest)
      });
    },

    async cancelWorkspaceDecommission(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      if (!scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
          "No pending decommission schedule exists for this workspace.",
          404
        );
      }

      await dependencies.repositories.workspaceDecommissionRequestRepository.cancelById(
        {
          canceledAt: now,
          canceledByUserId: owner.id,
          id: scheduledRequest.id
        }
      );

      await recordWorkspaceDecommissionAuditLog({
        action: "workspace_decommission_canceled",
        actor: owner,
        repositories: dependencies.repositories,
        requestId: scheduledRequest.id,
        workspaceId: workspace.id
      });

      return workspaceDecommissionResponseSchema.parse({
        decommission: serializeWorkspaceDecommission({
          ...scheduledRequest,
          canceledAt: now,
          canceledByUser: {
            walletAddress: owner.walletAddress
          },
          canceledByUserId: owner.id,
          status: "canceled"
        })
      });
    },

    async executeWorkspaceDecommission(input: {
      confirmWorkspaceSlug: string;
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const offboardingExport =
        await dependencies.offboardingService.exportOwnedWorkspace({
          ownerUserId: input.ownerUserId,
          workspaceId: input.workspaceId
        });
      const { owner, workspace } = await requireOwnedWorkspace({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        workspaceId: input.workspaceId
      });
      const scheduledRequest =
        await dependencies.repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
          {
            workspaceId: workspace.id
          }
        );

      assertWorkspaceSlugConfirmation({
        confirmWorkspaceSlug: input.confirmWorkspaceSlug,
        workspaceSlug: workspace.slug
      });
      assertWorkspaceArchived({
        workspace
      });

      if (!scheduledRequest) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
          "No pending decommission schedule exists for this workspace.",
          404
        );
      }

      if (scheduledRequest.executeAfter.getTime() > now.getTime()) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_DECOMMISSION_RETENTION_PENDING",
          `This workspace cannot be decommissioned before ${scheduledRequest.executeAfter.toISOString()}.`,
          409
        );
      }

      assertOffboardingReady({
        offboarding: offboardingExport.export.offboarding
      });

      await dependencies.runInTransaction(async (repositories) => {
        const currentWorkspace =
          await repositories.workspaceRepository.findByIdForOwner({
            id: workspace.id,
            ownerUserId: input.ownerUserId
          });
        const currentRequest =
          await repositories.workspaceDecommissionRequestRepository.findScheduledByWorkspaceId(
            {
              workspaceId: workspace.id
            }
          );

        if (!currentWorkspace || !currentRequest) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_DECOMMISSION_NOT_SCHEDULED",
            "The decommission schedule could not be resolved for execution.",
            404
          );
        }

        await recordWorkspaceDecommissionAuditLog({
          action: "workspace_decommission_executed",
          actor: owner,
          repositories,
          requestId: currentRequest.id,
          workspaceId: workspace.id
        });
        await repositories.workspaceDecommissionRequestRepository.markExecutedById(
          {
            executedAt: now,
            executedByUserId: owner.id,
            id: currentRequest.id
          }
        );
        const deletedWorkspace = await repositories.workspaceRepository.deleteByIdForOwner(
          {
            id: workspace.id,
            ownerUserId: input.ownerUserId
          }
        );

        if (deletedWorkspace.count !== 1) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_DECOMMISSION_DELETE_FAILED",
            "The workspace could not be decommissioned.",
            500
          );
        }
      });

      return workspaceDecommissionExecutionResponseSchema.parse({
        executedAt: now.toISOString(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          status: workspace.status
        }
      });
    }
  };
}

export function createRuntimeWorkspaceDecommissionService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const database = getDatabaseClient(rawEnvironment);

  return createWorkspaceDecommissionService({
    createTransactionalRepositories: createWorkspaceDecommissionRepositories,
    now: () => new Date(),
    offboardingService: createRuntimeWorkspaceOffboardingService(rawEnvironment),
    repositories: createWorkspaceDecommissionRepositories(database),
    runInTransaction: async (callback) =>
      database.$transaction(async (transaction) =>
        callback(createWorkspaceDecommissionRepositories(transaction))
      )
  });
}
