import Link from "next/link";

import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { getCurrentStudioAccess } from "../../../../../server/studio/access";
import { createRuntimeWorkspaceFleetService } from "../../../../../server/workspaces/fleet-service";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No activity";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function StudioCommerceFleetPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const report =
    await createRuntimeWorkspaceFleetService().getAccessibleCommerceFleetReport(
      {
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      }
    );

  return (
    <PageShell
      eyebrow="Commerce Fleet"
      title="Review commerce health across accessible workspaces"
      lead="This view keeps commerce rollups explicit at the workspace layer instead of silently flattening multiple stores into the selected workspace dashboard."
      actions={
        <>
          <Link className="action-link" href="/studio/commerce">
            Current workspace commerce
          </Link>
          <a
            className="action-link"
            href="/api/studio/commerce/fleet/report?format=csv"
          >
            Export CSV
          </a>
          <a className="action-link" href="/api/studio/commerce/fleet/report">
            JSON snapshot
          </a>
          <Link className="inline-link" href="/studio">
            Back to studio
          </Link>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Fleet commerce rollups stay separate from the selected workspace dashboard, so exports and status review cannot drift into the wrong store boundary."
          eyebrow="Scope"
          span={12}
          title="Accessible workspace commerce fleet"
        >
          <div className="metric-row">
            <MetricTile
              label="Workspaces"
              value={report.report.summary.totalWorkspaceCount.toString()}
            />
            <MetricTile
              label="Open checkouts"
              value={report.report.summary.openCheckoutCount.toString()}
            />
            <MetricTile
              label="Completed"
              value={report.report.summary.completedCheckoutCount.toString()}
            />
            <MetricTile
              label="Unfulfilled"
              value={report.report.summary.unfulfilledCheckoutCount.toString()}
            />
          </div>
          <div className="pill-row">
            <Pill>{report.report.scopeLabel}</Pill>
            <Pill>{report.report.generatedAt}</Pill>
          </div>
        </SurfaceCard>
        <div className="surface-card surface-card--span-12">
          <div className="surface-card__content">
            <div className="surface-card__header">
              <p className="surface-card__eyebrow">Workspace rollups</p>
              <h2 className="surface-card__title">
                Cross-workspace commerce status
              </h2>
            </div>
            <div className="collection-item-list">
              {report.report.workspaces.length ? (
                report.report.workspaces.map((workspace) => (
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
                        {workspace.workspace.status}
                        {workspace.current ? " · current selection" : ""}
                      </span>
                      <span>
                        {workspace.brandCount} brands ·{" "}
                        {workspace.livePublicationCount} live publications
                      </span>
                      <span>
                        {workspace.openCheckoutCount} open ·{" "}
                        {workspace.completedCheckoutCount} completed ·{" "}
                        {workspace.unfulfilledCheckoutCount} unfulfilled ·{" "}
                        {workspace.automationFailedCheckoutCount} automation
                        failed
                      </span>
                      <span>
                        Last activity{" "}
                        {formatTimestamp(workspace.lastActivityAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="collection-empty-state">
                  No accessible workspaces are available for fleet commerce
                  reporting.
                </div>
              )}
            </div>
          </div>
        </div>
      </SurfaceGrid>
    </PageShell>
  );
}
