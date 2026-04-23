import {
  SurfacePanel,
  OpsQuickActions,
  OpsPillRow,
  PageShell,
  Pill,
  SurfaceCard
} from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../components/workspace-directory-panel";
import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
import { loadOpsRuntime } from "../../../server/ops/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../server/workspaces/directory-service";

import { OpsOperatorPanel } from "./ops-operator-panel";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function opsActions(runtimeBackendHealthUrl: string | null) {
  const actions: Array<{
    href: string;
    label: string;
    tone?: "action" | "inline" | "muted";
    rel?: string;
    target?: string;
  } | null> = [
    { href: "/ops/audit", label: "Audit" },
    { href: "/ops/fleet", label: "Fleet" },
    { href: "/ops/retention", label: "Retention" },
    { href: "/ops/workspaces", label: "Directory" },
    { href: "/api/health", label: "Web health" },
    runtimeBackendHealthUrl
      ? {
          href: runtimeBackendHealthUrl,
          label: "Backend health",
          tone: "inline",
          rel: "noreferrer",
          target: "_blank"
        }
      : null,
    { href: "/", label: "Back to marketing", tone: "muted" }
  ];

  return (
    <OpsQuickActions
      actions={actions.filter(
        (
          action
        ): action is {
          href: string;
          label: string;
          tone?: "action" | "inline" | "muted";
          rel?: string;
          target?: string;
        } => action !== null
      )}
    />
  );
}

export default async function OpsPage() {
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
  const currentWorkspace = runtime.operator.access?.workspace ?? null;
  const availableWorkspaceCount =
    runtime.operator.access?.availableWorkspaces.length ?? 0;
  const generationBackendProvider =
    runtime.generationBackend.health.payload?.provider ??
    runtime.generationBackend.readiness.payload?.provider ??
    null;
  const readinessPayload = runtime.generationBackend.readiness.payload;

  return (
    <PageShell
      eyebrow="Ops Command"
      title="Workspace command center"
      lead="Scan current workspace health, act on alerts and reconciliation, verify queue and automation state, and review operational evidence without leaving the selected ops scope."
      actions={opsActions(
        runtime.generationBackend.endpoints.healthUrl ?? null
      )}
      tone="ops"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_1fr] xl:items-start">
        <SurfacePanel>
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                Selected workspace
              </span>
              <h2 className="text-2xl font-semibold">
                {currentWorkspace?.name ?? "Sign in to load operator scope"}
              </h2>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {currentWorkspace
                  ? `${currentWorkspace.slug} is the active operational boundary. Alert policy, reconciliation controls, deliveries, and runtime history below stay locked to this workspace.`
                  : "Public runtime health remains visible here, but queue depth, alert controls, reconciliation, and retry actions only load after an authenticated studio session selects an accessible workspace."}
              </p>
            </div>
            <OpsPillRow>
              <Pill>{runtime.web.service}</Pill>
              <Pill>{runtime.web.phase}</Pill>
              <Pill>{formatDateTime(runtime.web.timestamp)}</Pill>
              <Pill>
                {currentWorkspace?.slug ?? "workspace selection required"}
              </Pill>
              <Pill>{runtime.operator.access?.role ?? "unauthenticated"}</Pill>
              <Pill>{availableWorkspaceCount} accessible</Pill>
            </OpsPillRow>
            <dl className="grid gap-4 border-t border-[color:var(--color-line)]/75 pt-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Control plane
                </dt>
                <dd className="text-base font-semibold text-[color:var(--color-text)]">
                  {runtime.web.status}
                </dd>
                <p className="text-sm text-[color:var(--color-muted)]">
                  Web control plane · Reported{" "}
                  {formatDateTime(runtime.web.timestamp)}
                </p>
              </div>
              <div className="grid gap-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Backend readiness
                </dt>
                <dd className="text-base font-semibold text-[color:var(--color-text)]">
                  {runtime.generationBackend.readiness.status}
                </dd>
                <p className="text-sm text-[color:var(--color-muted)]">
                  {runtime.generationBackend.readiness.message} · Checked{" "}
                  {formatDateTime(
                    runtime.generationBackend.readiness.checkedAt
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Provider path
                </dt>
                <dd className="text-base font-semibold text-[color:var(--color-text)]">
                  {generationBackendProvider?.kind ?? "backend unavailable"}
                </dd>
                <p className="text-sm text-[color:var(--color-muted)]">
                  {generationBackendProvider?.checkpointName ??
                    "No checkpoint reported"}{" "}
                  ·{" "}
                  {generationBackendProvider?.workflowSource ??
                    "No workflow source reported"}
                </p>
              </div>
              <div className="grid gap-1">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Workspace scope
                </dt>
                <dd className="text-base font-semibold text-[color:var(--color-text)]">
                  {currentWorkspace?.status ?? "session required"}
                </dd>
                <p className="text-sm text-[color:var(--color-muted)]">
                  {currentWorkspace
                    ? `${runtime.operator.access?.role ?? "operator"} access for ${currentWorkspace.slug}`
                    : "Operator scope not loaded"}{" "}
                  ·{" "}
                  {readinessPayload
                    ? `Probe ${readinessPayload.probe.latencyMs ?? "n/a"}ms`
                    : `${availableWorkspaceCount} accessible workspaces`}
                </p>
              </div>
            </dl>
          </div>
        </SurfacePanel>

        <aside className="grid gap-5">
          <SurfaceCard
            body="Keep the active workspace explicit, then branch into adjacent ops routes from the same support rail instead of splitting that context across multiple cards."
            eyebrow="Operator scope"
            title="Workspace selection and route access"
          >
            <div className="mt-4">
              <WorkspaceScopeSwitcher
                currentWorkspaceSlug={currentWorkspace?.slug ?? null}
                workspaces={runtime.operator.access?.availableWorkspaces ?? []}
              />
            </div>
            <div className="mt-5 border-t border-[color:var(--color-line)]/75 pt-5">
              <OpsQuickActions
                actions={[
                  { href: "/ops/audit", label: "Review audit evidence" },
                  { href: "/ops/fleet", label: "Open fleet triage" },
                  { href: "/ops/retention", label: "Open retention review" },
                  {
                    href: "/ops/workspaces",
                    label: "Browse workspace directory"
                  }
                ]}
              />
            </div>
          </SurfaceCard>
        </aside>
      </div>
      <OpsOperatorPanel operator={runtime.operator} />
      <WorkspaceDirectoryPanel
        body="Accessible workspace summaries remain available as supporting context below the live command surface so operators can confirm where they can move next without crowding the active attention zones."
        entries={workspaceDirectory.workspaces}
        eyebrow="Workspace directory"
        span={12}
        title="Accessible operator estate"
      />
    </PageShell>
  );
}
