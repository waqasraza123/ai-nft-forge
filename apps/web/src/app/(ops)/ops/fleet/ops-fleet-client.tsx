"use client";

import {
  opsAlertAcknowledgeResponseSchema,
  opsAlertMuteResponseSchema,
  opsReconciliationRunResponseSchema,
  workspaceFleetOverviewResponseSchema,
  type StudioWorkspaceScopeSummary,
  type WorkspaceFleetAlertSummary,
  type WorkspaceFleetOverviewResponse,
  type WorkspaceFleetWorkspaceSummary
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  cn,
  OpsEmptyState,
  OpsPanelCard,
  MetricTile,
  Pill,
  StatusBanner,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";
import { useRouter } from "next/navigation";
import { startTransition, useEffectEvent, useState } from "react";

import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { OpsFleetWorkspaceCard } from "../../../../components/ops/ops-fleet-workspace-card";

type OpsFleetClientProps = {
  currentWorkspaceSlug: string | null;
  initialFleet: WorkspaceFleetOverviewResponse["fleet"];
  workspaces: StudioWorkspaceScopeSummary[];
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

function formatWorkspaceStatus(status: "active" | "archived" | "suspended") {
  return status.replaceAll("_", " ");
}

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 404:
      return "The requested workspace or alert was not found.";
    case 409:
      return "The requested ops action conflicts with the current workspace state.";
    default:
      return "The fleet ops request could not be completed.";
  }
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

    throw new Error(createFallbackErrorMessage(input.response));
  }

  return input.schema.parse(payload);
}

function getWorkspacePressureScore(workspace: WorkspaceFleetWorkspaceSummary) {
  return (
    workspace.ops.criticalAlertCount * 60 +
    workspace.ops.activeAlertCount * 18 +
    workspace.ops.openReconciliationIssueCount * 36 +
    workspace.commerce.automationFailedCheckoutCount * 24 +
    workspace.commerce.unfulfilledCheckoutCount * 18 +
    workspace.commerce.openCheckoutCount * 6
  );
}

function compareWorkspacesByPressure(
  left: WorkspaceFleetWorkspaceSummary,
  right: WorkspaceFleetWorkspaceSummary
) {
  const scoreDifference =
    getWorkspacePressureScore(right) - getWorkspacePressureScore(left);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  if (right.ops.criticalAlertCount !== left.ops.criticalAlertCount) {
    return right.ops.criticalAlertCount - left.ops.criticalAlertCount;
  }

  if (
    right.ops.openReconciliationIssueCount !==
    left.ops.openReconciliationIssueCount
  ) {
    return (
      right.ops.openReconciliationIssueCount -
      left.ops.openReconciliationIssueCount
    );
  }

  const leftLastActivity = left.directory.lastActivityAt
    ? new Date(left.directory.lastActivityAt).getTime()
    : 0;
  const rightLastActivity = right.directory.lastActivityAt
    ? new Date(right.directory.lastActivityAt).getTime()
    : 0;

  if (leftLastActivity !== rightLastActivity) {
    return leftLastActivity - rightLastActivity;
  }

  return left.workspace.name.localeCompare(right.workspace.name);
}

function compareWorkspacesByAlertPressure(
  left: WorkspaceFleetWorkspaceSummary,
  right: WorkspaceFleetWorkspaceSummary
) {
  const alertDifference =
    right.ops.activeAlertCount - left.ops.activeAlertCount;

  if (alertDifference !== 0) {
    return alertDifference;
  }

  if (right.ops.criticalAlertCount !== left.ops.criticalAlertCount) {
    return right.ops.criticalAlertCount - left.ops.criticalAlertCount;
  }

  if (right.ops.warningAlertCount !== left.ops.warningAlertCount) {
    return right.ops.warningAlertCount - left.ops.warningAlertCount;
  }

  const leftLastActivity = left.directory.lastActivityAt
    ? new Date(left.directory.lastActivityAt).getTime()
    : 0;
  const rightLastActivity = right.directory.lastActivityAt
    ? new Date(right.directory.lastActivityAt).getTime()
    : 0;

  if (leftLastActivity !== rightLastActivity) {
    return leftLastActivity - rightLastActivity;
  }

  return left.workspace.name.localeCompare(right.workspace.name);
}

function compareWorkspacesByReconciliationPressure(
  left: WorkspaceFleetWorkspaceSummary,
  right: WorkspaceFleetWorkspaceSummary
) {
  const issueDifference =
    right.ops.openReconciliationIssueCount -
    left.ops.openReconciliationIssueCount;

  if (issueDifference !== 0) {
    return issueDifference;
  }

  if (right.ops.criticalAlertCount !== left.ops.criticalAlertCount) {
    return right.ops.criticalAlertCount - left.ops.criticalAlertCount;
  }

  if (
    right.commerce.automationFailedCheckoutCount !==
    left.commerce.automationFailedCheckoutCount
  ) {
    return (
      right.commerce.automationFailedCheckoutCount -
      left.commerce.automationFailedCheckoutCount
    );
  }

  const leftLastActivity = left.directory.lastActivityAt
    ? new Date(left.directory.lastActivityAt).getTime()
    : 0;
  const rightLastActivity = right.directory.lastActivityAt
    ? new Date(right.directory.lastActivityAt).getTime()
    : 0;

  if (leftLastActivity !== rightLastActivity) {
    return leftLastActivity - rightLastActivity;
  }

  return left.workspace.name.localeCompare(right.workspace.name);
}

function resolveAlertTone(severity: WorkspaceFleetAlertSummary["severity"]) {
  return severity === "critical" ? "critical" : "warning";
}

export function OpsFleetClient({
  currentWorkspaceSlug,
  initialFleet,
  workspaces
}: OpsFleetClientProps) {
  const router = useRouter();
  const [fleet, setFleet] = useState(initialFleet);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshFleet = useEffectEvent(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/ops/fleet", {
        cache: "no-store"
      });
      const payload = await parseJsonResponse({
        response,
        schema: workspaceFleetOverviewResponseSchema
      });

      setFleet(payload.fleet);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsRefreshing(false);
    }
  });

  async function runAction<T>(input: {
    busyKey: string;
    request: () => Promise<T>;
    successMessage: string;
  }) {
    setBusyKey(input.busyKey);
    setNotice({
      message: "Applying fleet action…",
      tone: "info"
    });

    try {
      await input.request();
      await refreshFleet();
      setNotice({
        message: input.successMessage,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "The fleet ops action could not be completed.",
        tone: "error"
      });
    } finally {
      setBusyKey(null);
    }
  }

  const rankedWorkspaces = [...fleet.workspaces].sort(
    compareWorkspacesByPressure
  );
  const attentionWorkspaces = rankedWorkspaces.slice(0, 3);
  const alertPressureWorkspaces = [...fleet.workspaces]
    .filter((workspace) => workspace.ops.activeAlertCount > 0)
    .sort(compareWorkspacesByAlertPressure);
  const reconciliationPressureWorkspaces = [...fleet.workspaces]
    .filter((workspace) => workspace.ops.openReconciliationIssueCount > 0)
    .sort(compareWorkspacesByReconciliationPressure);
  const alertPressureLeaders = alertPressureWorkspaces.slice(0, 4);
  const reconciliationPressureLeaders = reconciliationPressureWorkspaces.slice(
    0,
    4
  );
  const reconciliationWorkspaces = rankedWorkspaces.filter(
    (workspace) => workspace.ops.openReconciliationIssueCount > 0
  );
  const pressuredWorkspaceCount = rankedWorkspaces.filter(
    (workspace) => getWorkspacePressureScore(workspace) > 0
  ).length;
  const alertPressureWorkspaceCount = rankedWorkspaces.filter(
    (workspace) => workspace.ops.activeAlertCount > 0
  ).length;
  const reconciliationPressureWorkspaceCount = reconciliationWorkspaces.length;
  const currentWorkspace =
    fleet.workspaces.find((workspace) => workspace.directory.current) ?? null;

  return (
    <SurfaceGrid>
      <SurfaceCard
        body="Compare alert concentration, reconciliation backlog, and checkout friction across the accessible estate before drilling into a single workspace."
        eyebrow="Fleet triage"
        span={8}
        title="Cross-workspace risk map"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
            The current workspace stays explicit, but the comparison stays
            estate-wide so pressure is visible before it becomes a workflow
            blocker.
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill>
              {currentWorkspace?.workspace.slug ?? "no active workspace"}
            </Pill>
            <Pill>{currentWorkspace?.workspace.role ?? "owner"}</Pill>
            <Pill>{workspaces.length} accessible</Pill>
            <Pill>{pressuredWorkspaceCount} pressured</Pill>
            <Pill>{formatTimestamp(fleet.summary.generatedAt)}</Pill>
          </div>
          <OpsPanelCard tone="neutral" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Top pressure
            </span>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {attentionWorkspaces.map((workspace, index) => (
                <OpsPanelCard
                  className="p-3"
                  key={workspace.workspace.id}
                  tone="neutral"
                >
                  <div className="space-y-1">
                    <strong>
                      {index + 1}. {workspace.workspace.name}
                    </strong>
                    <span>
                      /{workspace.workspace.slug} ·{" "}
                      {formatWorkspaceStatus(workspace.workspace.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
                    <Pill>{getWorkspacePressureScore(workspace)} pressure</Pill>
                    <Pill>{workspace.ops.activeAlertCount} alerts</Pill>
                    <Pill>
                      {workspace.ops.openReconciliationIssueCount} recon
                    </Pill>
                  </div>
                </OpsPanelCard>
              ))}
            </div>
          </OpsPanelCard>
          <OpsPanelCard
            tone="neutral"
            className="bg-[color:var(--color-surface-strong)] p-3"
          >
            <div className="flex flex-wrap gap-2">
              <Pill>{pressuredWorkspaceCount} pressured</Pill>
              <Pill>{alertPressureWorkspaceCount} with alerts</Pill>
              <Pill>
                {reconciliationPressureWorkspaceCount} with recon issues
              </Pill>
            </div>
            <div className="mt-3 flex justify-end">
              <ActionButton
                disabled={isRefreshing}
                onClick={() => {
                  void refreshFleet();
                }}
                tone="secondary"
                type="button"
              >
                {isRefreshing ? "Refreshing…" : "Refresh fleet"}
              </ActionButton>
            </div>
          </OpsPanelCard>
          {notice ? (
            <StatusBanner
              tone={
                notice.tone === "error"
                  ? "error"
                  : notice.tone === "success"
                    ? "success"
                    : "info"
              }
            >
              <strong>
                {notice.tone === "error"
                  ? "Fleet error"
                  : notice.tone === "success"
                    ? "Fleet updated"
                    : "Working"}
              </strong>
              <span>{notice.message}</span>
            </StatusBanner>
          ) : null}
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="Keep the current workspace explicit while reviewing the estate. This selector still drives the rest of the studio and ops surfaces."
        eyebrow="Workspace scope"
        span={4}
        title="Selected workspace boundary"
      >
        <WorkspaceScopeSwitcher
          currentWorkspaceSlug={currentWorkspaceSlug}
          workspaces={workspaces}
        />
      </SurfaceCard>
      <SurfaceCard
        body="These counts update from the same fleet contract but are arranged to spotlight estate pressure at a glance."
        eyebrow="Estate signal"
        span={12}
        title="Fleet-wide pressure band"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetricTile
            label="Workspaces"
            value={fleet.summary.totalWorkspaceCount.toString()}
          />
          <MetricTile
            label="Critical alerts"
            value={fleet.summary.criticalAlertCount.toString()}
          />
          <MetricTile
            label="Open alerts"
            value={fleet.summary.activeAlertCount.toString()}
          />
          <MetricTile
            label="Reconciliation issues"
            value={fleet.summary.openReconciliationIssueCount.toString()}
          />
          <MetricTile
            label="Open checkouts"
            value={fleet.summary.openCheckoutCount.toString()}
          />
          <MetricTile
            label="Unfulfilled checkouts"
            value={fleet.summary.unfulfilledCheckoutCount.toString()}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>{pressuredWorkspaceCount} pressured workspaces</Pill>
          <Pill>{alertPressureWorkspaceCount} alert-bearing workspaces</Pill>
          <Pill>
            {reconciliationPressureWorkspaceCount} reconciliation-bearing
            workspaces
          </Pill>
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="The most pressured workspaces float to the top using a derived pressure score based on alerts, reconciliation issues, and checkout friction."
        eyebrow="Needs attention now"
        span={12}
        title="Most at-risk workspaces"
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {attentionWorkspaces.map((workspace, index) => (
            <OpsFleetWorkspaceCard
              busyKey={busyKey}
              key={workspace.workspace.id}
              onRunReconciliation={(selectedWorkspace) => {
                void runAction({
                  busyKey: `reconcile:${selectedWorkspace.workspace.id}`,
                  request: async () => {
                    const response = await fetch(
                      `/api/ops/fleet/workspaces/${encodeURIComponent(
                        selectedWorkspace.workspace.id
                      )}/reconciliation/run`,
                      {
                        method: "POST"
                      }
                    );

                    await parseJsonResponse({
                      response,
                      schema: opsReconciliationRunResponseSchema
                    });
                  },
                  successMessage: `Reconciliation started for ${selectedWorkspace.workspace.name}.`
                });
              }}
              pressureScore={getWorkspacePressureScore(workspace)}
              rank={index + 1}
              workspace={workspace}
            />
          ))}
          {attentionWorkspaces.length === 0 ? (
            <OpsEmptyState className="col-span-full rounded-lg">
              No workspace pressure is currently standing out across the
              accessible fleet.
            </OpsEmptyState>
          ) : null}
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="Compare which workspaces are carrying the most alert load, then use the queue below to act on the individual alert states."
        eyebrow="Alert pressure"
        span={6}
        title="Alert concentration"
      >
        <div className="space-y-2">
          {alertPressureLeaders.length ? (
            alertPressureLeaders.map((workspace, index) => (
              <OpsPanelCard
                className="p-3"
                tone="neutral"
                key={workspace.workspace.id}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] text-xs font-semibold text-[color:var(--color-muted)]">
                      {index + 1}
                    </span>
                    <strong>{workspace.workspace.name}</strong>
                  </div>
                  <span>
                    /{workspace.workspace.slug} · {workspace.workspace.role} ·{" "}
                    {formatWorkspaceStatus(workspace.workspace.status)}
                    {workspace.directory.current ? " · current" : ""}
                  </span>
                  <span>
                    {workspace.ops.activeAlertCount} active alerts ·{" "}
                    {workspace.ops.criticalAlertCount} critical ·{" "}
                    {workspace.ops.warningAlertCount} warning
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill>
                    {workspace.ops.openReconciliationIssueCount} recon
                  </Pill>
                  <Pill>
                    {workspace.commerce.openCheckoutCount} open checkouts
                  </Pill>
                  <Pill>
                    {workspace.publications.livePublicationCount} live pubs
                  </Pill>
                </div>
              </OpsPanelCard>
            ))
          ) : (
            <OpsEmptyState className="rounded-lg">
              No workspace is carrying active alerts across the accessible
              fleet.
            </OpsEmptyState>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {fleet.alertQueue.length ? (
            fleet.alertQueue.map((alert) => {
              const acknowledgeBusyKey = `ack:${alert.alertStateId}`;
              const muteBusyKey = `mute:${alert.alertStateId}`;
              const workspaceIsActive = alert.workspace.status === "active";

              return (
                <OpsPanelCard
                  className="text-sm"
                  tone={resolveAlertTone(alert.severity)}
                  key={alert.alertStateId}
                >
                  <div className="space-y-2">
                    <strong>
                      {alert.title} · {alert.workspace.name}
                    </strong>
                    <span>
                      {alert.severity} · {alert.code} · /{alert.workspace.slug}{" "}
                      · {formatWorkspaceStatus(alert.workspace.status)}
                    </span>
                    <span>{alert.message}</span>
                    <span>
                      First seen {formatTimestamp(alert.firstObservedAt)} · last
                      seen {formatTimestamp(alert.lastObservedAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      tone="secondary"
                      disabled={
                        !workspaceIsActive || busyKey === acknowledgeBusyKey
                      }
                      onClick={() => {
                        void runAction({
                          busyKey: acknowledgeBusyKey,
                          request: async () => {
                            const response = await fetch(
                              `/api/ops/fleet/alerts/${encodeURIComponent(
                                alert.alertStateId
                              )}/acknowledge`,
                              {
                                body: JSON.stringify({
                                  workspaceId: alert.workspace.id
                                }),
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                method: "POST"
                              }
                            );

                            await parseJsonResponse({
                              response,
                              schema: opsAlertAcknowledgeResponseSchema
                            });
                          },
                          successMessage: `Acknowledged ${alert.title}.`
                        });
                      }}
                      type="button"
                    >
                      {!workspaceIsActive
                        ? "Workspace inactive"
                        : busyKey === acknowledgeBusyKey
                          ? "Acknowledging…"
                          : "Acknowledge"}
                    </ActionButton>
                    <ActionButton
                      tone="secondary"
                      disabled={!workspaceIsActive || busyKey === muteBusyKey}
                      onClick={() => {
                        void runAction({
                          busyKey: muteBusyKey,
                          request: async () => {
                            const response = await fetch(
                              `/api/ops/fleet/alerts/${encodeURIComponent(
                                alert.alertStateId
                              )}/mute`,
                              {
                                body: JSON.stringify({
                                  durationHours: 4,
                                  workspaceId: alert.workspace.id
                                }),
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                method: "POST"
                              }
                            );

                            await parseJsonResponse({
                              response,
                              schema: opsAlertMuteResponseSchema
                            });
                          },
                          successMessage: `Muted ${alert.title} for 4 hours.`
                        });
                      }}
                      type="button"
                    >
                      {!workspaceIsActive
                        ? "Workspace inactive"
                        : busyKey === muteBusyKey
                          ? "Muting…"
                          : "Mute 4h"}
                    </ActionButton>
                  </div>
                </OpsPanelCard>
              );
            })
          ) : (
            <OpsEmptyState className="rounded-lg">
              No active alerts are queued across the accessible workspace fleet.
            </OpsEmptyState>
          )}
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="Workspaces with open reconciliation issues stay separate from the alert queue so operators can move directly to the repair path."
        eyebrow="Reconciliation pressure"
        span={6}
        title="Reconciliation backlog"
      >
        <div className="space-y-2">
          {reconciliationPressureLeaders.length ? (
            reconciliationPressureLeaders.map((workspace, index) => (
              <OpsPanelCard
                className="p-3"
                tone="neutral"
                key={workspace.workspace.id}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] text-xs font-semibold text-[color:var(--color-muted)]">
                      {index + 1}
                    </span>
                    <strong>{workspace.workspace.name}</strong>
                  </div>
                  <span>
                    /{workspace.workspace.slug} · {workspace.workspace.role} ·{" "}
                    {formatWorkspaceStatus(workspace.workspace.status)}
                    {workspace.directory.current ? " · current" : ""}
                  </span>
                  <span>
                    {workspace.ops.openReconciliationIssueCount} open issues ·{" "}
                    {workspace.commerce.automationFailedCheckoutCount} failed
                    checkouts
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill>{workspace.ops.criticalAlertCount} critical</Pill>
                  <Pill>{workspace.ops.activeAlertCount} alerts</Pill>
                  <Pill>
                    {formatTimestamp(workspace.directory.lastActivityAt)}
                  </Pill>
                </div>
              </OpsPanelCard>
            ))
          ) : (
            <OpsEmptyState className="rounded-lg">
              No workspace currently has an open reconciliation issue.
            </OpsEmptyState>
          )}
        </div>
        <div className="mt-4">
          {reconciliationWorkspaces.length ? (
            reconciliationWorkspaces.map((workspace, index) => (
              <OpsFleetWorkspaceCard
                busyKey={busyKey}
                key={workspace.workspace.id}
                onRunReconciliation={(selectedWorkspace) => {
                  void runAction({
                    busyKey: `reconcile:${selectedWorkspace.workspace.id}`,
                    request: async () => {
                      const response = await fetch(
                        `/api/ops/fleet/workspaces/${encodeURIComponent(
                          selectedWorkspace.workspace.id
                        )}/reconciliation/run`,
                        {
                          method: "POST"
                        }
                      );

                      await parseJsonResponse({
                        response,
                        schema: opsReconciliationRunResponseSchema
                      });
                    },
                    successMessage: `Reconciliation started for ${selectedWorkspace.workspace.name}.`
                  });
                }}
                pressureScore={getWorkspacePressureScore(workspace)}
                rank={index + 1}
                workspace={workspace}
              />
            ))
          ) : (
            <OpsEmptyState className="rounded-lg">
              No workspace currently has an open reconciliation issue.
            </OpsEmptyState>
          )}
        </div>
      </SurfaceCard>
      <SurfaceCard
        body="This board keeps the whole estate visible with compact comparisons instead of repeating the same summary card for every workspace."
        eyebrow="Fleet board"
        span={12}
        title="Comparative workspace map"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[860px] rounded-xl border border-[color:var(--color-line)] overflow-hidden">
            <div className="grid grid-cols-[2fr,0.85fr,0.85fr,1fr,0.95fr,1fr,1fr,0.95fr] items-center gap-4 border-b border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-muted)]">
              <span>Workspace</span>
              <span>Pressure</span>
              <span>Alerts</span>
              <span>Reconciliation</span>
              <span>Commerce</span>
              <span>Publications</span>
              <span>Last activity</span>
              <span>Actions</span>
            </div>
            {rankedWorkspaces.map((workspace, index) => {
              const score = getWorkspacePressureScore(workspace);
              const reconciliationBusyKey = `reconcile:${workspace.workspace.id}`;
              const workspaceIsActive = workspace.workspace.status === "active";

              return (
                <div
                  className={cn(
                    "grid grid-cols-[2fr,0.85fr,0.85fr,1fr,0.95fr,1fr,1fr,0.95fr] items-center gap-4 border-b border-[color:var(--color-line)] px-4 py-3 text-sm last:border-b-0",
                    workspace.directory.current
                      ? "bg-[color:var(--color-surface-strong)]"
                      : "bg-transparent"
                  )}
                  key={workspace.workspace.id}
                >
                  <div className="space-y-1">
                    <strong>
                      {index + 1}. {workspace.workspace.name}
                    </strong>
                    <span>
                      /{workspace.workspace.slug} · {workspace.workspace.role} ·{" "}
                      {formatWorkspaceStatus(workspace.workspace.status)}
                      {workspace.directory.current ? " · current" : ""}
                    </span>
                    <span className="text-xs text-[color:var(--color-muted)]">
                      {workspace.directory.brandCount} brands
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Pressure
                    </span>
                    <strong>{score}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Alerts
                    </span>
                    <span>{workspace.ops.criticalAlertCount} critical</span>
                    <span>{workspace.ops.warningAlertCount} warning</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Reconciliation
                    </span>
                    <span>
                      {workspace.ops.openReconciliationIssueCount} open
                    </span>
                    <span>
                      {workspace.commerce.automationFailedCheckoutCount} failed
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Commerce
                    </span>
                    <span>{workspace.commerce.openCheckoutCount} open</span>
                    <span>
                      {workspace.commerce.unfulfilledCheckoutCount} unfulfilled
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Publications
                    </span>
                    <span>
                      {workspace.publications.livePublicationCount} live
                    </span>
                    <span>
                      {workspace.publications.totalPublicationCount} total
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      Last activity
                    </span>
                    <strong>
                      {formatTimestamp(workspace.directory.lastActivityAt)}
                    </strong>
                  </div>
                  <div className="flex justify-end">
                    <ActionButton
                      disabled={
                        !workspaceIsActive || busyKey === reconciliationBusyKey
                      }
                      onClick={() => {
                        void runAction({
                          busyKey: reconciliationBusyKey,
                          request: async () => {
                            const response = await fetch(
                              `/api/ops/fleet/workspaces/${encodeURIComponent(
                                workspace.workspace.id
                              )}/reconciliation/run`,
                              {
                                method: "POST"
                              }
                            );

                            await parseJsonResponse({
                              response,
                              schema: opsReconciliationRunResponseSchema
                            });
                          },
                          successMessage: `Reconciliation started for ${workspace.workspace.name}.`
                        });
                      }}
                      tone="secondary"
                      type="button"
                    >
                      {!workspaceIsActive
                        ? "Workspace inactive"
                        : busyKey === reconciliationBusyKey
                          ? "Running…"
                          : "Run"}
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SurfaceCard>
    </SurfaceGrid>
  );
}
