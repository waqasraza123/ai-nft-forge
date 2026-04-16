import type { Workspace, WorkspaceStatus } from "@prisma/client";

import type { DatabaseExecutor } from "../client.js";

type WorkspaceRepositoryDatabase = Pick<DatabaseExecutor, "workspace">;

type CreateWorkspaceInput = {
  decommissionRetentionDaysDefault?: number;
  decommissionRetentionDaysMinimum?: number;
  lifecycleAutomationDecommissionNoticesEnabled?: boolean;
  lifecycleAutomationEnabled?: boolean;
  lifecycleAutomationInvitationRemindersEnabled?: boolean;
  lifecycleSlaAutomationMaxAgeMinutes?: number;
  lifecycleSlaEnabled?: boolean;
  lifecycleSlaWebhookFailureThreshold?: number;
  lifecycleWebhookDeliverDecommissionNotifications?: boolean;
  lifecycleWebhookDeliverInvitationReminders?: boolean;
  lifecycleWebhookEnabled?: boolean;
  name: string;
  ownerUserId: string;
  requireDecommissionReason?: boolean;
  slug: string;
  status?: WorkspaceStatus;
};

export function createWorkspaceRepository(
  database: WorkspaceRepositoryDatabase
) {
  return {
    create(input: CreateWorkspaceInput): Promise<Workspace> {
      return database.workspace.create({
        data: input
      });
    },

    findBySlug(slug: string): Promise<Workspace | null> {
      return database.workspace.findUnique({
        where: {
          slug
        }
      });
    },

    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<Workspace | null> {
      return database.workspace.findFirst({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    },

    findFirstByOwnerUserId(ownerUserId: string): Promise<Workspace | null> {
      return database.workspace.findFirst({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    listByOwnerUserId(ownerUserId: string): Promise<Workspace[]> {
      return database.workspace.findMany({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        where: {
          ownerUserId
        }
      });
    },

    listAll() {
      return database.workspace.findMany({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ]
      });
    },

    listLifecycleAutomationEligible() {
      return database.workspace.findMany({
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            id: "asc"
          }
        ],
        select: {
          id: true,
          lifecycleAutomationDecommissionNoticesEnabled: true,
          lifecycleAutomationEnabled: true,
          lifecycleAutomationInvitationRemindersEnabled: true,
          lifecycleWebhookDeliverDecommissionNotifications: true,
          lifecycleWebhookDeliverInvitationReminders: true,
          lifecycleWebhookEnabled: true,
          name: true,
          owner: {
            select: {
              id: true,
              walletAddress: true
            }
          },
          ownerUserId: true,
          slug: true,
          status: true
        },
        where: {
          lifecycleAutomationEnabled: true,
          OR: [
            {
              lifecycleAutomationInvitationRemindersEnabled: true
            },
            {
              lifecycleAutomationDecommissionNoticesEnabled: true
            }
          ]
        }
      });
    },

    listByIds(ids: string[]): Promise<Workspace[]> {
      return database.workspace.findMany({
        where: {
          id: {
            in: ids
          }
        }
      });
    },

    updateByIdForOwner(input: {
      decommissionRetentionDaysDefault: number;
      decommissionRetentionDaysMinimum: number;
      id: string;
      lifecycleAutomationDecommissionNoticesEnabled: boolean;
      lifecycleAutomationEnabled: boolean;
      lifecycleAutomationInvitationRemindersEnabled: boolean;
      lifecycleSlaAutomationMaxAgeMinutes: number;
      lifecycleSlaEnabled: boolean;
      lifecycleSlaWebhookFailureThreshold: number;
      lifecycleWebhookDeliverDecommissionNotifications: boolean;
      lifecycleWebhookDeliverInvitationReminders: boolean;
      lifecycleWebhookEnabled: boolean;
      name: string;
      ownerUserId: string;
      requireDecommissionReason: boolean;
      slug: string;
      status: WorkspaceStatus;
    }): Promise<Workspace> {
      return database.workspace
        .updateMany({
          data: {
            decommissionRetentionDaysDefault:
              input.decommissionRetentionDaysDefault,
            decommissionRetentionDaysMinimum:
              input.decommissionRetentionDaysMinimum,
            lifecycleAutomationDecommissionNoticesEnabled:
              input.lifecycleAutomationDecommissionNoticesEnabled,
            lifecycleAutomationEnabled: input.lifecycleAutomationEnabled,
            lifecycleAutomationInvitationRemindersEnabled:
              input.lifecycleAutomationInvitationRemindersEnabled,
            lifecycleSlaAutomationMaxAgeMinutes:
              input.lifecycleSlaAutomationMaxAgeMinutes,
            lifecycleSlaEnabled: input.lifecycleSlaEnabled,
            lifecycleSlaWebhookFailureThreshold:
              input.lifecycleSlaWebhookFailureThreshold,
            lifecycleWebhookDeliverDecommissionNotifications:
              input.lifecycleWebhookDeliverDecommissionNotifications,
            lifecycleWebhookDeliverInvitationReminders:
              input.lifecycleWebhookDeliverInvitationReminders,
            lifecycleWebhookEnabled: input.lifecycleWebhookEnabled,
            name: input.name,
            requireDecommissionReason: input.requireDecommissionReason,
            slug: input.slug,
            status: input.status
          },
          where: {
            id: input.id,
            ownerUserId: input.ownerUserId
          }
        })
        .then(() =>
          database.workspace.findUniqueOrThrow({
            where: {
              id: input.id
            }
          })
        );
    },

    transferOwnershipById(input: {
      currentOwnerUserId: string;
      id: string;
      nextOwnerUserId: string;
    }): Promise<Workspace> {
      return database.workspace
        .updateMany({
          data: {
            ownerUserId: input.nextOwnerUserId
          },
          where: {
            id: input.id,
            ownerUserId: input.currentOwnerUserId
          }
        })
        .then(() =>
          database.workspace.findUniqueOrThrow({
            where: {
              id: input.id
            }
          })
        );
    },

    deleteByIdForOwner(input: { id: string; ownerUserId: string }) {
      return database.workspace.deleteMany({
        where: {
          id: input.id,
          ownerUserId: input.ownerUserId
        }
      });
    }
  };
}

export type WorkspaceRepository = ReturnType<typeof createWorkspaceRepository>;
