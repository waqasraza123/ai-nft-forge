import { ActionLink, PageShell, SurfaceGrid } from "@ai-nft-forge/ui";

import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeWorkspaceRetentionService } from "../../../../server/workspaces/retention-service";

import { OpsRetentionClient } from "./ops-retention-client";

export default async function OpsRetentionPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const report =
    await createRuntimeWorkspaceRetentionService().getAccessibleWorkspaceRetentionReport(
      {
        currentWorkspaceId: access.workspace?.id ?? null,
        workspaces: access.availableWorkspaces
      }
    );

  return (
    <PageShell
      eyebrow="Ops Retention"
      title="Reviews offboarding and retained cleanup across accessible workspaces"
      lead="This route separates retention and decommission oversight from the live runtime and fleet triage pages so archive blockers, scheduled cleanup windows, and final operator-safe cancellation stay explicit."
      actions={
        <>
          <ActionLink href="/ops" tone="action">
            Runtime overview
          </ActionLink>
          <ActionLink href="/ops/fleet" tone="action">
            Fleet triage
          </ActionLink>
          <ActionLink href="/ops/workspaces" tone="action">
            Workspace directory
          </ActionLink>
          <ActionLink href="/" tone="inline">
            Back to marketing
          </ActionLink>
        </>
      }
      tone="ops"
    >
      <SurfaceGrid>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 md:col-span-12">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
              Workspace scope
            </p>
            <h2 className="text-xl font-semibold">Active workspace selection</h2>
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Retention review is fleet-wide, but the shared selector still
            drives the rest of the studio and ops surfaces.
          </p>
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={access.workspace?.slug ?? null}
            workspaces={access.availableWorkspaces}
          />
        </div>
      </SurfaceGrid>
      <OpsRetentionClient initialReport={report.report} />
    </PageShell>
  );
}
