import { describe, expect, it, vi } from "vitest";

import { createWorkspaceLifecycleNotificationProcessor } from "./workspace-lifecycle-notification-processor.js";

describe("createWorkspaceLifecycleNotificationProcessor", () => {
  it("marks queued deliveries delivered after webhook success", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const processor = createWorkspaceLifecycleNotificationProcessor({
      now: () => new Date("2026-04-12T06:00:00.000Z"),
      repositories: {
        workspaceLifecycleNotificationDeliveryRepository: {
          async findById(id: string) {
            return {
              attemptCount: 0,
              deliveryChannel: "webhook" as const,
              deliveredAt: null,
              deliveryState: "queued" as const,
              id,
              payloadJson: {
                event: "workspace.lifecycle_notification",
                kind: "invitation_reminder"
              },
              providerKey: "primary" as const
            };
          },
          async updateById(input) {
            updates.push(input);
            return input;
          }
        }
      },
      transportRegistry: {
        resolveProvider: vi.fn().mockReturnValue({
          deliver: vi.fn().mockResolvedValue(undefined),
          label: "Primary webhook"
        })
      }
    });

    const result = await processor({
      data: {
        deliveryId: "delivery_1",
        requestedAt: "2026-04-12T05:59:00.000Z",
        source: "automatic"
      },
      id: "job_1",
      name: "process-workspace-lifecycle-notification",
      queueName: "workspace-lifecycle-notification-dispatch"
    });

    expect(result).toEqual({
      deliveryId: "delivery_1",
      queueName: "workspace-lifecycle-notification-dispatch",
      status: "delivered"
    });
    expect(updates).toEqual([
      expect.objectContaining({
        attemptCount: 1,
        deliveryState: "processing",
        id: "delivery_1"
      }),
      expect.objectContaining({
        deliveryState: "delivered",
        id: "delivery_1"
      })
    ]);
  });

  it("records failures when webhook delivery throws", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const processor = createWorkspaceLifecycleNotificationProcessor({
      now: () => new Date("2026-04-12T06:00:00.000Z"),
      repositories: {
        workspaceLifecycleNotificationDeliveryRepository: {
          async findById(id: string) {
            return {
              attemptCount: 2,
              deliveryChannel: "webhook" as const,
              deliveredAt: null,
              deliveryState: "queued" as const,
              id,
              payloadJson: {
                event: "workspace.lifecycle_notification",
                kind: "decommission_notice"
              },
              providerKey: "primary" as const
            };
          },
          async updateById(input) {
            updates.push(input);
            return input;
          }
        }
      },
      transportRegistry: {
        resolveProvider: vi.fn().mockReturnValue({
          deliver: vi.fn().mockRejectedValue(new Error("Webhook rejected")),
          label: "Primary webhook"
        })
      }
    });

    await expect(
      processor({
        data: {
          deliveryId: "delivery_1",
          requestedAt: "2026-04-12T05:59:00.000Z",
          source: "manual_retry"
        },
        id: "job_1",
        name: "process-workspace-lifecycle-notification",
        queueName: "workspace-lifecycle-notification-dispatch"
      })
    ).rejects.toThrow("Webhook rejected");

    expect(updates).toEqual([
      expect.objectContaining({
        attemptCount: 3,
        deliveryState: "processing",
        id: "delivery_1"
      }),
      expect.objectContaining({
        deliveryState: "failed",
        failureMessage: "Webhook rejected",
        id: "delivery_1"
      })
    ]);
  });

  it("marks queued audit-log deliveries delivered without calling the webhook", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const transportRegistry = {
      resolveProvider: vi.fn()
    };
    const processor = createWorkspaceLifecycleNotificationProcessor({
      now: () => new Date("2026-04-12T06:00:00.000Z"),
      repositories: {
        workspaceLifecycleNotificationDeliveryRepository: {
          async findById(id: string) {
            return {
              attemptCount: 0,
              deliveryChannel: "audit_log" as const,
              deliveredAt: null,
              deliveryState: "queued" as const,
              id,
              payloadJson: {
                event: "workspace.lifecycle_notification",
                kind: "invitation_reminder"
              }
            };
          },
          async updateById(input) {
            updates.push(input);
            return input;
          }
        }
      },
      transportRegistry
    });

    const result = await processor({
      data: {
        deliveryId: "delivery_1",
        requestedAt: "2026-04-12T05:59:00.000Z",
        source: "automatic"
      },
      id: "job_1",
      name: "process-workspace-lifecycle-notification",
      queueName: "workspace-lifecycle-notification-dispatch"
    });

    expect(result).toEqual({
      deliveryId: "delivery_1",
      queueName: "workspace-lifecycle-notification-dispatch",
      status: "delivered"
    });
    expect(transportRegistry.resolveProvider).not.toHaveBeenCalled();
    expect(updates).toEqual([
      expect.objectContaining({
        deliveryState: "delivered",
        id: "delivery_1"
      })
    ]);
  });
});
