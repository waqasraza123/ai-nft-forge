import {
  OpsQuickActions,
  OpsSummaryCard,
  PageShell,
  Pill,
  SurfaceCard
} from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../components/workspace-directory-panel";
import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
import { SidebarThemeSwitcher } from "../../../components/sidebar-theme-switcher";
import { loadOpsRuntime } from "../../../server/ops/runtime";
import { createRuntimeWorkspaceDirectoryService } from "../../../server/workspaces/directory-service";

import { OpsOperatorPanel } from "./ops-operator-panel";

type OpsPageTone = "critical" | "healthy" | "neutral" | "warning";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function resolveTone(
  status:
    | "not_ready"
    | "ok"
    | "ready"
    | "unconfigured"
    | "unreachable"
    | undefined
): OpsPageTone {
  if (status === "ok" || status === "ready") {
    return "healthy";
  }

  if (status === "not_ready" || status === "unreachable") {
    return "critical";
  }

  if (status === "unconfigured") {
    return "warning";
  }

  return "neutral";
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
  const readinessTone = resolveTone(runtime.generationBackend.readiness.status);
  const healthTone = resolveTone(runtime.generationBackend.health.status);
  const controlPlaneTone = resolveTone(runtime.web.status);

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
        <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
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
            <div className="flex flex-wrap gap-2">
              <Pill>{runtime.web.service}</Pill>
              <Pill>{runtime.web.phase}</Pill>
              <Pill>{formatDateTime(runtime.web.timestamp)}</Pill>
              <Pill>
                {currentWorkspace?.slug ?? "workspace selection required"}
              </Pill>
              <Pill>{runtime.operator.access?.role ?? "unauthenticated"}</Pill>
              <Pill>{availableWorkspaceCount} accessible</Pill>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <OpsSummaryCard
                detail="Web control plane"
                label="Control plane"
                meta={`Reported ${formatDateTime(runtime.web.timestamp)}`}
                tone={controlPlaneTone}
                value={runtime.web.status}
              />
              <OpsSummaryCard
                detail={runtime.generationBackend.readiness.message}
                label="Backend readiness"
                meta={`Checked ${formatDateTime(runtime.generationBackend.readiness.checkedAt)}`}
                tone={readinessTone}
                value={runtime.generationBackend.readiness.status}
              />
              <OpsSummaryCard
                detail={
                  generationBackendProvider?.checkpointName ??
                  "No checkpoint reported"
                }
                label="Provider path"
                meta={
                  generationBackendProvider?.workflowSource ??
                  "No workflow source reported"
                }
                tone={healthTone}
                value={generationBackendProvider?.kind ?? "backend unavailable"}
              />
              <OpsSummaryCard
                detail={
                  currentWorkspace
                    ? `${runtime.operator.access?.role ?? "operator"} access for ${currentWorkspace.slug}`
                    : "Operator scope not loaded"
                }
                label="Workspace scope"
                meta={
                  readinessPayload
                    ? `Probe ${readinessPayload.probe.latencyMs ?? "n/a"}ms`
                    : `${availableWorkspaceCount} accessible workspaces`
                }
                tone={currentWorkspace ? "healthy" : "neutral"}
                value={currentWorkspace?.status ?? "session required"}
              />
            </div>
          </div>
        </section>

        <aside className="grid gap-5">
          <SurfaceCard
            body="Keep the current workspace explicit before acting on alerts, policies, reconciliation, or queue-owned evidence."
            eyebrow="Workspace scope"
            title="Controlled workspace selection"
          >
            <div className="mt-4">
              <WorkspaceScopeSwitcher
                currentWorkspaceSlug={currentWorkspace?.slug ?? null}
                workspaces={runtime.operator.access?.availableWorkspaces ?? []}
              />
            </div>
          </SurfaceCard>
          <SurfaceCard
            body="Use dedicated routes for fleet triage, audit evidence, retention review, and workspace estate context."
            eyebrow="Route deck"
            title="Adjacent ops surfaces"
          >
            <div className="mt-4">
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
          <SurfaceCard
            body="Choose one of five premium themes to change sidebar chrome, focus, and key accent language across Studio and Ops surfaces."
            eyebrow="Internal chrome"
            title="Internal sidebar theme"
          >
            <div className="mt-4">
              <SidebarThemeSwitcher />
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
