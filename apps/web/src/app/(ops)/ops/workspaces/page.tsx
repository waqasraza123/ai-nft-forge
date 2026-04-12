import Link from "next/link";

import { PageShell, SurfaceGrid } from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../../components/workspace-directory-panel";
import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { loadOpsRuntime } from "../../../../server/ops/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../../server/workspaces/directory-service";

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

  return (
    <PageShell
      eyebrow="Ops"
      title="Review the accessible workspace estate"
      lead="This route keeps workspace-wide operator context visible without flattening distinct workspaces into one dataset. Counts here come only from workspace-native settings, member, invitation, escalation, and audit records."
      actions={
        <>
          <Link className="action-link" href="/ops/audit">
            Audit activity
          </Link>
          <Link className="action-link" href="/ops">
            Runtime overview
          </Link>
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="ops"
    >
      <SurfaceGrid>
        <WorkspaceDirectoryPanel
          body="Switching still keeps one active workspace at a time, but this directory makes the current accessible estate auditable before you pivot between owner and operator contexts."
          entries={workspaceDirectory.workspaces}
          eyebrow="Workspace directory"
          span={8}
          title="Accessible workspaces"
        />
        <WorkspaceDirectoryPanel
          body="Use the shared switcher to move the live studio and ops context after reviewing the accessible workspace estate."
          entries={workspaceDirectory.workspaces.filter((entry) => entry.current)}
          eyebrow="Selection"
          span={4}
          title="Current workspace"
        />
        <div className="surface-card surface-card--span-12">
          <div className="surface-card__content">
            <div className="surface-card__header">
              <p className="surface-card__eyebrow">Workspace scope</p>
              <h2 className="surface-card__title">Switch active workspace</h2>
            </div>
            <p className="surface-card__body-copy">
              The active workspace cookie still drives the rest of the ops and
              studio routes. Use this control after reviewing the current
              accessible estate above.
            </p>
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={
                runtime.operator.access?.workspace?.slug ?? null
              }
              workspaces={runtime.operator.access?.availableWorkspaces ?? []}
            />
          </div>
        </div>
      </SurfaceGrid>
    </PageShell>
  );
}
