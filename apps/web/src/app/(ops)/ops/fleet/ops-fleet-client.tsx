"use client";

import {
  opsAlertAcknowledgeResponseSchema,
  opsAlertMuteResponseSchema,
  opsReconciliationRunResponseSchema,
  workspaceFleetOverviewResponseSchema,
  type WorkspaceFleetOverviewResponse
} from "@ai-nft-forge/shared";
import { MetricTile, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";
import { useRouter } from "next/navigation";
import { startTransition, useEffectEvent, useState } from "react";

type OpsFleetClientProps = {
  initialFleet: WorkspaceFleetOverviewResponse["fleet"];
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

function formatWorkspaceStatus(
  status: "active" | "archived" | "suspended"
) {
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

export function OpsFleetClient({ initialFleet }: OpsFleetClientProps) {
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

  return (
    <SurfaceGrid>
      <SurfaceCard
        body="Fleet review keeps the selected workspace runtime isolated while exposing cross-workspace backlog and alert pressure explicitly."
        eyebrow="Fleet summary"
        span={12}
        title="Workspace health overview"
      >
        <div className="metric-row">
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
            label="Open reconciliation"
            value={fleet.summary.openReconciliationIssueCount.toString()}
          />
          <MetricTile
            label="Open checkouts"
            value={fleet.summary.openCheckoutCount.toString()}
          />
          <MetricTile
            label="Unfulfilled"
            value={fleet.summary.unfulfilledCheckoutCount.toString()}
          />
        </div>
        <div className="pill-row">
          <Pill>{fleet.summary.activeWorkspaceCount} active</Pill>
          <Pill>{fleet.summary.archivedWorkspaceCount} archived</Pill>
          <Pill>{formatTimestamp(fleet.summary.generatedAt)}</Pill>
          <button
            className="button-action button-action--secondary"
            disabled={isRefreshing}
            onClick={() => {
              void refreshFleet();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh fleet"}
          </button>
        </div>
        {notice ? (
          <div
            className={`status-banner ${
              notice.tone === "error"
                ? "status-banner--error"
                : notice.tone === "success"
                  ? "status-banner--success"
                  : ""
            }`}
          >
            <strong>
              {notice.tone === "error"
                ? "Fleet error"
                : notice.tone === "success"
                  ? "Fleet updated"
                  : "Working"}
            </strong>
            <span>{notice.message}</span>
          </div>
        ) : null}
      </SurfaceCard>
      <div className="surface-card surface-card--span-12">
        <div className="surface-card__content">
          <div className="surface-card__header">
            <p className="surface-card__eyebrow">Workspaces</p>
            <h2 className="surface-card__title">Per-workspace backlog</h2>
          </div>
          <div className="collection-item-list">
            {fleet.workspaces.map((workspace) => {
              const reconciliationBusyKey = `reconcile:${workspace.workspace.id}`;
              const workspaceIsActive = workspace.workspace.status === "active";

              return (
                <div
                  className="collection-item-card"
                  key={workspace.workspace.id}
                >
                  <div className="collection-item-card__copy">
                    <strong>
                      {workspace.workspace.name} · /{workspace.workspace.slug}
                    </strong>
                    <span>
                      {workspace.workspace.role} ·{" "}
                      {formatWorkspaceStatus(workspace.workspace.status)}
                      {workspace.directory.current
                        ? " · current selection"
                        : ""}
                    </span>
                    <span>
                      {workspace.ops.criticalAlertCount} critical alerts ·{" "}
                      {workspace.ops.warningAlertCount} warning alerts ·{" "}
                      {workspace.ops.openReconciliationIssueCount} open
                      reconciliation issues
                    </span>
                    <span>
                      {workspace.commerce.openCheckoutCount} open checkouts ·{" "}
                      {workspace.commerce.unfulfilledCheckoutCount} unfulfilled
                      · {workspace.publications.livePublicationCount} live
                      publications
                    </span>
                    <span>
                      Last activity{" "}
                      {formatTimestamp(workspace.directory.lastActivityAt)}
                    </span>
                  </div>
                  <div className="studio-action-row">
                    <button
                      className="button-action button-action--secondary"
                      disabled={
                        !workspaceIsActive ||
                        busyKey === reconciliationBusyKey
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
                      type="button"
                    >
                      {!workspaceIsActive
                        ? "Workspace inactive"
                        : busyKey === reconciliationBusyKey
                        ? "Running…"
                        : "Run reconciliation"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="surface-card surface-card--span-12">
        <div className="surface-card__content">
          <div className="surface-card__header">
            <p className="surface-card__eyebrow">Alert queue</p>
            <h2 className="surface-card__title">
              Cross-workspace alert triage
            </h2>
          </div>
          <div className="collection-item-list">
            {fleet.alertQueue.length ? (
              fleet.alertQueue.map((alert) => {
                const acknowledgeBusyKey = `ack:${alert.alertStateId}`;
                const muteBusyKey = `mute:${alert.alertStateId}`;
                const workspaceIsActive = alert.workspace.status === "active";

                return (
                  <div
                    className="collection-item-card"
                    key={alert.alertStateId}
                  >
                    <div className="collection-item-card__copy">
                      <strong>
                        {alert.title} · {alert.workspace.name}
                      </strong>
                      <span>
                        {alert.severity} · {alert.code} · /
                        {alert.workspace.slug} ·{" "}
                        {formatWorkspaceStatus(alert.workspace.status)}
                      </span>
                      <span>{alert.message}</span>
                      <span>
                        First seen {formatTimestamp(alert.firstObservedAt)} ·
                        last seen {formatTimestamp(alert.lastObservedAt)}
                      </span>
                    </div>
                    <div className="studio-action-row">
                      <button
                        className="button-action button-action--secondary"
                        disabled={
                          !workspaceIsActive ||
                          busyKey === acknowledgeBusyKey
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
                      </button>
                      <button
                        className="button-action button-action--secondary"
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
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="collection-empty-state">
                No active alerts are queued across the accessible workspace
                fleet.
              </div>
            )}
          </div>
        </div>
      </div>
    </SurfaceGrid>
  );
}
