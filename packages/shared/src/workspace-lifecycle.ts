import { z } from "zod";

import type { StudioWorkspaceInvitationStatus } from "./studio-settings.js";
import { walletAddressSchema } from "./auth.js";

export const workspaceLifecycleDeliveryPolicySchema = z.object({
  deliverDecommissionNotifications: z.boolean(),
  deliverInvitationReminders: z.boolean(),
  webhookEnabled: z.boolean()
});

export const defaultWorkspaceLifecycleAutomationEnabled = true;
export const defaultWorkspaceLifecycleInvitationAutomationEnabled = true;
export const defaultWorkspaceLifecycleDecommissionAutomationEnabled = true;
export const defaultWorkspaceLifecycleSlaEnabled = true;
export const defaultWorkspaceLifecycleSlaWebhookFailureThreshold = 3;
export const defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes = 180;

export const workspaceLifecycleAutomationPolicySchema = z.object({
  automateDecommissionNotices: z.boolean(),
  automateInvitationReminders: z.boolean(),
  enabled: z.boolean()
});

export const workspaceLifecycleSlaPolicySchema = z.object({
  automationMaxAgeMinutes: z.number().int().min(5).max(1440),
  enabled: z.boolean(),
  webhookFailureThreshold: z.number().int().min(1).max(20)
});

export const workspaceLifecycleSlaStatusSchema = z.enum([
  "disabled",
  "healthy",
  "warning",
  "breached"
]);

export const workspaceLifecycleSlaReasonCodeSchema = z.enum([
  "automation_unreachable",
  "automation_warning",
  "automation_stale",
  "webhook_failure_threshold_exceeded",
  "webhook_failures_present"
]);

export const workspaceLifecycleSlaSummarySchema = z.object({
  automationMaxAgeMinutes: z.number().int().min(5).max(1440),
  failedWebhookCount: z.number().int().min(0),
  lastAutomationRunAt: z.string().datetime().nullable(),
  message: z.string().min(1),
  reasonCodes: z.array(workspaceLifecycleSlaReasonCodeSchema),
  status: workspaceLifecycleSlaStatusSchema,
  webhookFailureThreshold: z.number().int().min(1).max(20)
});

export const workspaceLifecycleNotificationEventKindSchema = z.enum([
  "invitation_reminder",
  "decommission_notice"
]);

export const workspaceLifecycleNotificationDeliveryChannelSchema = z.enum([
  "audit_log",
  "webhook"
]);

export const workspaceLifecycleNotificationProviderKeySchema = z.enum([
  "primary",
  "secondary"
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
  providerKey: workspaceLifecycleNotificationProviderKeySchema.nullable(),
  queuedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime()
});

export const workspaceLifecycleNotificationProviderSummarySchema = z.object({
  deliveredCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  key: workspaceLifecycleNotificationProviderKeySchema,
  label: z.string().min(1),
  latestDelivery:
    workspaceLifecycleNotificationDeliverySummarySchema.nullable(),
  queuedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0)
});

export const workspaceLifecycleNotificationDeliveryChannelOverviewSchema =
  z.object({
    deliveredCount: z.number().int().min(0),
    failedCount: z.number().int().min(0),
    latestDelivery:
      workspaceLifecycleNotificationDeliverySummarySchema.nullable(),
    queuedCount: z.number().int().min(0),
    skippedCount: z.number().int().min(0)
  });

export const workspaceLifecycleNotificationDeliveryOverviewSchema = z.object({
  auditLog: workspaceLifecycleNotificationDeliveryChannelOverviewSchema,
  deliveredCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  latestDelivery:
    workspaceLifecycleNotificationDeliverySummarySchema.nullable(),
  providers: z.array(workspaceLifecycleNotificationProviderSummarySchema),
  queuedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  webhook: workspaceLifecycleNotificationDeliveryChannelOverviewSchema
});

export const workspaceLifecycleNotificationTransportProviderSchema = z.object({
  enabled: z.boolean(),
  key: workspaceLifecycleNotificationProviderKeySchema,
  label: z.string().min(1)
});

export const workspaceLifecycleNotificationDeliveryRetryResponseSchema =
  z.object({
    delivery: workspaceLifecycleNotificationDeliverySummarySchema
  });

export const workspaceLifecycleAutomationRunStatusSchema = z.enum([
  "running",
  "succeeded",
  "failed"
]);

export const workspaceLifecycleAutomationRunTriggerSourceSchema = z.enum([
  "manual",
  "scheduled"
]);

export const workspaceLifecycleAutomationRunSummarySchema = z.object({
  auditLogDeliveryCount: z.number().int().min(0),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  decommissionNoticeCount: z.number().int().min(0),
  failedWorkspaceCount: z.number().int().min(0),
  failureMessage: z.string().min(1).nullable(),
  id: z.string().min(1),
  invitationReminderCount: z.number().int().min(0),
  startedAt: z.string().datetime(),
  status: workspaceLifecycleAutomationRunStatusSchema,
  triggerSource: workspaceLifecycleAutomationRunTriggerSourceSchema,
  updatedAt: z.string().datetime(),
  webhookQueuedCount: z.number().int().min(0),
  workspaceCount: z.number().int().min(0)
});

export const workspaceLifecycleAutomationHealthStatusSchema = z.enum([
  "disabled",
  "healthy",
  "stale",
  "warning",
  "unreachable"
]);

export const workspaceLifecycleAutomationHealthSchema = z.object({
  enabled: z.boolean(),
  intervalSeconds: z.number().int().positive().nullable(),
  jitterSeconds: z.number().int().min(0).nullable(),
  lastRunAgeSeconds: z.number().int().min(0).nullable(),
  lastRunAt: z.string().datetime().nullable(),
  latestRun: workspaceLifecycleAutomationRunSummarySchema.nullable(),
  lockTtlSeconds: z.number().int().positive().nullable(),
  message: z.string().min(1),
  runOnStart: z.boolean().nullable(),
  status: workspaceLifecycleAutomationHealthStatusSchema
});

export const workspaceInvitationExpiringWindowMilliseconds =
  72 * 60 * 60 * 1000;
export const workspaceInvitationReminderCooldownMilliseconds =
  24 * 60 * 60 * 1000;
export const workspaceDecommissionUpcomingNotificationWindowMilliseconds =
  72 * 60 * 60 * 1000;
export const workspaceLifecycleNotificationProviderLabels: Record<
  WorkspaceLifecycleNotificationProviderKey,
  string
> = {
  primary: "Primary webhook",
  secondary: "Secondary webhook"
};

export function getWorkspaceInvitationStatus(input: {
  expiresAt: Date;
  now: Date;
}): StudioWorkspaceInvitationStatus {
  const expiresAtTime = input.expiresAt.getTime();
  const nowTime = input.now.getTime();

  if (expiresAtTime <= nowTime) {
    return "expired";
  }

  if (
    expiresAtTime - nowTime <=
    workspaceInvitationExpiringWindowMilliseconds
  ) {
    return "expiring";
  }

  return "active";
}

export function getWorkspaceInvitationReminderReadyAt(input: {
  lastRemindedAt: Date | null;
}) {
  if (!input.lastRemindedAt) {
    return null;
  }

  return new Date(
    input.lastRemindedAt.getTime() +
      workspaceInvitationReminderCooldownMilliseconds
  );
}

export function canSendWorkspaceInvitationReminder(input: {
  expiresAt: Date;
  lastRemindedAt: Date | null;
  now: Date;
}) {
  if (getWorkspaceInvitationStatus(input) === "expired") {
    return false;
  }

  const reminderReadyAt = getWorkspaceInvitationReminderReadyAt({
    lastRemindedAt: input.lastRemindedAt
  });

  if (!reminderReadyAt) {
    return true;
  }

  return reminderReadyAt.getTime() <= input.now.getTime();
}

export function getNextWorkspaceDecommissionNotificationKind(input: {
  executeAfter: Date;
  existingNotificationKinds: WorkspaceLifecycleDecommissionNotificationKind[];
  now: Date;
}): WorkspaceLifecycleDecommissionNotificationKind | null {
  const kinds = new Set(input.existingNotificationKinds);
  const nowTime = input.now.getTime();
  const executeAfterTime = input.executeAfter.getTime();

  if (nowTime >= executeAfterTime && !kinds.has("ready")) {
    return "ready";
  }

  if (
    nowTime >=
      executeAfterTime -
        workspaceDecommissionUpcomingNotificationWindowMilliseconds &&
    !kinds.has("upcoming")
  ) {
    return "upcoming";
  }

  if (!kinds.has("scheduled")) {
    return "scheduled";
  }

  return null;
}

export function resolveWorkspaceLifecycleDeliveryDecision(input: {
  availableProviderKeys: WorkspaceLifecycleNotificationProviderKey[];
  eventKind: WorkspaceLifecycleNotificationEventKind;
  workspacePolicy: WorkspaceLifecycleDeliveryPolicy;
}) {
  if (!input.workspacePolicy.webhookEnabled) {
    return {
      providerKeys: [] as WorkspaceLifecycleNotificationProviderKey[],
      failureMessage:
        "Lifecycle webhook delivery is disabled for this workspace.",
      shouldQueue: false
    };
  }

  if (
    input.eventKind === "invitation_reminder" &&
    !input.workspacePolicy.deliverInvitationReminders
  ) {
    return {
      providerKeys: [] as WorkspaceLifecycleNotificationProviderKey[],
      failureMessage:
        "Invitation reminder webhook delivery is disabled for this workspace.",
      shouldQueue: false
    };
  }

  if (
    input.eventKind === "decommission_notice" &&
    !input.workspacePolicy.deliverDecommissionNotifications
  ) {
    return {
      providerKeys: [] as WorkspaceLifecycleNotificationProviderKey[],
      failureMessage:
        "Decommission notice webhook delivery is disabled for this workspace.",
      shouldQueue: false
    };
  }

  const providerKeys = [...new Set(input.availableProviderKeys)];

  if (providerKeys.length === 0) {
    return {
      providerKeys,
      failureMessage: "Worker lifecycle webhook transport is not configured.",
      shouldQueue: false
    };
  }

  return {
    failureMessage: null,
    providerKeys,
    shouldQueue: true
  };
}

export type WorkspaceLifecycleDeliveryPolicy = z.infer<
  typeof workspaceLifecycleDeliveryPolicySchema
>;
export type WorkspaceLifecycleAutomationPolicy = z.infer<
  typeof workspaceLifecycleAutomationPolicySchema
>;
export type WorkspaceLifecycleSlaPolicy = z.infer<
  typeof workspaceLifecycleSlaPolicySchema
>;
export type WorkspaceLifecycleNotificationEventKind = z.infer<
  typeof workspaceLifecycleNotificationEventKindSchema
>;
export type WorkspaceLifecycleNotificationDeliveryChannel = z.infer<
  typeof workspaceLifecycleNotificationDeliveryChannelSchema
>;
export type WorkspaceLifecycleNotificationProviderKey = z.infer<
  typeof workspaceLifecycleNotificationProviderKeySchema
>;
export type WorkspaceLifecycleNotificationDeliveryState = z.infer<
  typeof workspaceLifecycleNotificationDeliveryStateSchema
>;
export type WorkspaceLifecycleNotificationProviderSummary = z.infer<
  typeof workspaceLifecycleNotificationProviderSummarySchema
>;
export type WorkspaceLifecycleNotificationDeliveryChannelOverview = z.infer<
  typeof workspaceLifecycleNotificationDeliveryChannelOverviewSchema
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
export type WorkspaceLifecycleNotificationTransportProvider = z.infer<
  typeof workspaceLifecycleNotificationTransportProviderSchema
>;
export type WorkspaceLifecycleNotificationDeliveryRetryResponse = z.infer<
  typeof workspaceLifecycleNotificationDeliveryRetryResponseSchema
>;
export type WorkspaceLifecycleAutomationRunStatus = z.infer<
  typeof workspaceLifecycleAutomationRunStatusSchema
>;
export type WorkspaceLifecycleAutomationRunTriggerSource = z.infer<
  typeof workspaceLifecycleAutomationRunTriggerSourceSchema
>;
export type WorkspaceLifecycleAutomationRunSummary = z.infer<
  typeof workspaceLifecycleAutomationRunSummarySchema
>;
export type WorkspaceLifecycleAutomationHealthStatus = z.infer<
  typeof workspaceLifecycleAutomationHealthStatusSchema
>;
export type WorkspaceLifecycleAutomationHealth = z.infer<
  typeof workspaceLifecycleAutomationHealthSchema
>;
export type WorkspaceLifecycleSlaStatus = z.infer<
  typeof workspaceLifecycleSlaStatusSchema
>;
export type WorkspaceLifecycleSlaReasonCode = z.infer<
  typeof workspaceLifecycleSlaReasonCodeSchema
>;
export type WorkspaceLifecycleSlaSummary = z.infer<
  typeof workspaceLifecycleSlaSummarySchema
>;
