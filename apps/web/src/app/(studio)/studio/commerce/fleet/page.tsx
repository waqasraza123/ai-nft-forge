import {
  MetricTile,
  ActionRow,
  ActionLink,
  EmptyState,
  PageShell,
  RecordCard,
  RecordCopy,
  RecordList,
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
          <ActionRow compact>
            <Pill>{report.report.scopeLabel}</Pill>
            <Pill>{report.report.generatedAt}</Pill>
          </ActionRow>
        </SurfaceCard>
        <SurfaceCard
          body="Workspace rows are grouped for fleet visibility so operators can assess cross-workspace rollout health at a glance without leaving this selected workspace context."
          eyebrow="Workspace rollups"
          span={12}
          title="Cross-workspace commerce status"
        >
          {report.report.workspaces.length ? (
            <RecordList className="mt-3">
              {report.report.workspaces.map((workspace) => (
                <RecordCard key={workspace.workspace.id}>
                  <RecordCopy>
                    <strong>
                      {workspace.workspace.name} · /{workspace.workspace.slug}
                    </strong>
                    <span>
                      {workspace.workspace.role} · {workspace.workspace.status}
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
                      Last activity {formatTimestamp(workspace.lastActivityAt)}
                    </span>
                  </RecordCopy>
                </RecordCard>
              ))}
            </RecordList>
          ) : (
            <EmptyState className="mt-3">
              No accessible workspaces are available for fleet commerce
              reporting.
            </EmptyState>
          )}
        </SurfaceCard>
      </SurfaceGrid>
    </PageShell>
  );
}
