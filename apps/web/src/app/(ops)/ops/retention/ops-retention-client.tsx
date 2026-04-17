"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffectEvent, useState } from "react";

import {
  workspaceRetentionBulkAutomationPolicyResponseSchema,
  workspaceRetentionBulkCancelResponseSchema,
  workspaceRetentionFleetReportResponseSchema,
  type WorkspaceRetentionFleetReportResponse
} from "@ai-nft-forge/shared";
import {
  ActionRow,
  ActionButton,
  ActionLink,
  OpsEmptyState,
  OpsPanelCard,
  OpsStatusNotice,
  MetricTile,
  Pill,
  StatusBanner,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

type OpsRetentionClientProps = {
  initialReport: WorkspaceRetentionFleetReportResponse["report"];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatDurationSeconds(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  if (value < 60) {
    return `${value}s`;
  }

  const minutes = Math.floor(value / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
}

function resolveNoticeTone(tone: "error" | "info" | "success") {
  return tone === "error" ? "error" : tone === "success" ? "success" : "info";
}

function resolveAutomationTone(status: string | null | undefined) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "disabled") {
    return "info";
  }

  return "error";
}

function resolveWorkspaceReadinessTone(readiness: string | null | undefined) {
  if (readiness === "blocked" || readiness === "review_required") {
    return "warning";
  }

  return "neutral";
}

async function parseJsonResponse<T>(input: {
  response: Response;
  schema: {
    parse(value: unknown): T;
  };
}) {
  const payload = await input.response.json().catch(() => null);

  if (!input.response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message);
    }

    throw new Error("The retention request could not be completed.");
  }

  return input.schema.parse(payload);
}

export function OpsRetentionClient({ initialReport }: OpsRetentionClientProps) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [selectedAutomationWorkspaceIds, setSelectedAutomationWorkspaceIds] =
    useState<string[]>([]);
  const [selectedCancelableWorkspaceIds, setSelectedCancelableWorkspaceIds] =
    useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isUpdatingAutomationPolicy, setIsUpdatingAutomationPolicy] =
    useState(false);

  const cancelableWorkspaceIds = report.workspaces
    .filter(
      (workspace) =>
        workspace.workspace.role === "owner" &&
        workspace.decommission?.status === "scheduled"
    )
    .map((workspace) => workspace.workspace.id);
  const automationManageableWorkspaceIds = report.workspaces
    .filter((workspace) => workspace.workspace.role === "owner")
    .map((workspace) => workspace.workspace.id);

  const refreshReport = useEffectEvent(async () => {
    setIsRefreshing(true);

    try {
      const payload = await parseJsonResponse({
        response: await fetch("/api/ops/retention", {
          cache: "no-store"
        }),
        schema: workspaceRetentionFleetReportResponseSchema
      });

      setReport(payload.report);
      setSelectedCancelableWorkspaceIds((current) =>
        current.filter((workspaceId) =>
          payload.report.workspaces.some(
            (workspace) =>
              workspace.workspace.id === workspaceId &&
              workspace.decommission?.status === "scheduled" &&
              workspace.workspace.role === "owner"
          )
        )
      );
      setSelectedAutomationWorkspaceIds((current) =>
        current.filter((workspaceId) =>
          payload.report.workspaces.some(
            (workspace) =>
              workspace.workspace.id === workspaceId &&
              workspace.workspace.role === "owner"
          )
        )
      );
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsRefreshing(false);
    }
  });

  async function handleBulkCancel() {
    if (selectedCancelableWorkspaceIds.length === 0) {
      setNotice({
        message: "Select at least one scheduled decommission to cancel.",
        tone: "error"
      });
      return;
    }

    setIsCanceling(true);
    setNotice({
      message: "Canceling scheduled decommissions…",
      tone: "info"
    });

    try {
      const payload = await parseJsonResponse({
        response: await fetch("/api/ops/retention/decommission/cancel", {
          body: JSON.stringify({
            workspaceIds: selectedCancelableWorkspaceIds
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }),
        schema: workspaceRetentionBulkCancelResponseSchema
      });

      await refreshReport();
      setSelectedCancelableWorkspaceIds([]);
      setNotice({
        message: `Canceled ${payload.summary.canceledCount} scheduled decommission(s).`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Scheduled decommissions could not be canceled.",
        tone: "error"
      });
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleBulkAutomationUpdate(enabled: boolean) {
    if (selectedAutomationWorkspaceIds.length === 0) {
      setNotice({
        message: "Select at least one owner workspace to update automation.",
        tone: "error"
      });
      return;
    }

    setIsUpdatingAutomationPolicy(true);
    setNotice({
      message: `${enabled ? "Enabling" : "Pausing"} lifecycle automation…`,
      tone: "info"
    });

    try {
      const payload = await parseJsonResponse({
        response: await fetch("/api/ops/retention/automation/policy", {
          body: JSON.stringify({
            enabled,
            workspaceIds: selectedAutomationWorkspaceIds
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }),
        schema: workspaceRetentionBulkAutomationPolicyResponseSchema
      });

      await refreshReport();
      setNotice({
        message: `${enabled ? "Enabled" : "Paused"} lifecycle automation for ${payload.summary.updatedCount} workspace(s).`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Lifecycle automation policy could not be updated.",
        tone: "error"
      });
    } finally {
      setIsUpdatingAutomationPolicy(false);
    }
  }

  return (
    <SurfaceGrid>
      <SurfaceCard
        body="Retention review keeps offboarding blockers, scheduled decommissions, and final cleanup readiness visible across the accessible workspace estate."
        eyebrow="Retention fleet"
        span={12}
        title="Retention and decommission overview"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricTile
            label="Workspaces"
            value={report.summary.totalWorkspaceCount.toString()}
          />
          <MetricTile
            label="Blocked"
            value={report.summary.blockedWorkspaceCount.toString()}
          />
          <MetricTile
            label="Review required"
            value={report.summary.reviewRequiredWorkspaceCount.toString()}
          />
          <MetricTile
            label="Ready"
            value={report.summary.readyWorkspaceCount.toString()}
          />
          <MetricTile
            label="Scheduled"
            value={report.summary.scheduledDecommissionCount.toString()}
          />
          <MetricTile
            label="Reason required"
            value={report.summary.reasonRequiredWorkspaceCount.toString()}
          />
        </div>
        <ActionRow compact className="mt-3">
          <Pill>{formatTimestamp(report.generatedAt)}</Pill>
          <ActionLink href="/api/ops/retention?format=json" tone="inline">
            Export JSON
          </ActionLink>
          <ActionLink href="/api/ops/retention?format=csv" tone="inline">
            Export CSV
          </ActionLink>
          <ActionButton
            disabled={isRefreshing}
            onClick={() => {
              void refreshReport();
            }}
            tone="secondary"
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh retention"}
          </ActionButton>
        </ActionRow>
        {notice ? (
          <OpsStatusNotice
            tone={resolveNoticeTone(notice.tone)}
            title={
              notice.tone === "error"
                ? "Retention error"
                : notice.tone === "success"
                  ? "Retention updated"
                  : "Working"
            }
          >
            {notice.message}
          </OpsStatusNotice>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body="Lifecycle automation health now comes from durable worker run history plus the current leased scheduler configuration, so retention review no longer depends on one lucky reminder or notice event."
        eyebrow={report.lifecycleAutomationHealth.status}
        span={12}
        title="Lifecycle automation"
      >
        <StatusBanner
          tone={resolveAutomationTone(report.lifecycleAutomationHealth.status)}
        >
          <strong className="mb-1 block font-semibold">
            {report.lifecycleAutomationHealth.status}
          </strong>
          <span>{report.lifecycleAutomationHealth.message}</span>
        </StatusBanner>
        <ActionRow compact className="mt-3">
          <Pill>
            {report.lifecycleAutomationHealth.enabled
              ? "Scheduler enabled"
              : "Manual only"}
          </Pill>
          <Pill>
            Interval{" "}
            {formatDurationSeconds(
              report.lifecycleAutomationHealth.intervalSeconds
            )}
          </Pill>
          <Pill>
            Jitter{" "}
            {formatDurationSeconds(
              report.lifecycleAutomationHealth.jitterSeconds
            )}
          </Pill>
          <Pill>
            Lock TTL{" "}
            {formatDurationSeconds(
              report.lifecycleAutomationHealth.lockTtlSeconds
            )}
          </Pill>
          <Pill>
            Last run{" "}
            {report.lifecycleAutomationHealth.lastRunAgeSeconds !== null
              ? `${formatDurationSeconds(
                  report.lifecycleAutomationHealth.lastRunAgeSeconds
                )} ago`
              : "n/a"}
          </Pill>
        </ActionRow>
        <div className="mt-4 space-y-2">
          {report.recentLifecycleAutomationRuns.length ? (
            report.recentLifecycleAutomationRuns.map((run) => (
              <OpsPanelCard tone="neutral" key={run.id}>
                <div className="grid gap-1 text-sm text-[color:var(--color-muted)]">
                  <strong className="text-[color:var(--color-text)]">
                    {formatStatus(run.status)} · {run.triggerSource}
                  </strong>
                  <span>
                    Started {formatTimestamp(run.startedAt)}
                    {run.completedAt
                      ? ` · completed ${formatTimestamp(run.completedAt)}`
                      : ""}
                  </span>
                  <span>
                    {run.workspaceCount} workspace
                    {run.workspaceCount === 1 ? "" : "s"} ·{" "}
                    {run.invitationReminderCount} invite reminder
                    {run.invitationReminderCount === 1 ? "" : "s"} ·{" "}
                    {run.decommissionNoticeCount} decommission notice
                    {run.decommissionNoticeCount === 1 ? "" : "s"}
                  </span>
                  <span>
                    Audit-log {run.auditLogDeliveryCount} · webhook queued{" "}
                    {run.webhookQueuedCount} · failures{" "}
                    {run.failedWorkspaceCount}
                    {run.failureMessage ? ` · ${run.failureMessage}` : ""}
                  </span>
                </div>
              </OpsPanelCard>
            ))
          ) : (
            <OpsEmptyState centered>
              No lifecycle automation runs have been recorded yet.
            </OpsEmptyState>
          )}
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="Only already-scheduled decommissions can be canceled in bulk. Final execution remains workspace-local and owner-confirmed."
        eyebrow="Bulk action"
        span={12}
        title="Cancel scheduled decommissions"
      >
        <ActionRow compact>
          <Pill>{selectedCancelableWorkspaceIds.length} selected</Pill>
          <Pill>{cancelableWorkspaceIds.length} cancelable</Pill>
          <ActionButton
            disabled={
              isCanceling || selectedCancelableWorkspaceIds.length === 0
            }
            onClick={() => {
              void handleBulkCancel();
            }}
            tone="primary"
            type="button"
          >
            {isCanceling ? "Canceling…" : "Cancel selected schedules"}
          </ActionButton>
        </ActionRow>
      </SurfaceCard>
      <SurfaceCard
        body="Bulk automation only flips the top-level workspace scheduler switch. Per-workspace invitation and decommission notice settings stay intact."
        eyebrow="Bulk action"
        span={12}
        title="Lifecycle automation control"
      >
        <ActionRow compact>
          <Pill>{selectedAutomationWorkspaceIds.length} selected</Pill>
          <Pill>{automationManageableWorkspaceIds.length} owner-managed</Pill>
          <ActionButton
            disabled={
              isUpdatingAutomationPolicy ||
              selectedAutomationWorkspaceIds.length === 0
            }
            onClick={() => {
              void handleBulkAutomationUpdate(false);
            }}
            tone="secondary"
            type="button"
          >
            {isUpdatingAutomationPolicy ? "Updating…" : "Pause automation"}
          </ActionButton>
          <ActionButton
            disabled={
              isUpdatingAutomationPolicy ||
              selectedAutomationWorkspaceIds.length === 0
            }
            onClick={() => {
              void handleBulkAutomationUpdate(true);
            }}
            tone="primary"
            type="button"
          >
            {isUpdatingAutomationPolicy ? "Updating…" : "Resume automation"}
          </ActionButton>
        </ActionRow>
      </SurfaceCard>
      <SurfaceCard
        body="Workspaces that are owner-managed and active are included in every safe bulk control path so operators keep context before acting."
        eyebrow="Workspaces"
        span={12}
        title="Offboarding and decommission state"
      >
        <div className="mt-3 space-y-2">
          {report.workspaces.map((workspace) => {
            const canSelectCancel =
              workspace.workspace.role === "owner" &&
              workspace.decommission?.status === "scheduled";

            return (
              <OpsPanelCard
                tone={resolveWorkspaceReadinessTone(
                  workspace.summary.readiness
                )}
                key={workspace.workspace.id}
              >
                <div className="grid gap-1.5 text-sm text-[color:var(--color-muted)]">
                  <strong className="text-[color:var(--color-text)]">
                    {workspace.workspace.name} · /{workspace.workspace.slug}
                  </strong>
                  <span>
                    {workspace.workspace.role} ·{" "}
                    {formatStatus(workspace.workspace.status)}
                    {workspace.current ? " · current selection" : ""}
                  </span>
                  <span>
                    readiness {formatStatus(workspace.summary.readiness)} ·{" "}
                    {workspace.summary.activeAlertCount} alerts ·{" "}
                    {workspace.summary.openCheckoutCount} open checkouts ·{" "}
                    {workspace.summary.openReconciliationIssueCount} open
                    reconciliation
                  </span>
                  <span>
                    invites {workspace.directory.pendingInvitationCount} pending
                    · {workspace.directory.expiringInvitationCount} expiring ·{" "}
                    {workspace.directory.expiredInvitationCount} expired
                  </span>
                  <span>
                    policy default{" "}
                    {workspace.retentionPolicy.defaultDecommissionRetentionDays}
                    d · minimum{" "}
                    {workspace.retentionPolicy.minimumDecommissionRetentionDays}
                    d · reason{" "}
                    {workspace.retentionPolicy.requireDecommissionReason
                      ? "required"
                      : "optional"}
                  </span>
                  <span>
                    automation{" "}
                    {workspace.lifecycleAutomationPolicy.enabled
                      ? "enabled"
                      : "disabled"}{" "}
                    · invites{" "}
                    {workspace.lifecycleAutomationPolicy
                      .automateInvitationReminders
                      ? "enabled"
                      : "disabled"}{" "}
                    · decommission{" "}
                    {workspace.lifecycleAutomationPolicy
                      .automateDecommissionNotices
                      ? "enabled"
                      : "disabled"}
                  </span>
                  <span>
                    SLA {formatStatus(workspace.lifecycleSlaSummary.status)} ·
                    max age{" "}
                    {workspace.lifecycleSlaPolicy.automationMaxAgeMinutes}m ·
                    failure threshold{" "}
                    {workspace.lifecycleSlaPolicy.webhookFailureThreshold} ·
                    failed webhooks{" "}
                    {workspace.lifecycleSlaSummary.failedWebhookCount}
                    {workspace.lifecycleSlaSummary.reasonCodes.length
                      ? ` · reasons ${workspace.lifecycleSlaSummary.reasonCodes
                          .map((reasonCode) => formatStatus(reasonCode))
                          .join(", ")}`
                      : ""}
                  </span>
                  <span>
                    lifecycle webhook{" "}
                    {workspace.lifecycleDeliveryPolicy.webhookEnabled
                      ? "enabled"
                      : "disabled"}{" "}
                    · audit-log delivered{" "}
                    {workspace.lifecycleDelivery.auditLog.deliveredCount} ·
                    webhook delivered{" "}
                    {workspace.lifecycleDelivery.webhook.deliveredCount} ·
                    webhook failed{" "}
                    {workspace.lifecycleDelivery.webhook.failedCount} · webhook
                    queued {workspace.lifecycleDelivery.webhook.queuedCount}
                    {workspace.lifecycleDelivery.providers.length
                      ? ` · providers ${workspace.lifecycleDelivery.providers
                          .map(
                            (provider) =>
                              `${provider.label} ${provider.deliveredCount}/${provider.failedCount}/${provider.queuedCount}`
                          )
                          .join(", ")}`
                      : ""}
                  </span>
                  <span>
                    {workspace.decommission
                      ? `scheduled for ${formatTimestamp(
                          workspace.decommission.executeAfter
                        )}`
                      : "no decommission scheduled"}
                  </span>
                  {workspace.decommission ? (
                    <span>
                      notices {workspace.decommissionWorkflow.notificationCount}
                      {workspace.decommissionWorkflow.nextDueKind
                        ? ` · next due ${formatStatus(
                            workspace.decommissionWorkflow.nextDueKind
                          )}`
                        : ""}
                    </span>
                  ) : null}
                  {workspace.lifecycleDelivery.latestDelivery ? (
                    <span>
                      latest lifecycle{" "}
                      {formatStatus(
                        workspace.lifecycleDelivery.latestDelivery.eventKind
                      )}{" "}
                      {formatStatus(
                        workspace.lifecycleDelivery.latestDelivery.deliveryState
                      )}{" "}
                      {formatTimestamp(
                        workspace.lifecycleDelivery.latestDelivery.updatedAt
                      )}
                    </span>
                  ) : null}
                </div>
                <ActionRow compact className="mt-3">
                  {canSelectCancel ? (
                    <label
                      className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text)]"
                      htmlFor={workspace.workspace.id}
                    >
                      <input
                        checked={selectedCancelableWorkspaceIds.includes(
                          workspace.workspace.id
                        )}
                        id={workspace.workspace.id}
                        onChange={(event) => {
                          setSelectedCancelableWorkspaceIds((current) => {
                            if (event.target.checked) {
                              return current.includes(workspace.workspace.id)
                                ? current
                                : [...current, workspace.workspace.id];
                            }

                            return current.filter(
                              (workspaceId) =>
                                workspaceId !== workspace.workspace.id
                            );
                          });
                        }}
                        type="checkbox"
                      />
                      <span>Cancel schedule</span>
                    </label>
                  ) : null}
                  {workspace.workspace.role === "owner" ? (
                    <label
                      className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text)]"
                      htmlFor={`${workspace.workspace.id}-automation`}
                    >
                      <input
                        checked={selectedAutomationWorkspaceIds.includes(
                          workspace.workspace.id
                        )}
                        id={`${workspace.workspace.id}-automation`}
                        onChange={(event) => {
                          setSelectedAutomationWorkspaceIds((current) => {
                            if (event.target.checked) {
                              return current.includes(workspace.workspace.id)
                                ? current
                                : [...current, workspace.workspace.id];
                            }

                            return current.filter(
                              (workspaceId) =>
                                workspaceId !== workspace.workspace.id
                            );
                          });
                        }}
                        type="checkbox"
                      />
                      <span>
                        {workspace.lifecycleAutomationPolicy.enabled
                          ? "Pause/resume automation"
                          : "Resume automation"}
                      </span>
                    </label>
                  ) : null}
                  {workspace.workspace.role === "owner" ? (
                    <ActionLink
                      href={`/api/studio/workspaces/${workspace.workspace.id}/export?format=json`}
                      tone="inline"
                    >
                      Workspace export
                    </ActionLink>
                  ) : null}
                </ActionRow>
              </OpsPanelCard>
            );
          })}
        </div>
      </SurfaceCard>
    </SurfaceGrid>
  );
}
