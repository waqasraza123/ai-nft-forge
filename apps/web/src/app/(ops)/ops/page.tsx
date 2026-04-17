import { ActionLink, PageShell, Pill } from "@ai-nft-forge/ui";

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

function summaryToneClasses(tone: OpsPageTone) {
  if (tone === "critical") {
    return "border-rose-400/45 bg-rose-500/12 text-rose-100";
  }

  if (tone === "warning") {
    return "border-amber-400/45 bg-amber-500/12 text-amber-100";
  }

  if (tone === "healthy") {
    return "border-emerald-400/45 bg-emerald-500/12 text-emerald-100";
  }

  return "border-[color:var(--color-line)] bg-[color:var(--color-surface)]/60 text-[color:var(--color-muted)]";
}

function OpsCommandSummaryCard({
  detail,
  label,
  meta,
  tone,
  value
}: {
  detail: string;
  label: string;
  meta: string;
  tone: OpsPageTone;
  value: string;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${summaryToneClasses(tone)}`}>
      <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.15em]">
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-[color:var(--color-text)]">
        {value}
      </p>
      <p className="mt-2 text-sm">{detail}</p>
      <p className="mt-3 text-xs text-[color:var(--color-muted)]">{meta}</p>
    </article>
  );
}

function opsActions(runtimeBackendHealthUrl: string | null) {
  return (
    <>
      <ActionLink href="/ops/audit">Audit</ActionLink>
      <ActionLink href="/ops/fleet">Fleet</ActionLink>
      <ActionLink href="/ops/retention">Retention</ActionLink>
      <ActionLink href="/ops/workspaces">Directory</ActionLink>
      <ActionLink href="/api/health">Web health</ActionLink>
      {runtimeBackendHealthUrl ? (
        <ActionLink
          href={runtimeBackendHealthUrl}
          rel="noreferrer"
          target="_blank"
          tone="inline"
        >
          Backend health
        </ActionLink>
      ) : null}
      <ActionLink href="/" tone="muted">
        Back to marketing
      </ActionLink>
    </>
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
              <OpsCommandSummaryCard
                detail="Web control plane"
                label="Control plane"
                meta={`Reported ${formatDateTime(runtime.web.timestamp)}`}
                tone={controlPlaneTone}
                value={runtime.web.status}
              />
              <OpsCommandSummaryCard
                detail={runtime.generationBackend.readiness.message}
                label="Backend readiness"
                meta={`Checked ${formatDateTime(runtime.generationBackend.readiness.checkedAt)}`}
                tone={readinessTone}
                value={runtime.generationBackend.readiness.status}
              />
              <OpsCommandSummaryCard
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
              <OpsCommandSummaryCard
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
          <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
                Workspace scope
              </span>
              <h3 className="text-xl font-semibold">
                Controlled workspace selection
              </h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Keep the current workspace explicit before acting on alerts,
                policies, reconciliation, or queue-owned evidence.
              </p>
            </div>
            <div className="mt-4">
              <WorkspaceScopeSwitcher
                currentWorkspaceSlug={currentWorkspace?.slug ?? null}
                workspaces={runtime.operator.access?.availableWorkspaces ?? []}
              />
            </div>
          </section>
          <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
                Route deck
              </span>
              <h3 className="text-xl font-semibold">Adjacent ops surfaces</h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Use dedicated routes for fleet triage, audit evidence, retention
                review, and workspace estate context.
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              <ActionLink href="/ops/audit">Review audit evidence</ActionLink>
              <ActionLink href="/ops/fleet">Open fleet triage</ActionLink>
              <ActionLink href="/ops/retention">
                Open retention review
              </ActionLink>
              <ActionLink href="/ops/workspaces">
                Browse workspace directory
              </ActionLink>
            </div>
          </section>
          <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
                Internal chrome
              </span>
              <h3 className="text-xl font-semibold">Internal sidebar theme</h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                Choose one of five premium themes to change sidebar chrome,
                focus, and key accent language across Studio and Ops surfaces.
              </p>
            </div>
            <div className="mt-4">
              <SidebarThemeSwitcher />
            </div>
          </section>
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
