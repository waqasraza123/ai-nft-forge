import { ActionLink, PageShell } from "@ai-nft-forge/ui";

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
          <ActionLink href="/ops" tone="action">
            Runtime overview
          </ActionLink>
          <ActionLink href="/ops/audit" tone="action">
            Audit activity
          </ActionLink>
          <ActionLink href="/studio/commerce/fleet" tone="action">
            Commerce fleet
          </ActionLink>
          <ActionLink href="/" tone="inline">
            Back to marketing
          </ActionLink>
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
