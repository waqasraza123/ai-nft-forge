import Link from "next/link";

import { PageShell, SurfaceGrid } from "@ai-nft-forge/ui";

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
          <Link className="action-link" href="/ops">
            Runtime overview
          </Link>
          <Link className="action-link" href="/ops/fleet">
            Fleet triage
          </Link>
          <Link className="action-link" href="/ops/workspaces">
            Workspace directory
          </Link>
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="ops"
    >
      <SurfaceGrid>
        <div className="surface-card surface-card--span-12">
          <div className="surface-card__content">
            <div className="surface-card__header">
              <p className="surface-card__eyebrow">Workspace scope</p>
              <h2 className="surface-card__title">
                Active workspace selection
              </h2>
            </div>
            <p className="surface-card__body-copy">
              Retention review is fleet-wide, but the shared selector still
              drives the rest of the studio and ops surfaces.
            </p>
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={access.workspace?.slug ?? null}
              workspaces={access.availableWorkspaces}
            />
          </div>
        </div>
      </SurfaceGrid>
      <OpsRetentionClient initialReport={report.report} />
    </PageShell>
  );
}
