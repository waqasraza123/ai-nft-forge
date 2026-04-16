"use client";

import type { WorkspaceFleetWorkspaceSummary } from "@ai-nft-forge/shared";
import { Pill } from "@ai-nft-forge/ui";

type OpsFleetWorkspaceCardProps = {
  busyKey: string | null;
  onRunReconciliation: (workspace: WorkspaceFleetWorkspaceSummary) => void;
  pressureScore: number;
  rank: number;
  workspace: WorkspaceFleetWorkspaceSummary;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No activity recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatWorkspaceStatus(status: "active" | "archived" | "suspended") {
  return status.replaceAll("_", " ");
}

function resolvePressureTone(
  pressureScore: number,
  workspace: WorkspaceFleetWorkspaceSummary
) {
  if (
    workspace.ops.criticalAlertCount > 0 ||
    workspace.ops.openReconciliationIssueCount > 0
  ) {
    return "critical";
  }

  if (pressureScore > 0) {
    return "warning";
  }

  return "healthy";
}

export function OpsFleetWorkspaceCard({
  busyKey,
  onRunReconciliation,
  pressureScore,
  rank,
  workspace
}: OpsFleetWorkspaceCardProps) {
  const workspaceIsActive = workspace.workspace.status === "active";
  const reconciliationBusyKey = `reconcile:${workspace.workspace.id}`;
  const tone = resolvePressureTone(pressureScore, workspace);

  return (
    <article
      className={`ops-fleet-workspace-card ops-fleet-workspace-card--${tone}`}
    >
      <div className="ops-fleet-workspace-card__header">
        <div className="ops-fleet-workspace-card__copy">
          <span className="ops-fleet-workspace-card__rank">Rank {rank}</span>
          <strong className="ops-fleet-workspace-card__title">
            {workspace.workspace.name}
          </strong>
          <span className="ops-fleet-workspace-card__meta">
            /{workspace.workspace.slug} · {workspace.workspace.role} ·{" "}
            {formatWorkspaceStatus(workspace.workspace.status)}
          </span>
          <span className="ops-fleet-workspace-card__meta">
            {workspace.directory.brandCount} brands · last activity{" "}
            {formatTimestamp(workspace.directory.lastActivityAt)}
          </span>
        </div>
        <div className="ops-fleet-workspace-card__score">
          <span className="ops-fleet-workspace-card__score-label">
            Pressure
          </span>
          <strong className="ops-fleet-workspace-card__score-value">
            {pressureScore}
          </strong>
        </div>
      </div>
      <div className="pill-row ops-fleet-workspace-card__pills">
        {workspace.directory.current ? <Pill>Current selection</Pill> : null}
        <Pill>{workspace.ops.criticalAlertCount} critical</Pill>
        <Pill>{workspace.ops.openReconciliationIssueCount} recon</Pill>
        <Pill>{workspace.commerce.openCheckoutCount} open checkouts</Pill>
        <Pill>{workspace.commerce.unfulfilledCheckoutCount} unfulfilled</Pill>
      </div>
      <div className="ops-fleet-workspace-card__footer">
        <div className="ops-fleet-workspace-card__summary">
          <span>
            {workspace.ops.activeAlertCount} active alerts ·{" "}
            {workspace.ops.warningAlertCount} warnings
          </span>
          <span>
            {workspace.commerce.automationFailedCheckoutCount} automation
            failures · {workspace.publications.livePublicationCount} live
            publications
          </span>
        </div>
        <div className="studio-action-row">
          <button
            className="button-action button-action--secondary"
            disabled={!workspaceIsActive || busyKey === reconciliationBusyKey}
            onClick={() => {
              onRunReconciliation(workspace);
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
    </article>
  );
}
