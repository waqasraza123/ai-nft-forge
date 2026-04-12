import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import { OpsAuditClient } from "./ops-audit-client";
import { createRuntimeOpsAuditService } from "../../../../server/ops/audit-runtime";
import { getCurrentStudioAccess } from "../../../../server/studio/access";

export default async function OpsAuditPage() {
  const access = await getCurrentStudioAccess();
  const initialAudit =
    access?.workspace?.id && access.session.user.id
      ? await createRuntimeOpsAuditService().getWorkspaceAudit({
          workspaceId: access.workspace.id
        })
      : null;

  return (
    <PageShell
      eyebrow="Ops Audit"
      title="Workspace activity audit and export"
      lead="The ops audit surface now exposes durable workspace activity as a filterable operational timeline instead of limiting audit review to the short settings history widget."
      actions={
        <>
          <Link className="action-link" href="/ops">
            Open ops
          </Link>
          <Link className="action-link" href="/studio/settings">
            Open settings
          </Link>
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="ops"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Audit review now lives on a dedicated ops route with server-side filtering and CSV export for workspace membership, invitation, and ownership-transfer activity."
          eyebrow="Audit"
          span={8}
          title="Workspace audit trail"
        >
          <div className="pill-row">
            <Pill>{access?.workspace?.slug ?? "Session required"}</Pill>
            <Pill>{access?.role ?? "unauthenticated"}</Pill>
            <Pill>
              {initialAudit?.audit.entries.length ?? 0} current entries
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Use the same authenticated workspace selection here to move between accessible audit streams without changing query semantics or mixing rows across workspaces."
          eyebrow="Workspace"
          span={4}
          title="Audit workspace scope"
        >
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={access?.workspace?.slug ?? null}
            workspaces={access?.availableWorkspaces ?? []}
          />
        </SurfaceCard>
      </SurfaceGrid>
      <OpsAuditClient
        initialAudit={initialAudit}
        workspaceSlug={access?.workspace?.slug ?? null}
      />
    </PageShell>
  );
}
