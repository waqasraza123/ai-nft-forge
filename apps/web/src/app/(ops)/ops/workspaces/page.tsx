import { ActionLink, SurfaceCard } from "@ai-nft-forge/ui";

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
    <section className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
        <div className="flex flex-wrap justify-between gap-3">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
              Ops
            </span>
            <h1 className="text-3xl font-semibold font-[var(--font-display)]">
              Review the accessible workspace estate
            </h1>
            <p className="max-w-4xl text-sm leading-7 text-[color:var(--color-muted)]">
              This route keeps workspace-wide operator context visible without
              flattening distinct workspaces into one dataset. Counts here come
              only from workspace-native settings, members, invitations,
              escalations, and audit records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionLink href="/ops/audit">Audit activity</ActionLink>
            <ActionLink href="/ops/retention">Retention review</ActionLink>
            <ActionLink href="/ops">Runtime overview</ActionLink>
            <ActionLink href="/" tone="inline">
              Back to marketing
            </ActionLink>
          </div>
        </div>
      </section>

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
          entries={workspaceDirectory.workspaces.filter((entry) => entry.current)}
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
          currentWorkspaceSlug={runtime.operator.access?.workspace?.slug ?? null}
          workspaces={runtime.operator.access?.availableWorkspaces ?? []}
        />
      </SurfaceCard>
    </section>
  );
}
