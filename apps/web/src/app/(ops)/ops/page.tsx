import Link from "next/link";

import { PageShell, Pill } from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../components/workspace-directory-panel";
import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
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

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
    <article
      className={joinClassNames(
        "ops-command-signal",
        `ops-command-signal--${tone}`
      )}
    >
      <span className="ops-command-signal__label">{label}</span>
      <strong className="ops-command-signal__value">{value}</strong>
      <span className="ops-command-signal__detail">{detail}</span>
      <span className="ops-command-signal__meta">{meta}</span>
    </article>
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
      actions={
        <>
          <Link className="action-link" href="/ops/audit">
            Audit
          </Link>
          <Link className="action-link" href="/ops/fleet">
            Fleet
          </Link>
          <Link className="action-link" href="/ops/retention">
            Retention
          </Link>
          <Link className="action-link" href="/ops/workspaces">
            Directory
          </Link>
          <Link className="action-link" href="/api/health">
            Web health
          </Link>
          {runtime.generationBackend.endpoints.healthUrl ? (
            <a
              className="action-link"
              href={runtime.generationBackend.endpoints.healthUrl}
              rel="noreferrer"
              target="_blank"
            >
              Backend health
            </a>
          ) : null}
          <Link className="inline-link" href="/">
            Back to marketing
          </Link>
        </>
      }
      tone="ops"
    >
      <div className="ops-command-page">
        <section className="ops-command-launchpad">
          <div className="ops-command-launchpad__primary">
            <div className="ops-command-launchpad__copy">
              <span className="ops-command-launchpad__eyebrow">
                Selected workspace
              </span>
              <h2 className="ops-command-launchpad__title">
                {currentWorkspace?.name ?? "Sign in to load operator scope"}
              </h2>
              <p className="ops-command-launchpad__lead">
                {currentWorkspace
                  ? `${currentWorkspace.slug} is the active operational boundary. Alert policy, reconciliation controls, deliveries, and runtime history below stay locked to this workspace.`
                  : "Public runtime health remains visible here, but queue depth, alert controls, reconciliation, and retry actions only load after an authenticated studio session selects an accessible workspace."}
              </p>
            </div>
            <div className="pill-row">
              <Pill>{runtime.web.service}</Pill>
              <Pill>{runtime.web.phase}</Pill>
              <Pill>{formatDateTime(runtime.web.timestamp)}</Pill>
              <Pill>
                {currentWorkspace?.slug ?? "workspace selection required"}
              </Pill>
              <Pill>{runtime.operator.access?.role ?? "unauthenticated"}</Pill>
              <Pill>{availableWorkspaceCount} accessible</Pill>
            </div>
            <div className="ops-command-signal-grid ops-command-signal-grid--page">
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
          <div className="ops-command-launchpad__rail">
            <article className="ops-command-module ops-command-module--neutral">
              <div className="ops-command-module__header">
                <div className="ops-command-module__copy">
                  <span className="ops-command-module__eyebrow">
                    Workspace scope
                  </span>
                  <h3 className="ops-command-module__title">
                    Controlled workspace selection
                  </h3>
                  <p className="ops-command-module__description">
                    Keep the current workspace explicit before acting on alerts,
                    policies, reconciliation, or queue-owned evidence.
                  </p>
                </div>
              </div>
              <WorkspaceScopeSwitcher
                currentWorkspaceSlug={currentWorkspace?.slug ?? null}
                workspaces={runtime.operator.access?.availableWorkspaces ?? []}
              />
            </article>
            <article className="ops-command-module ops-command-module--neutral">
              <div className="ops-command-module__header">
                <div className="ops-command-module__copy">
                  <span className="ops-command-module__eyebrow">
                    Route deck
                  </span>
                  <h3 className="ops-command-module__title">
                    Adjacent ops surfaces
                  </h3>
                  <p className="ops-command-module__description">
                    Use dedicated routes for fleet triage, audit evidence,
                    retention review, and workspace estate context.
                  </p>
                </div>
              </div>
              <div className="ops-command-link-list">
                <Link className="action-link" href="/ops/audit">
                  Review audit evidence
                </Link>
                <Link className="action-link" href="/ops/fleet">
                  Open fleet triage
                </Link>
                <Link className="action-link" href="/ops/retention">
                  Open retention review
                </Link>
                <Link className="action-link" href="/ops/workspaces">
                  Browse workspace directory
                </Link>
              </div>
            </article>
          </div>
        </section>
        <OpsOperatorPanel operator={runtime.operator} />
        <div className="ops-command-support">
          <WorkspaceDirectoryPanel
            body="Accessible workspace summaries remain available as supporting context below the live command surface so operators can confirm where they can move next without crowding the active attention zones."
            entries={workspaceDirectory.workspaces}
            eyebrow="Workspace directory"
            span={12}
            title="Accessible operator estate"
          />
        </div>
      </div>
    </PageShell>
  );
}
