import { OpsQuickActions, PageShell, SurfaceCard } from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../../components/workspace-directory-panel";
import { WorkspaceOffboardingPanel } from "../../../../components/workspace-offboarding-panel";
import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { loadOpsRuntime } from "../../../../server/ops/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../../server/workspaces/directory-service";
import { createRuntimeWorkspaceOffboardingService } from "../../../../server/workspaces/offboarding-service";

export default async function OpsWorkspacesPage() {
  const runtime = await loadOpsRuntime();
  const workspaceDirectory = runtime.operator.access
    ? await createRuntimeWorkspaceDirectoryService().listAccessibleWorkspaceDirectory(
        {
          currentWorkspaceId: runtime.operator.access.workspace?.id ?? null,
          workspaces: runtime.operator.access.availableWorkspaces
        }
      )
    : {
        workspaces: []
      };
  const offboardingOverview = runtime.operator.access
    ? await createRuntimeWorkspaceOffboardingService().getAccessibleWorkspaceOffboardingOverview(
        {
          currentWorkspaceId: runtime.operator.access.workspace?.id ?? null,
          workspaces: runtime.operator.access.availableWorkspaces
        }
      )
    : {
        overview: {
          generatedAt: new Date(0).toISOString(),
          summary: {
            blockedWorkspaceCount: 0,
            reasonRequiredWorkspaceCount: 0,
            readyWorkspaceCount: 0,
            reviewRequiredWorkspaceCount: 0,
            scheduledDecommissionCount: 0,
            totalWorkspaceCount: 0
          },
          workspaces: []
        }
      };

  return (
    <PageShell
      eyebrow="Ops"
      title="Review the accessible workspace estate"
      lead="This route keeps workspace-wide operator context visible without flattening distinct workspaces into one dataset. Counts here come only from workspace-native settings, members, invitations, escalations, and audit records."
      actions={
        <OpsQuickActions
          actions={[
            { href: "/ops/audit", label: "Audit activity" },
            { href: "/ops/retention", label: "Retention review" },
            { href: "/ops", label: "Runtime overview" },
            { href: "/", label: "Back to marketing", tone: "inline" }
          ]}
        />
      }
      tone="ops"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <WorkspaceDirectoryPanel
          body="Switching still keeps one active workspace at a time, but this directory makes the current accessible estate auditable before you pivot between owner and operator contexts."
          entries={workspaceDirectory.workspaces}
          eyebrow="Workspace directory"
          span={6}
          title="Accessible workspaces"
        />
        <WorkspaceDirectoryPanel
          body="Use the shared switcher to move the live studio and ops context after reviewing the current accessible workspace estate."
          entries={workspaceDirectory.workspaces.filter(
            (entry) => entry.current
          )}
          eyebrow="Selection"
          span={6}
          title="Current workspace"
        />
        <WorkspaceOffboardingPanel
          body="Archive-readiness combines workspace-native signals with workspace-scoped commerce and ops blockers so offboarding review does not depend on manual cross-page inspection."
          entries={offboardingOverview.overview.workspaces}
          eyebrow="Offboarding"
          span={12}
          title="Archive readiness and export"
        />
      </div>

      <SurfaceCard
        body="The active workspace cookie still drives the rest of the ops and studio routes. Use this control after reviewing the current accessible estate above."
        eyebrow="Workspace scope"
        span={12}
        title="Switch active workspace"
      >
        <WorkspaceScopeSwitcher
          currentWorkspaceSlug={
            runtime.operator.access?.workspace?.slug ?? null
          }
          workspaces={runtime.operator.access?.availableWorkspaces ?? []}
        />
      </SurfaceCard>
    </PageShell>
  );
}
