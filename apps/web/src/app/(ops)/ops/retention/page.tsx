import {
  OpsQuickActions,
  PageShell,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

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
        <OpsQuickActions
          actions={[
            { href: "/ops", label: "Runtime overview" },
            { href: "/ops/fleet", label: "Fleet triage" },
            { href: "/ops/workspaces", label: "Workspace directory" },
            { href: "/", label: "Back to marketing", tone: "inline" }
          ]}
        />
      }
      tone="ops"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Retention review is fleet-wide, but the shared selector still drives the rest of the studio and ops surfaces."
          eyebrow="Workspace scope"
          span={12}
          title="Active workspace selection"
          className="p-4"
        >
          <div className="mt-4">
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={access.workspace?.slug ?? null}
              workspaces={access.availableWorkspaces}
            />
          </div>
        </SurfaceCard>
      </SurfaceGrid>
      <OpsRetentionClient initialReport={report.report} />
    </PageShell>
  );
}
