import { z } from "zod";

import { walletAddressSchema } from "./auth.js";

export const workspaceLifecycleDeliveryPolicySchema = z.object({
  deliverDecommissionNotifications: z.boolean(),
  deliverInvitationReminders: z.boolean(),
  webhookEnabled: z.boolean()
});

export const workspaceLifecycleNotificationEventKindSchema = z.enum([
  "invitation_reminder",
  "decommission_notice"
]);

export const workspaceLifecycleNotificationDeliveryChannelSchema = z.enum([
  "webhook"
]);

export const workspaceLifecycleNotificationDeliveryStateSchema = z.enum([
  "queued",
  "processing",
  "delivered",
  "failed",
  "skipped"
]);

export const workspaceLifecycleDecommissionNotificationKindSchema = z.enum([
  "scheduled",
  "upcoming",
  "ready"
]);

export const workspaceLifecycleNotificationDeliverySummarySchema = z.object({
  attemptCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  decommissionNotificationId: z.string().min(1).nullable(),
  decommissionNotificationKind:
    workspaceLifecycleDecommissionNotificationKindSchema.nullable(),
  deliveredAt: z.string().datetime().nullable(),
  deliveryChannel: workspaceLifecycleNotificationDeliveryChannelSchema,
  deliveryState: workspaceLifecycleNotificationDeliveryStateSchema,
  eventKind: workspaceLifecycleNotificationEventKindSchema,
  eventOccurredAt: z.string().datetime(),
  failedAt: z.string().datetime().nullable(),
  failureMessage: z.string().min(1).nullable(),
  id: z.string().min(1),
  invitationId: z.string().min(1).nullable(),
  invitationWalletAddress: walletAddressSchema.nullable(),
  lastAttemptedAt: z.string().datetime().nullable(),
  queuedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime()
});

export const workspaceLifecycleNotificationDeliveryOverviewSchema = z.object({
  deliveredCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  latestDelivery: workspaceLifecycleNotificationDeliverySummarySchema.nullable(),
  queuedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0)
});

export const workspaceLifecycleNotificationDeliveryRetryResponseSchema =
  z.object({
    delivery: workspaceLifecycleNotificationDeliverySummarySchema
  });

export type WorkspaceLifecycleDeliveryPolicy = z.infer<
  typeof workspaceLifecycleDeliveryPolicySchema
>;
export type WorkspaceLifecycleNotificationEventKind = z.infer<
  typeof workspaceLifecycleNotificationEventKindSchema
>;
export type WorkspaceLifecycleNotificationDeliveryChannel = z.infer<
  typeof workspaceLifecycleNotificationDeliveryChannelSchema
>;
export type WorkspaceLifecycleNotificationDeliveryState = z.infer<
  typeof workspaceLifecycleNotificationDeliveryStateSchema
>;
export type WorkspaceLifecycleDecommissionNotificationKind = z.infer<
  typeof workspaceLifecycleDecommissionNotificationKindSchema
>;
export type WorkspaceLifecycleNotificationDeliverySummary = z.infer<
  typeof workspaceLifecycleNotificationDeliverySummarySchema
>;
export type WorkspaceLifecycleNotificationDeliveryOverview = z.infer<
  typeof workspaceLifecycleNotificationDeliveryOverviewSchema
>;
export type WorkspaceLifecycleNotificationDeliveryRetryResponse = z.infer<
  typeof workspaceLifecycleNotificationDeliveryRetryResponseSchema
>;
