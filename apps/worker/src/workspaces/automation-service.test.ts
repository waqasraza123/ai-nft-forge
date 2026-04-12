import { describe, expect, it, vi } from "vitest";

import { createWorkspaceLifecycleAutomationService } from "./automation-service.js";

function createLogger() {
  return {
    error: vi.fn(),
    info: vi.fn()
  };
}

describe("createWorkspaceLifecycleAutomationService", () => {
  it("records and enqueues due invitation reminders and decommission notices", async () => {
    const now = new Date("2026-04-12T00:00:00.000Z");
    const logger = createLogger();
    const queue = {
      enqueue: vi
        .fn()
        .mockResolvedValueOnce({ jobId: "job_invitation" })
        .mockResolvedValueOnce({ jobId: "job_decommission" })
    };
    const auditLogRepository = {
      create: vi.fn().mockResolvedValue({ id: "audit_1" })
    };
    const lifecycleDeliveryRepository = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          deliveryChannel: "audit_log" as const,
          id: "delivery_audit_invitation"
        })
        .mockResolvedValueOnce({
          deliveryChannel: "webhook" as const,
          id: "delivery_webhook_invitation"
        })
        .mockResolvedValueOnce({
          deliveryChannel: "audit_log" as const,
          id: "delivery_audit_decommission"
        })
        .mockResolvedValueOnce({
          deliveryChannel: "webhook" as const,
          id: "delivery_webhook_decommission"
        }),
      updateById: vi.fn()
    };
    const txInvitationRepository = {
      touchReminderById: vi.fn().mockResolvedValue({
        id: "invitation_1",
        lastRemindedAt: now,
        reminderCount: 1
      })
    };
    const txDecommissionNotificationRepository = {
      create: vi.fn().mockResolvedValue({
        id: "notification_1",
        kind: "scheduled",
        requestId: "request_1",
        sentAt: now
      })
    };
    const service = createWorkspaceLifecycleAutomationService({
      logger,
      now: () => now,
      queue,
      repositories: {
        auditLogRepository,
        workspaceDecommissionNotificationRepository: {
          listByRequestIds: vi.fn().mockResolvedValue([])
        },
        workspaceDecommissionRequestRepository: {
          listScheduledByWorkspaceIds: vi.fn().mockResolvedValue([
            {
              executeAfter: new Date("2026-04-15T00:00:00.000Z"),
              id: "request_1",
              reason: "Retention elapsed",
              retentionDays: 3,
              workspaceId: "workspace_1"
            }
          ])
        },
        workspaceInvitationRepository: {
          listReminderReadyByWorkspaceIds: vi.fn().mockResolvedValue([
            {
              expiresAt: new Date("2026-04-20T00:00:00.000Z"),
              id: "invitation_1",
              lastRemindedAt: null,
              reminderCount: 0,
              role: "operator",
              walletAddress: "0x1111111111111111111111111111111111111111",
              workspaceId: "workspace_1"
            }
          ])
        },
        workspaceLifecycleNotificationDeliveryRepository:
          lifecycleDeliveryRepository,
        workspaceRepository: {
          listLifecycleAutomationEligible: vi.fn().mockResolvedValue([
            {
              id: "workspace_1",
              lifecycleWebhookDeliverDecommissionNotifications: true,
              lifecycleWebhookDeliverInvitationReminders: true,
              lifecycleWebhookEnabled: true,
              name: "Forge Ops",
              owner: {
                id: "user_1",
                walletAddress: "0x9999999999999999999999999999999999999999"
              },
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "archived"
            }
          ])
        }
      },
      runInTransaction: async (callback) =>
        callback({
          auditLogRepository,
          workspaceDecommissionNotificationRepository:
            txDecommissionNotificationRepository,
          workspaceInvitationRepository: txInvitationRepository
        }),
      transport: {
        enabled: true
      }
    });

    const summary = await service.run();

    expect(summary).toEqual({
      auditLogDeliveryCount: 2,
      decommissionNoticeCount: 1,
      failedWorkspaceCount: 0,
      invitationReminderCount: 1,
      webhookQueuedCount: 2,
      workspaceCount: 1
    });
    expect(txInvitationRepository.touchReminderById).toHaveBeenCalledWith({
      id: "invitation_1",
      lastRemindedAt: now
    });
    expect(txDecommissionNotificationRepository.create).toHaveBeenCalledWith({
      kind: "upcoming",
      requestId: "request_1",
      sentAt: now,
      sentByUserId: "user_1"
    });
    expect(auditLogRepository.create).toHaveBeenNthCalledWith(1, {
      action: "workspace_invitation_reminder_sent",
      actorId: "user_1",
      actorType: "user",
      entityId: "workspace_1",
      entityType: "workspace",
      metadataJson: expect.objectContaining({
        actorWalletAddress: "0x9999999999999999999999999999999999999999",
        automated: true,
        automationKey: "workspace_lifecycle_automation",
        role: "operator",
        targetWalletAddress: "0x1111111111111111111111111111111111111111",
        workspaceId: "workspace_1"
      })
    });
    expect(auditLogRepository.create).toHaveBeenNthCalledWith(2, {
      action: "workspace_decommission_notification_recorded",
      actorId: "user_1",
      actorType: "user",
      entityId: "workspace_1",
      entityType: "workspace",
      metadataJson: expect.objectContaining({
        actorWalletAddress: "0x9999999999999999999999999999999999999999",
        automated: true,
        automationKey: "workspace_lifecycle_automation",
        notificationKind: "upcoming",
        requestId: "request_1",
        workspaceId: "workspace_1"
      })
    });
    expect(lifecycleDeliveryRepository.create).toHaveBeenNthCalledWith(1, {
      deliveredAt: now,
      deliveryChannel: "audit_log",
      deliveryState: "delivered",
      eventKind: "invitation_reminder",
      eventOccurredAt: now,
      invitationId: "invitation_1",
      ownerUserId: "user_1",
      payloadJson: expect.objectContaining({
        event: "workspace.lifecycle_notification",
        kind: "invitation_reminder"
      }),
      workspaceId: "workspace_1"
    });
    expect(lifecycleDeliveryRepository.create).toHaveBeenNthCalledWith(2, {
      deliveryChannel: "webhook",
      deliveryState: "queued",
      eventKind: "invitation_reminder",
      eventOccurredAt: now,
      invitationId: "invitation_1",
      ownerUserId: "user_1",
      payloadJson: expect.objectContaining({
        event: "workspace.lifecycle_notification",
        kind: "invitation_reminder"
      }),
      queuedAt: now,
      workspaceId: "workspace_1"
    });
    expect(lifecycleDeliveryRepository.create).toHaveBeenNthCalledWith(3, {
      decommissionNotificationId: "notification_1",
      deliveredAt: now,
      deliveryChannel: "audit_log",
      deliveryState: "delivered",
      eventKind: "decommission_notice",
      eventOccurredAt: now,
      ownerUserId: "user_1",
      payloadJson: expect.objectContaining({
        event: "workspace.lifecycle_notification",
        kind: "decommission_notice"
      }),
      workspaceId: "workspace_1"
    });
    expect(lifecycleDeliveryRepository.create).toHaveBeenNthCalledWith(4, {
      decommissionNotificationId: "notification_1",
      deliveryChannel: "webhook",
      deliveryState: "queued",
      eventKind: "decommission_notice",
      eventOccurredAt: now,
      ownerUserId: "user_1",
      payloadJson: expect.objectContaining({
        event: "workspace.lifecycle_notification",
        kind: "decommission_notice"
      }),
      queuedAt: now,
      workspaceId: "workspace_1"
    });
    expect(queue.enqueue).toHaveBeenNthCalledWith(1, {
      deliveryId: "delivery_webhook_invitation",
      source: "automatic"
    });
    expect(queue.enqueue).toHaveBeenNthCalledWith(2, {
      deliveryId: "delivery_webhook_decommission",
      source: "automatic"
    });
  });

  it("does not record automation events when transport is disabled", async () => {
    const now = new Date("2026-04-12T00:00:00.000Z");
    const logger = createLogger();
    const auditLogRepository = {
      create: vi.fn()
    };
    const txInvitationRepository = {
      touchReminderById: vi.fn()
    };
    const txDecommissionNotificationRepository = {
      create: vi.fn()
    };
    const service = createWorkspaceLifecycleAutomationService({
      logger,
      now: () => now,
      queue: {
        enqueue: vi.fn()
      },
      repositories: {
        auditLogRepository,
        workspaceDecommissionNotificationRepository: {
          listByRequestIds: vi.fn().mockResolvedValue([])
        },
        workspaceDecommissionRequestRepository: {
          listScheduledByWorkspaceIds: vi.fn().mockResolvedValue([
            {
              executeAfter: new Date("2026-04-15T00:00:00.000Z"),
              id: "request_1",
              reason: "Retention elapsed",
              retentionDays: 3,
              workspaceId: "workspace_1"
            }
          ])
        },
        workspaceInvitationRepository: {
          listReminderReadyByWorkspaceIds: vi.fn().mockResolvedValue([
            {
              expiresAt: new Date("2026-04-20T00:00:00.000Z"),
              id: "invitation_1",
              lastRemindedAt: null,
              reminderCount: 0,
              role: "operator",
              walletAddress: "0x1111111111111111111111111111111111111111",
              workspaceId: "workspace_1"
            }
          ])
        },
        workspaceLifecycleNotificationDeliveryRepository: {
          create: vi.fn(),
          updateById: vi.fn()
        },
        workspaceRepository: {
          listLifecycleAutomationEligible: vi.fn().mockResolvedValue([
            {
              id: "workspace_1",
              lifecycleWebhookDeliverDecommissionNotifications: true,
              lifecycleWebhookDeliverInvitationReminders: true,
              lifecycleWebhookEnabled: true,
              name: "Forge Ops",
              owner: {
                id: "user_1",
                walletAddress: "0x9999999999999999999999999999999999999999"
              },
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "archived"
            }
          ])
        }
      },
      runInTransaction: async (callback) =>
        callback({
          auditLogRepository,
          workspaceDecommissionNotificationRepository:
            txDecommissionNotificationRepository,
          workspaceInvitationRepository: txInvitationRepository
        }),
      transport: {
        enabled: false
      }
    });

    const summary = await service.run();

    expect(summary).toEqual({
      auditLogDeliveryCount: 0,
      decommissionNoticeCount: 0,
      failedWorkspaceCount: 0,
      invitationReminderCount: 0,
      webhookQueuedCount: 0,
      workspaceCount: 1
    });
    expect(txInvitationRepository.touchReminderById).not.toHaveBeenCalled();
    expect(txDecommissionNotificationRepository.create).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
