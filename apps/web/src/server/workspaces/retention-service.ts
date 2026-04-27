import {
  workspaceExportFormatSchema,
  workspaceRetentionBulkAutomationPolicyResponseSchema,
  workspaceRetentionBulkCancelResponseSchema,
  workspaceRetentionFleetReportResponseSchema,
  type StudioWorkspaceRole,
  type StudioWorkspaceScopeSummary,
  type WorkspaceExportFormat,
  type WorkspaceLifecycleAutomationHealth,
  type WorkspaceLifecycleAutomationRunSummary,
  type WorkspaceOffboardingEntry,
  type WorkspaceRetentionBulkCancelResult
} from "@ai-nft-forge/shared";

import { OpsServiceError } from "../ops/error";
import { StudioSettingsServiceError } from "../studio-settings/error";
import { createRuntimeStudioSettingsService } from "../studio-settings/runtime";
import { createRuntimeWorkspaceDecommissionService } from "./decommission-service";
import { loadWorkspaceLifecycleAutomationSnapshot } from "./lifecycle-automation-runtime";
import { createRuntimeWorkspaceOffboardingService } from "./offboarding-service";

type WorkspaceRetentionServiceDependencies = {
  decommissionService: {
    cancelWorkspaceDecommission(input: {
      ownerUserId: string;
      workspaceId: string;
    }): Promise<unknown>;
  };
  now: () => Date;
  lifecycleAutomationSnapshotLoader: () => Promise<{
    lifecycleAutomationHealth: WorkspaceLifecycleAutomationHealth;
    recentLifecycleAutomationRuns: WorkspaceLifecycleAutomationRunSummary[];
  }>;
  offboardingService: {
    getAccessibleWorkspaceOffboardingOverview(input: {
      currentWorkspaceId?: string | null | undefined;
      workspaces: StudioWorkspaceScopeSummary[];
    }): Promise<{
      overview: {
        generatedAt: string;
        summary: {
          blockedWorkspaceCount: number;
          decommissionNoticeDueWorkspaceCount: number;
          reasonRequiredWorkspaceCount: number;
          readyWorkspaceCount: number;
          reviewRequiredWorkspaceCount: number;
          scheduledDecommissionCount: number;
          totalWorkspaceCount: number;
        };
        workspaces: WorkspaceOffboardingEntry[];
      };
    }>;
  };
  studioSettingsService: {
    updateWorkspaceLifecycleAutomationPolicy(input: {
      lifecycleAutomationPolicy: {
        automateDecommissionNotices: boolean;
        automateInvitationReminders: boolean;
        enabled: boolean;
      };
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      workspaceId: string;
    }): Promise<unknown>;
  };
};

function escapeCsvValue(value: string | number | null) {
  const normalizedValue =
    value === null ? "" : typeof value === "number" ? String(value) : value;

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

export function createWorkspaceRetentionService(
  dependencies: WorkspaceRetentionServiceDependencies
) {
  return {
    async getAccessibleWorkspaceRetentionReport(input: {
      currentWorkspaceId?: string | null | undefined;
      workspaces: StudioWorkspaceScopeSummary[];
    }) {
      const overview =
        await dependencies.offboardingService.getAccessibleWorkspaceOffboardingOverview(
          {
            currentWorkspaceId: input.currentWorkspaceId,
            workspaces: input.workspaces
          }
        );
      const lifecycleAutomationSnapshot =
        await dependencies.lifecycleAutomationSnapshotLoader();

      return workspaceRetentionFleetReportResponseSchema.parse({
        report: {
          generatedAt: overview.overview.generatedAt,
          lifecycleAutomationHealth:
            lifecycleAutomationSnapshot.lifecycleAutomationHealth,
          recentLifecycleAutomationRuns:
            lifecycleAutomationSnapshot.recentLifecycleAutomationRuns,
          scopeLabel: "Accessible workspace retention estate",
          summary: overview.overview.summary,
          workspaces: overview.overview.workspaces
        }
      });
    },

    exportAccessibleWorkspaceRetentionReportCsv(input: {
      format: WorkspaceExportFormat;
      reportData: ReturnType<
        typeof workspaceRetentionFleetReportResponseSchema.parse
      >;
    }) {
      if (workspaceExportFormatSchema.parse(input.format) !== "csv") {
        throw new Error("CSV export was requested with a non-CSV format.");
      }

      const rows = [
        [
          "workspace_id",
          "workspace_name",
          "workspace_slug",
          "workspace_role",
          "workspace_status",
          "current",
          "lifecycle_automation_enabled",
          "lifecycle_automate_invitation_reminders",
          "lifecycle_automate_decommission_notices",
          "lifecycle_automation_status",
          "lifecycle_automation_last_run_at",
          "lifecycle_automation_last_run_age_seconds",
          "lifecycle_sla_enabled",
          "lifecycle_sla_automation_max_age_minutes",
          "lifecycle_sla_webhook_failure_threshold",
          "lifecycle_sla_status",
          "lifecycle_sla_reason_codes",
          "lifecycle_sla_failed_webhook_count",
          "lifecycle_sla_last_automation_run_at",
          "readiness",
          "retention_default_days",
          "retention_minimum_days",
          "retention_reason_required",
          "lifecycle_webhook_enabled",
          "lifecycle_deliver_invitation_reminders",
          "lifecycle_deliver_decommission_notifications",
          "lifecycle_delivered_count",
          "lifecycle_failed_count",
          "lifecycle_queued_count",
          "lifecycle_skipped_count",
          "lifecycle_latest_delivery_state",
          "lifecycle_latest_event_kind",
          "blocker_codes",
          "caution_codes",
          "open_checkout_count",
          "unfulfilled_checkout_count",
          "active_alert_count",
          "open_reconciliation_issue_count",
          "live_publication_count",
          "pending_invitation_count",
          "pending_role_escalation_count",
          "decommission_status",
          "decommission_execute_after",
          "decommission_retention_days",
          "decommission_notification_count",
          "decommission_next_due_kind",
          "decommission_latest_notification_kind",
          "decommission_latest_notification_sent_at",
          "last_activity_at"
        ].join(",")
      ];

      for (const workspace of input.reportData.report.workspaces) {
        rows.push(
          [
            workspace.workspace.id,
            workspace.workspace.name,
            workspace.workspace.slug,
            workspace.workspace.role,
            workspace.workspace.status,
            workspace.current ? "yes" : "no",
            workspace.lifecycleAutomationPolicy.enabled ? "yes" : "no",
            workspace.lifecycleAutomationPolicy.automateInvitationReminders
              ? "yes"
              : "no",
            workspace.lifecycleAutomationPolicy.automateDecommissionNotices
              ? "yes"
              : "no",
            input.reportData.report.lifecycleAutomationHealth.status,
            input.reportData.report.lifecycleAutomationHealth.lastRunAt,
            input.reportData.report.lifecycleAutomationHealth.lastRunAgeSeconds,
            workspace.lifecycleSlaPolicy.enabled ? "yes" : "no",
            workspace.lifecycleSlaPolicy.automationMaxAgeMinutes,
            workspace.lifecycleSlaPolicy.webhookFailureThreshold,
            workspace.lifecycleSlaSummary.status,
            workspace.lifecycleSlaSummary.reasonCodes.join("|"),
            workspace.lifecycleSlaSummary.failedWebhookCount,
            workspace.lifecycleSlaSummary.lastAutomationRunAt,
            workspace.summary.readiness,
            workspace.retentionPolicy.defaultDecommissionRetentionDays,
            workspace.retentionPolicy.minimumDecommissionRetentionDays,
            workspace.retentionPolicy.requireDecommissionReason ? "yes" : "no",
            workspace.lifecycleDeliveryPolicy.webhookEnabled ? "yes" : "no",
            workspace.lifecycleDeliveryPolicy.deliverInvitationReminders
              ? "yes"
              : "no",
            workspace.lifecycleDeliveryPolicy.deliverDecommissionNotifications
              ? "yes"
              : "no",
            workspace.lifecycleDelivery.deliveredCount,
            workspace.lifecycleDelivery.failedCount,
            workspace.lifecycleDelivery.queuedCount,
            workspace.lifecycleDelivery.skippedCount,
            workspace.lifecycleDelivery.latestDelivery?.deliveryState ?? null,
            workspace.lifecycleDelivery.latestDelivery?.eventKind ?? null,
            workspace.summary.blockerCodes.join("|"),
            workspace.summary.cautionCodes.join("|"),
            workspace.summary.openCheckoutCount,
            workspace.summary.unfulfilledCheckoutCount,
            workspace.summary.activeAlertCount,
            workspace.summary.openReconciliationIssueCount,
            workspace.summary.livePublicationCount,
            workspace.summary.pendingInvitationCount,
            workspace.summary.pendingRoleEscalationCount,
            workspace.decommission?.status ?? null,
            workspace.decommission?.executeAfter ?? null,
            workspace.decommission?.retentionDays ?? null,
            workspace.decommissionWorkflow.notificationCount,
            workspace.decommissionWorkflow.nextDueKind ?? null,
            workspace.decommissionWorkflow.latestNotification?.kind ?? null,
            workspace.decommissionWorkflow.latestNotification?.sentAt ?? null,
            workspace.directory.lastActivityAt
          ]
            .map((value) => escapeCsvValue(value))
            .join(",")
        );
      }

      return rows.join("\n");
    },

    async cancelScheduledWorkspaceDecommissions(input: {
      actorUserId: string;
      workspaces: StudioWorkspaceScopeSummary[];
      workspaceIds: string[];
    }) {
      const uniqueWorkspaceIds = [...new Set(input.workspaceIds)];
      const accessibleWorkspaceById = new Map(
        input.workspaces.map((workspace) => [workspace.id, workspace] as const)
      );
      const results: WorkspaceRetentionBulkCancelResult[] = [];

      for (const workspaceId of uniqueWorkspaceIds) {
        const workspace = accessibleWorkspaceById.get(workspaceId);

        if (!workspace) {
          results.push({
            status: "not_found",
            workspaceId,
            workspaceName: null,
            workspaceSlug: null
          });
          continue;
        }

        if (workspace.role !== "owner") {
          results.push({
            status: "forbidden",
            workspaceId,
            workspaceName: workspace.name,
            workspaceSlug: workspace.slug
          });
          continue;
        }

        try {
          await dependencies.decommissionService.cancelWorkspaceDecommission({
            ownerUserId: input.actorUserId,
            workspaceId
          });
          results.push({
            status: "canceled",
            workspaceId,
            workspaceName: workspace.name,
            workspaceSlug: workspace.slug
          });
        } catch (error) {
          if (
            error instanceof StudioSettingsServiceError &&
            error.code === "WORKSPACE_DECOMMISSION_NOT_SCHEDULED"
          ) {
            results.push({
              status: "not_scheduled",
              workspaceId,
              workspaceName: workspace.name,
              workspaceSlug: workspace.slug
            });
            continue;
          }

          throw new OpsServiceError(
            "INTERNAL_SERVER_ERROR",
            "Workspace retention actions could not be completed.",
            500
          );
        }
      }

      return workspaceRetentionBulkCancelResponseSchema.parse({
        results,
        summary: {
          canceledCount: results.filter(
            (result) => result.status === "canceled"
          ).length,
          forbiddenCount: results.filter(
            (result) => result.status === "forbidden"
          ).length,
          notFoundCount: results.filter(
            (result) => result.status === "not_found"
          ).length,
          notScheduledCount: results.filter(
            (result) => result.status === "not_scheduled"
          ).length,
          requestedCount: uniqueWorkspaceIds.length
        }
      });
    },

    async updateAccessibleWorkspaceLifecycleAutomationPolicy(input: {
      actorUserId: string;
      currentWorkspaceId?: string | null | undefined;
      enabled: boolean;
      workspaces: StudioWorkspaceScopeSummary[];
      workspaceIds: string[];
    }) {
      const uniqueWorkspaceIds = [...new Set(input.workspaceIds)];
      const accessibleWorkspaceOverview =
        await dependencies.offboardingService.getAccessibleWorkspaceOffboardingOverview(
          {
            currentWorkspaceId: input.currentWorkspaceId,
            workspaces: input.workspaces
          }
        );
      const accessibleWorkspaceById = new Map(
        accessibleWorkspaceOverview.overview.workspaces.map(
          (workspace) => [workspace.workspace.id, workspace] as const
        )
      );
      const results: Array<{
        status: "forbidden" | "not_found" | "updated";
        workspaceId: string;
        workspaceName: string | null;
        workspaceSlug: string | null;
      }> = [];

      for (const workspaceId of uniqueWorkspaceIds) {
        const workspace = accessibleWorkspaceById.get(workspaceId);

        if (!workspace) {
          results.push({
            status: "not_found",
            workspaceId,
            workspaceName: null,
            workspaceSlug: null
          });
          continue;
        }

        if (workspace.workspace.role !== "owner") {
          results.push({
            status: "forbidden",
            workspaceId,
            workspaceName: workspace.workspace.name,
            workspaceSlug: workspace.workspace.slug
          });
          continue;
        }

        try {
          await dependencies.studioSettingsService.updateWorkspaceLifecycleAutomationPolicy(
            {
              lifecycleAutomationPolicy: {
                automateDecommissionNotices:
                  workspace.lifecycleAutomationPolicy
                    .automateDecommissionNotices,
                automateInvitationReminders:
                  workspace.lifecycleAutomationPolicy
                    .automateInvitationReminders,
                enabled: input.enabled
              },
              ownerUserId: input.actorUserId,
              role: "owner",
              workspaceId
            }
          );
          results.push({
            status: "updated",
            workspaceId,
            workspaceName: workspace.workspace.name,
            workspaceSlug: workspace.workspace.slug
          });
        } catch {
          throw new OpsServiceError(
            "INTERNAL_SERVER_ERROR",
            "Workspace retention actions could not be completed.",
            500
          );
        }
      }

      return workspaceRetentionBulkAutomationPolicyResponseSchema.parse({
        policy: {
          enabled: input.enabled
        },
        results,
        summary: {
          forbiddenCount: results.filter(
            (result) => result.status === "forbidden"
          ).length,
          notFoundCount: results.filter(
            (result) => result.status === "not_found"
          ).length,
          requestedCount: uniqueWorkspaceIds.length,
          updatedCount: results.filter((result) => result.status === "updated")
            .length
        }
      });
    }
  };
}

export function createRuntimeWorkspaceRetentionService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  return createWorkspaceRetentionService({
    decommissionService:
      createRuntimeWorkspaceDecommissionService(rawEnvironment),
    lifecycleAutomationSnapshotLoader: () =>
      loadWorkspaceLifecycleAutomationSnapshot(rawEnvironment),
    now: () => new Date(),
    offboardingService:
      createRuntimeWorkspaceOffboardingService(rawEnvironment),
    studioSettingsService: createRuntimeStudioSettingsService(rawEnvironment)
  });
}
