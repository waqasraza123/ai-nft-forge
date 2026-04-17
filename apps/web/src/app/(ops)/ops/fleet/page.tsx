import { OpsQuickActions, PageShell } from "@ai-nft-forge/ui";

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
        <OpsQuickActions
          actions={[
            { href: "/ops", label: "Runtime overview" },
            { href: "/ops/audit", label: "Audit activity" },
            { href: "/studio/commerce/fleet", label: "Commerce fleet" },
            { href: "/", label: "Back to marketing", tone: "inline" }
          ]}
        />
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
