"use client";

import type { WorkspaceFleetWorkspaceSummary } from "@ai-nft-forge/shared";
import { ActionButton, OpsPanelCard, Pill } from "@ai-nft-forge/ui";

type OpsFleetWorkspaceCardProps = {
  busyKey: string | null;
  canRunReconciliation: boolean;
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

function getScoreTextClass(tone: "critical" | "warning" | "healthy") {
  if (tone === "critical") {
    return "text-rose-300";
  }

  if (tone === "warning") {
    return "text-amber-200";
  }

  return "text-emerald-200";
}

export function OpsFleetWorkspaceCard({
  busyKey,
  canRunReconciliation,
  onRunReconciliation,
  pressureScore,
  rank,
  workspace
}: OpsFleetWorkspaceCardProps) {
  const workspaceIsActive = workspace.workspace.status === "active";
  const reconciliationBusyKey = `reconcile:${workspace.workspace.id}`;
  const tone = resolvePressureTone(pressureScore, workspace);

  return (
    <OpsPanelCard tone={tone} className="space-y-3 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
              Rank {rank}
            </span>
            <strong className="text-base font-semibold">
              {workspace.workspace.name}
            </strong>
            <p className="text-sm text-[color:var(--color-muted)]">
              /{workspace.workspace.slug} · {workspace.workspace.role} ·{" "}
              {formatWorkspaceStatus(workspace.workspace.status)}
            </p>
            <p className="text-sm text-[color:var(--color-muted)]">
              {workspace.directory.brandCount} brands · last activity{" "}
              {formatTimestamp(workspace.directory.lastActivityAt)}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-center">
            <p className="text-xs text-[color:var(--color-muted)]">Pressure</p>
            <p className={`text-lg font-semibold ${getScoreTextClass(tone)}`}>
              {pressureScore}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace.directory.current ? <Pill>Current selection</Pill> : null}
          <Pill>{workspace.ops.criticalAlertCount} critical</Pill>
          <Pill>{workspace.ops.openReconciliationIssueCount} recon</Pill>
          <Pill>{workspace.commerce.openCheckoutCount} open checkouts</Pill>
          <Pill>{workspace.commerce.unfulfilledCheckoutCount} unfulfilled</Pill>
        </div>
        <div className="space-y-2 border-t border-[color:var(--color-line)] pt-3">
          <div className="flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
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
          <ActionButton
            disabled={
              !canRunReconciliation ||
              !workspaceIsActive ||
              busyKey === reconciliationBusyKey
            }
            onClick={() => {
              onRunReconciliation(workspace);
            }}
            tone="secondary"
            type="button"
          >
            {!canRunReconciliation
              ? "Viewer read-only"
              : !workspaceIsActive
                ? "Workspace inactive"
                : busyKey === reconciliationBusyKey
                  ? "Running…"
                  : "Run reconciliation"}
          </ActionButton>
        </div>
      </div>
    </OpsPanelCard>
  );
}
