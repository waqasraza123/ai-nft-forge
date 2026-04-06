"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MetricTile, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import type {
  OpsGenerationActivitySummary,
  OpsRuntimeSnapshot
} from "../../../server/ops/runtime";

type OpsOperatorPanelProps = {
  operator: OpsRuntimeSnapshot["operator"];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatRelativeDuration(fromIso: string, toIso?: string | null) {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return "n/a";
  }

  const totalSeconds = Math.max(0, Math.floor((to - from) / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (totalHours < 24) {
    return `${totalHours}h ${remainingMinutes}m`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return `${totalDays}d ${remainingHours}h`;
}

function renderActivityTiming(activity: OpsGenerationActivitySummary) {
  if (activity.status === "running" && activity.startedAt) {
    return `Running for ${formatRelativeDuration(activity.startedAt)}`;
  }

  if (activity.status === "queued") {
    return `Queued ${formatRelativeDuration(activity.createdAt)} ago`;
  }

  if (activity.status === "failed" && activity.failedAt) {
    return `Failed ${formatRelativeDuration(activity.failedAt)} ago`;
  }

  if (activity.status === "succeeded" && activity.completedAt) {
    return `Completed in ${formatRelativeDuration(activity.createdAt, activity.completedAt)}`;
  }

  return `Created ${formatRelativeDuration(activity.createdAt)} ago`;
}

function ActivityItem({
  activity,
  onRetry,
  retrying
}: {
  activity: OpsGenerationActivitySummary;
  onRetry?: (generationRequestId: string) => Promise<void>;
  retrying?: boolean;
}) {
  return (
    <div className="ops-activity-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{activity.sourceAsset.originalFilename}</strong>
          <span>{renderActivityTiming(activity)}</span>
        </div>
        <Pill>{activity.status}</Pill>
      </div>
      <div className="pill-row">
        <Pill>{activity.pipelineKey}</Pill>
        <Pill>{activity.requestedVariantCount} variants</Pill>
        <Pill>{activity.generatedAssetCount} stored rows</Pill>
        <Pill>{activity.queueJobId ?? "No queue job id"}</Pill>
      </div>
      <div className="ops-activity-meta">
        <span>Requested {formatDateTime(activity.createdAt)}</span>
        {activity.startedAt ? (
          <span>Started {formatDateTime(activity.startedAt)}</span>
        ) : null}
        {activity.failedAt ? (
          <span>Failed {formatDateTime(activity.failedAt)}</span>
        ) : null}
        {activity.completedAt ? (
          <span>Completed {formatDateTime(activity.completedAt)}</span>
        ) : null}
      </div>
      {activity.failureMessage ? (
        <div className="status-banner status-banner--error">
          <strong>{activity.failureCode ?? "GENERATION_FAILED"}</strong>
          <span>{activity.failureMessage}</span>
        </div>
      ) : null}
      {onRetry ? (
        <div className="studio-action-row">
          <button
            className="button-action"
            disabled={retrying}
            onClick={() => {
              void onRetry(activity.id);
            }}
            type="button"
          >
            {retrying ? "Retrying…" : "Retry generation"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function OpsOperatorPanel({ operator }: OpsOperatorPanelProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeState>(null);
  const [retryingGenerationRequestId, setRetryingGenerationRequestId] =
    useState<string | null>(null);

  const retryGenerationRequest = async (generationRequestId: string) => {
    setRetryingGenerationRequestId(generationRequestId);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/studio/generations/${generationRequestId}/retry`,
        {
          method: "POST"
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Generation retry could not be started from ops.";

        throw new Error(message);
      }

      setNotice({
        message: "Generation retry was queued from the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Generation retry could not be started from ops.",
        tone: "error"
      });
    } finally {
      setRetryingGenerationRequestId(null);
    }
  };

  if (!operator.session) {
    return (
      <SurfaceGrid>
        <SurfaceCard
          body="Sign in with a studio session to inspect queue depth, review your active or failed generation requests, and trigger owner-scoped retries from this surface."
          eyebrow="Operator session"
          span={12}
          title="Authentication unlocks queue and retry controls"
        >
          <div className="pill-row">
            <Pill>Queue depth hidden</Pill>
            <Pill>Recent failures hidden</Pill>
            <Pill>Retry actions disabled</Pill>
          </div>
          <div className="surface-card__footer">
            <Link className="action-link" href="/sign-in?next=%2Fops">
              Sign in to /ops
            </Link>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
    );
  }

  const queue = operator.queue;
  const activity = operator.activity;

  return (
    <SurfaceGrid>
      {notice ? (
        <SurfaceCard
          body={notice.message}
          eyebrow="Operator status"
          span={12}
          title="Latest operator action"
        >
          <div className={`status-banner status-banner--${notice.tone}`}>
            <strong>{notice.tone}</strong>
            <span>{notice.message}</span>
          </div>
        </SurfaceCard>
      ) : null}
      <SurfaceCard
        body={
          queue?.status === "ok"
            ? queue.message
            : (queue?.message ??
              "Queue diagnostics are only loaded after the operator session resolves.")
        }
        eyebrow={queue?.status ?? "hidden"}
        span={12}
        title="Generation dispatch queue"
      >
        {queue ? (
          <>
            <div
              className={`status-banner status-banner--${
                queue.status === "ok" ? "info" : "error"
              }`}
            >
              <strong>{queue.queueName}</strong>
              <span>{queue.message}</span>
              <span>Checked {formatDateTime(queue.checkedAt)}</span>
            </div>
            <div className="pill-row">
              <Pill>{queue.service ?? "Worker service unavailable"}</Pill>
              <Pill>{queue.workerAdapter ?? "Unknown adapter"}</Pill>
              <Pill>
                {queue.concurrency !== null
                  ? `${queue.concurrency}x concurrency`
                  : "No concurrency signal"}
              </Pill>
            </div>
            {queue.counts ? (
              <div className="metric-list">
                <MetricTile
                  label="Waiting"
                  value={String(queue.counts.waiting)}
                />
                <MetricTile
                  label="Active"
                  value={String(queue.counts.active)}
                />
                <MetricTile
                  label="Delayed"
                  value={String(queue.counts.delayed)}
                />
                <MetricTile
                  label="Failed"
                  value={String(queue.counts.failed)}
                />
                <MetricTile
                  label="Completed"
                  value={String(queue.counts.completed)}
                />
                <MetricTile
                  label="Paused"
                  value={String(queue.counts.paused)}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body={
          activity?.status === "ok"
            ? "Queued and running generation requests are grouped here so operator checks no longer depend on the studio asset list."
            : (activity?.message ??
              "Recent activity could not be loaded for this operator.")
        }
        eyebrow={activity?.status ?? "unreachable"}
        span={6}
        title="Active generation requests"
      >
        {activity?.active.length ? (
          <div className="ops-activity-list">
            {activity.active.map((entry) => (
              <ActivityItem activity={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No queued or running generation requests are owned by this session.
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard
        body={
          activity?.status === "ok"
            ? "Failed owner-scoped generation requests can be retried here without returning to the studio asset browser."
            : (activity?.message ??
              "Retryable failure history could not be loaded for this operator.")
        }
        eyebrow={activity?.status ?? "unreachable"}
        span={6}
        title="Retryable failures"
      >
        {activity?.retryableFailures.length ? (
          <div className="ops-activity-list">
            {activity.retryableFailures.map((entry) => (
              <ActivityItem
                activity={entry}
                key={entry.id}
                onRetry={retryGenerationRequest}
                retrying={retryingGenerationRequestId === entry.id}
              />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No failed generation requests are currently retryable for this
            session.
          </div>
        )}
      </SurfaceCard>
    </SurfaceGrid>
  );
}
