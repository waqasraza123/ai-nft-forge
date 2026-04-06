import Link from "next/link";

import { PageShell, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import { OpsOperatorPanel } from "./ops-operator-panel";
import { loadOpsRuntime } from "../../../server/ops/runtime";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function OpsPage() {
  const runtime = await loadOpsRuntime();
  const generationBackendProvider =
    runtime.generationBackend.health.payload?.provider ??
    runtime.generationBackend.readiness.payload?.provider ??
    null;
  const readinessPayload = runtime.generationBackend.readiness.payload;
  const readinessStatus = runtime.generationBackend.readiness.status;
  const readinessTone =
    readinessStatus === "ready"
      ? "success"
      : readinessStatus === "not_ready" || readinessStatus === "unreachable"
        ? "error"
        : "info";

  return (
    <PageShell
      eyebrow="Ops"
      title="Live runtime and queue diagnostics for the generation path"
      lead="This surface now carries public runtime health plus authenticated queue depth, recent generation activity, and owner-scoped retry controls so operator checks do not depend on the studio asset browser alone."
      actions={
        <>
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
      <SurfaceGrid>
        <SurfaceCard
          body="The web app remains the operator control plane and now reports runtime timestamps directly on this route."
          eyebrow={runtime.web.status}
          title="Web runtime"
        >
          <div className="pill-row">
            <Pill>{runtime.web.service}</Pill>
            <Pill>{runtime.web.phase}</Pill>
            <Pill>{formatDateTime(runtime.web.timestamp)}</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body={
            runtime.generationBackend.health.status === "ok"
              ? "The generation backend is reachable and exposes provider configuration plus liveness details."
              : runtime.generationBackend.health.message
          }
          eyebrow={runtime.generationBackend.health.status}
          title="Generation backend liveness"
        >
          <div className="pill-row">
            <Pill>
              {generationBackendProvider?.kind ?? "backend unavailable"}
            </Pill>
            <Pill>
              {generationBackendProvider?.checkpointName ?? "no checkpoint"}
            </Pill>
            <Pill>
              {generationBackendProvider?.workflowSource ?? "no workflow file"}
            </Pill>
            <Pill>
              {runtime.generationBackend.health.payload
                ? `${runtime.generationBackend.health.payload.uptimeSeconds}s uptime`
                : formatDateTime(runtime.generationBackend.health.checkedAt)}
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body={runtime.generationBackend.readiness.message}
          eyebrow={runtime.generationBackend.readiness.status}
          title="Generation backend readiness"
        />
        <SurfaceCard
          body="These are the current operator-facing probe targets for the generation path."
          eyebrow="Endpoints"
          title="Probe targets"
        >
          <div className="pill-row">
            <Pill>
              {runtime.generationBackend.endpoints.generateUrl ??
                "No generate URL"}
            </Pill>
            <Pill>
              {runtime.generationBackend.endpoints.healthUrl ?? "No health URL"}
            </Pill>
            <Pill>
              {runtime.generationBackend.endpoints.readinessUrl ??
                "No readiness URL"}
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Readiness now reflects the active provider path instead of only confirming the HTTP process is alive."
          eyebrow="Diagnostics"
          span={8}
          title="Provider probe summary"
        >
          <div className={`status-banner status-banner--${readinessTone}`}>
            <strong>{runtime.generationBackend.readiness.status}</strong>
            <span>{runtime.generationBackend.readiness.message}</span>
            {readinessPayload ? (
              <span>
                Checked {formatDateTime(readinessPayload.probe.checkedAt)}
              </span>
            ) : (
              <span>
                Checked{" "}
                {formatDateTime(runtime.generationBackend.readiness.checkedAt)}
              </span>
            )}
            {readinessPayload && readinessPayload.probe.latencyMs !== null ? (
              <span>{readinessPayload.probe.latencyMs}ms</span>
            ) : null}
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The public portion of this route stays focused on liveness and readiness. Deeper queue and retry controls only appear for authenticated operators."
          eyebrow="Access boundary"
          span={4}
          title="Operator controls"
        />
      </SurfaceGrid>
      <OpsOperatorPanel operator={runtime.operator} />
    </PageShell>
  );
}
