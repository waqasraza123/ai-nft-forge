import {
  ActionLink,
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
