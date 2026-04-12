import Link from "next/link";

import { PageShell, SurfaceGrid } from "@ai-nft-forge/ui";

import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { getCurrentStudioAccess } from "../../../../server/studio/access";
import { createRuntimeWorkspaceFleetService } from "../../../../server/workspaces/fleet-service";

import { OpsFleetClient } from "./ops-fleet-client";

export default async function OpsFleetPage() {
  const access = await getCurrentStudioAccess();

  if (!access) {
    return null;
  }

  const fleet =
    await createRuntimeWorkspaceFleetService().getAccessibleWorkspaceFleet({
      currentWorkspaceId: access.workspace?.id ?? null,
      workspaces: access.availableWorkspaces
    });

  return (
    <PageShell
      eyebrow="Ops Fleet"
      title="Triages alerts and runtime risk across accessible workspaces"
      lead="This route separates fleet review from the selected-workspace runtime dashboard so alert queues, reconciliation backlog, and workspace health stay explicit at the workspace boundary."
      actions={
        <>
          <Link className="action-link" href="/ops">
            Runtime overview
          </Link>
          <Link className="action-link" href="/ops/audit">
            Audit activity
          </Link>
          <Link className="action-link" href="/studio/commerce/fleet">
            Commerce fleet
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
              Fleet review stays aggregate, but the shared selector still drives
              the rest of the studio and ops surfaces.
            </p>
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={access.workspace?.slug ?? null}
              workspaces={access.availableWorkspaces}
            />
          </div>
        </div>
      </SurfaceGrid>
      <OpsFleetClient initialFleet={fleet.fleet} />
    </PageShell>
  );
}
