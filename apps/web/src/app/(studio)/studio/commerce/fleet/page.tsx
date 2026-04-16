import Link from "next/link";

import {
  MetricTile,
  ActionLink,
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
          <ActionLink href="/studio/commerce" tone="action">
            Current workspace commerce
          </ActionLink>
          <ActionLink
            href="/api/studio/commerce/fleet/report?format=csv"
            tone="action"
          >
            Export CSV
          </ActionLink>
          <ActionLink href="/api/studio/commerce/fleet/report" tone="action">
            JSON snapshot
          </ActionLink>
          <ActionLink href="/studio" tone="inline">
            Back to studio
          </ActionLink>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="flex flex-wrap gap-2">
            <Pill>{report.report.scopeLabel}</Pill>
            <Pill>{report.report.generatedAt}</Pill>
          </div>
        </SurfaceCard>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 md:col-span-12">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
              Workspace rollups
            </p>
            <h2 className="text-xl font-semibold">
              Cross-workspace commerce status
            </h2>
          </div>
            <div className="mt-3 space-y-2">
              {report.report.workspaces.length ? (
                report.report.workspaces.map((workspace) => (
                  <div
                    className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3"
                    key={workspace.workspace.id}
                  >
                    <div className="grid gap-1 text-sm text-[color:var(--color-muted)]">
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
                <div className="rounded-xl border border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-4 text-sm text-[color:var(--color-muted)]">
                  No accessible workspaces are available for fleet commerce
                  reporting.
                </div>
              )}
            </div>
        </div>
      </SurfaceGrid>
    </PageShell>
  );
}
