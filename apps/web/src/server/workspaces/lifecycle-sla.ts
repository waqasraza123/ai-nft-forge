import {
  defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes,
  defaultWorkspaceLifecycleSlaEnabled,
  defaultWorkspaceLifecycleSlaWebhookFailureThreshold,
  workspaceLifecycleSlaPolicySchema,
  workspaceLifecycleSlaSummarySchema,
  type WorkspaceLifecycleAutomationHealth,
  type WorkspaceLifecycleAutomationPolicy,
  type WorkspaceLifecycleDeliveryPolicy,
  type WorkspaceLifecycleNotificationDeliveryOverview,
  type WorkspaceLifecycleSlaPolicy,
  type WorkspaceLifecycleSlaReasonCode,
  type WorkspaceLifecycleSlaSummary
} from "@ai-nft-forge/shared";

export type WorkspaceLifecycleSlaPolicyWorkspaceRecord = {
  lifecycleSlaAutomationMaxAgeMinutes: number;
  lifecycleSlaEnabled: boolean;
  lifecycleSlaWebhookFailureThreshold: number;
};

function formatReasonMessage(reasonCode: WorkspaceLifecycleSlaReasonCode) {
  switch (reasonCode) {
    case "automation_unreachable":
      return "automation health is unavailable for an enabled workspace automation policy";
    case "automation_warning":
      return "automation health reports a warning condition";
    case "automation_stale":
      return "automation runs are older than the configured SLA window";
    case "webhook_failure_threshold_exceeded":
      return "webhook delivery failures exceeded the configured threshold";
    case "webhook_failures_present":
      return "webhook delivery failures are present";
  }
}

export function serializeWorkspaceLifecycleSlaPolicy(
  input: Partial<WorkspaceLifecycleSlaPolicyWorkspaceRecord>
): WorkspaceLifecycleSlaPolicy {
  return workspaceLifecycleSlaPolicySchema.parse({
    automationMaxAgeMinutes:
      input.lifecycleSlaAutomationMaxAgeMinutes ??
      defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes,
    enabled:
      input.lifecycleSlaEnabled ?? defaultWorkspaceLifecycleSlaEnabled,
    webhookFailureThreshold:
      input.lifecycleSlaWebhookFailureThreshold ??
      defaultWorkspaceLifecycleSlaWebhookFailureThreshold
  });
}

export function createWorkspaceLifecycleSlaSummary(input: {
  lifecycleAutomationHealth: WorkspaceLifecycleAutomationHealth | null;
  lifecycleAutomationPolicy: WorkspaceLifecycleAutomationPolicy;
  lifecycleDeliveryOverview: WorkspaceLifecycleNotificationDeliveryOverview;
  lifecycleDeliveryPolicy: WorkspaceLifecycleDeliveryPolicy;
  policy: WorkspaceLifecycleSlaPolicy;
}): WorkspaceLifecycleSlaSummary {
  const failedWebhookCount = input.lifecycleDeliveryPolicy.webhookEnabled
    ? input.lifecycleDeliveryOverview.webhook.failedCount
    : 0;
  const lastAutomationRunAt = input.lifecycleAutomationPolicy.enabled
    ? input.lifecycleAutomationHealth?.lastRunAt ?? null
    : null;
  const reasonCodes: WorkspaceLifecycleSlaReasonCode[] = [];

  if (!input.policy.enabled) {
    return workspaceLifecycleSlaSummarySchema.parse({
      automationMaxAgeMinutes: input.policy.automationMaxAgeMinutes,
      failedWebhookCount,
      lastAutomationRunAt,
      message: "Lifecycle SLA monitoring is disabled for this workspace.",
      reasonCodes,
      status: "disabled",
      webhookFailureThreshold: input.policy.webhookFailureThreshold
    });
  }

  if (input.lifecycleAutomationPolicy.enabled) {
    const automationHealth = input.lifecycleAutomationHealth;
    const lastRunAgeSeconds = automationHealth?.lastRunAgeSeconds ?? null;
    const maxAgeSeconds = input.policy.automationMaxAgeMinutes * 60;

    if (
      !automationHealth ||
      automationHealth.status === "unreachable" ||
      automationHealth.status === "disabled"
    ) {
      reasonCodes.push("automation_unreachable");
    } else if (
      lastRunAgeSeconds === null ||
      lastRunAgeSeconds > maxAgeSeconds ||
      automationHealth.status === "stale"
    ) {
      reasonCodes.push("automation_stale");
    } else if (automationHealth.status === "warning") {
      reasonCodes.push("automation_warning");
    }
  }

  if (input.lifecycleDeliveryPolicy.webhookEnabled) {
    if (failedWebhookCount >= input.policy.webhookFailureThreshold) {
      reasonCodes.push("webhook_failure_threshold_exceeded");
    } else if (failedWebhookCount > 0) {
      reasonCodes.push("webhook_failures_present");
    }
  }

  const breached = reasonCodes.some((reasonCode) =>
    ["automation_unreachable", "automation_stale", "webhook_failure_threshold_exceeded"].includes(
      reasonCode
    )
  );
  const warning = !breached && reasonCodes.length > 0;

  return workspaceLifecycleSlaSummarySchema.parse({
    automationMaxAgeMinutes: input.policy.automationMaxAgeMinutes,
    failedWebhookCount,
    lastAutomationRunAt,
    message:
      reasonCodes.length === 0
        ? "Lifecycle automation and webhook delivery are within the workspace SLA policy."
        : `Lifecycle SLA ${breached ? "is breached" : "needs attention"}: ${reasonCodes
            .map((reasonCode) => formatReasonMessage(reasonCode))
            .join("; ")}.`,
    reasonCodes,
    status: breached ? "breached" : warning ? "warning" : "healthy",
    webhookFailureThreshold: input.policy.webhookFailureThreshold
  });
}
