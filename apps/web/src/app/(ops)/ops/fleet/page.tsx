import Link from "next/link";

import { PageShell } from "@ai-nft-forge/ui";

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
      title="Fleet triage workspace"
      lead="Compare alert concentration, reconciliation pressure, and checkout risk across the accessible estate before drilling into a single workspace."
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
      <OpsFleetClient
        currentWorkspaceSlug={access.workspace?.slug ?? null}
        initialFleet={fleet.fleet}
        workspaces={access.availableWorkspaces}
      />
    </PageShell>
  );
}
