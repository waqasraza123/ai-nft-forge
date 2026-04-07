"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MetricTile, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import type {
  OpsAlertDeliverySummary,
  OpsAlertMuteSummary,
  OpsAlertStateSummary,
  OpsCaptureAutomation,
  OpsGenerationWindowSummary,
  OpsGenerationActivitySummary,
  OpsPersistedCaptureSummary,
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

function formatDurationSeconds(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  if (value < 60) {
    return `${value}s`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days}d ${remainingHours}h`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value}%`;
}

function resolveStatusBannerTone(
  status: "critical" | "ok" | "unreachable" | "warning"
) {
  if (status === "critical" || status === "unreachable") {
    return "error";
  }

  if (status === "warning") {
    return "info";
  }

  return "success";
}

function resolveAutomationBannerTone(status: OpsCaptureAutomation["status"]) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "disabled") {
    return "info";
  }

  return "error";
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

function WindowSummary({ window }: { window: OpsGenerationWindowSummary }) {
  return (
    <div className="ops-window-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{window.label}</strong>
          <span>From {formatDateTime(window.from)}</span>
        </div>
        <Pill>{window.windowKey}</Pill>
      </div>
      <div className="metric-list">
        <MetricTile label="Requests" value={String(window.totalCount)} />
        <MetricTile label="Queued" value={String(window.queuedCount)} />
        <MetricTile label="Running" value={String(window.runningCount)} />
        <MetricTile label="Succeeded" value={String(window.succeededCount)} />
        <MetricTile label="Failed" value={String(window.failedCount)} />
        <MetricTile
          label="Success rate"
          value={formatPercent(window.successRatePercent)}
        />
        <MetricTile
          label="Avg completion"
          value={formatDurationSeconds(window.averageCompletionSeconds)}
        />
        <MetricTile
          label="Max completion"
          value={formatDurationSeconds(window.maxCompletionSeconds)}
        />
        <MetricTile
          label="Stored assets"
          value={String(window.storedAssetCount)}
        />
      </div>
    </div>
  );
}

function PersistedCaptureItem({
  capture
}: {
  capture: OpsPersistedCaptureSummary;
}) {
  return (
    <div className="ops-window-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{formatDateTime(capture.capturedAt)}</strong>
          <span>{capture.observabilityMessage}</span>
        </div>
        <Pill>{capture.observabilityStatus}</Pill>
      </div>
      <div className="pill-row">
        <Pill>{capture.backendReadinessStatus}</Pill>
        <Pill>{capture.queueStatus}</Pill>
        <Pill>{capture.workerAdapter ?? "Unknown adapter"}</Pill>
        <Pill>{capture.criticalAlertCount} critical</Pill>
        <Pill>{capture.warningAlertCount} warning</Pill>
        <Pill>
          Oldest queued {formatDurationSeconds(capture.oldestQueuedAgeSeconds)}
        </Pill>
        <Pill>
          Oldest running{" "}
          {formatDurationSeconds(capture.oldestRunningAgeSeconds)}
        </Pill>
      </div>
      <div className="pill-row">
        <Pill>Waiting {capture.queueCounts.waiting ?? "n/a"}</Pill>
        <Pill>Active {capture.queueCounts.active ?? "n/a"}</Pill>
        <Pill>Failed {capture.queueCounts.failed ?? "n/a"}</Pill>
        <Pill>Completed {capture.queueCounts.completed ?? "n/a"}</Pill>
      </div>
      <div className="ops-window-list">
        {capture.windows.map((window) => (
          <WindowSummary
            key={`${capture.id}-${window.windowKey}`}
            window={window}
          />
        ))}
      </div>
    </div>
  );
}

function AlertDeliveryItem({
  delivery
}: {
  delivery: OpsAlertDeliverySummary;
}) {
  const tone =
    delivery.deliveryState === "failed"
      ? "error"
      : delivery.severity === "critical"
        ? "error"
        : "info";

  return (
    <div className="ops-activity-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{delivery.title}</strong>
          <span>{delivery.message}</span>
        </div>
        <Pill>{delivery.deliveryState}</Pill>
      </div>
      <div className="pill-row">
        <Pill>{delivery.code}</Pill>
        <Pill>{delivery.severity}</Pill>
        <Pill>{delivery.deliveryChannel}</Pill>
      </div>
      <div className={`status-banner status-banner--${tone}`}>
        <strong>
          {delivery.deliveredAt
            ? `Delivered ${formatDateTime(delivery.deliveredAt)}`
            : `Recorded ${formatDateTime(delivery.createdAt)}`}
        </strong>
        <span>
          {delivery.failureMessage ??
            "This alert was persisted through an operator delivery channel."}
        </span>
      </div>
    </div>
  );
}

function ActiveAlertItem({
  alert,
  acknowledging,
  clearingMute,
  muting,
  onAcknowledge,
  onClearMute,
  onMute
}: {
  alert: OpsAlertStateSummary;
  acknowledging: boolean;
  clearingMute: boolean;
  muting: boolean;
  onAcknowledge: (alertStateId: string) => Promise<void>;
  onClearMute: (alertStateId: string) => Promise<void>;
  onMute: (alertStateId: string, durationHours: number) => Promise<void>;
}) {
  const tone = alert.severity === "critical" ? "error" : "info";

  return (
    <div className="ops-activity-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{alert.title}</strong>
          <span>{alert.message}</span>
        </div>
        <Pill>{alert.severity}</Pill>
      </div>
      <div className="pill-row">
        <Pill>{alert.code}</Pill>
        <Pill>{alert.status}</Pill>
        <Pill>
          {alert.acknowledgedAt
            ? `Acknowledged ${formatDateTime(alert.acknowledgedAt)}`
            : "Not acknowledged"}
        </Pill>
        <Pill>
          {alert.mutedUntil
            ? `Muted until ${formatDateTime(alert.mutedUntil)}`
            : "Delivery active"}
        </Pill>
      </div>
      <div className={`status-banner status-banner--${tone}`}>
        <strong>First seen {formatDateTime(alert.firstObservedAt)}</strong>
        <span>Last seen {formatDateTime(alert.lastObservedAt)}</span>
        <span>
          Last delivered{" "}
          {alert.lastDeliveredAt
            ? formatDateTime(alert.lastDeliveredAt)
            : "not recorded"}
        </span>
      </div>
      <div className="studio-action-row">
        {!alert.acknowledgedAt ? (
          <button
            className="button-action"
            disabled={acknowledging}
            onClick={() => {
              void onAcknowledge(alert.id);
            }}
            type="button"
          >
            {acknowledging ? "Acknowledging…" : "Acknowledge alert"}
          </button>
        ) : null}
        <button
          className="button-action"
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 1);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 1h"}
        </button>
        <button
          className="button-action"
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 24);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 1d"}
        </button>
        <button
          className="button-action"
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 24 * 7);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 7d"}
        </button>
        {alert.mutedUntil ? (
          <button
            className="button-action"
            disabled={muting || clearingMute}
            onClick={() => {
              void onClearMute(alert.id);
            }}
            type="button"
          >
            {clearingMute ? "Clearing mute…" : "Clear mute"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ActiveMuteItem({
  mute,
  clearing,
  onClear
}: {
  mute: OpsAlertMuteSummary;
  clearing: boolean;
  onClear: (code: string) => Promise<void>;
}) {
  return (
    <div className="ops-activity-item">
      <div className="ops-activity-item__header">
        <div className="ops-activity-item__copy">
          <strong>{mute.code}</strong>
          <span>Muted until {formatDateTime(mute.mutedUntil)}</span>
        </div>
        <Pill>mute</Pill>
      </div>
      <div className="studio-action-row">
        <button
          className="button-action"
          disabled={clearing}
          onClick={() => {
            void onClear(mute.code);
          }}
          type="button"
        >
          {clearing ? "Clearing mute…" : "Clear mute"}
        </button>
      </div>
    </div>
  );
}

export function OpsOperatorPanel({ operator }: OpsOperatorPanelProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeState>(null);
  const [acknowledgingAlertStateId, setAcknowledgingAlertStateId] = useState<
    string | null
  >(null);
  const [clearingMuteCode, setClearingMuteCode] = useState<string | null>(null);
  const [mutingAlertStateId, setMutingAlertStateId] = useState<string | null>(
    null
  );
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

  const acknowledgeAlertState = async (alertStateId: string) => {
    setAcknowledgingAlertStateId(alertStateId);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/ops/alerts/${alertStateId}/acknowledge`,
        {
          method: "POST"
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert acknowledgment could not be recorded.";

        throw new Error(message);
      }

      setNotice({
        message: "Alert acknowledgment was recorded on the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert acknowledgment could not be recorded.",
        tone: "error"
      });
    } finally {
      setAcknowledgingAlertStateId(null);
    }
  };

  const muteAlertState = async (
    alertStateId: string,
    durationHours: number
  ) => {
    setMutingAlertStateId(alertStateId);
    setNotice(null);

    try {
      const response = await fetch(`/api/ops/alerts/${alertStateId}/mute`, {
        body: JSON.stringify({
          durationHours
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert mute could not be recorded.";

        throw new Error(message);
      }

      setNotice({
        message: `Alert delivery was muted for ${durationHours} hour${durationHours === 1 ? "" : "s"}.`,
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert mute could not be recorded.",
        tone: "error"
      });
    } finally {
      setMutingAlertStateId(null);
    }
  };

  const clearAlertMuteByAlertStateId = async (alertStateId: string) => {
    const alert = operator.history?.activeAlerts.find(
      (activeAlert) => activeAlert.id === alertStateId
    );
    const muteCode = alert?.code ?? null;

    setClearingMuteCode(muteCode);
    setNotice(null);

    try {
      const response = await fetch(`/api/ops/alerts/${alertStateId}/mute`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert mute could not be cleared.";

        throw new Error(message);
      }

      setNotice({
        message: "Alert mute was cleared on the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert mute could not be cleared.",
        tone: "error"
      });
    } finally {
      setClearingMuteCode(null);
    }
  };

  const clearAlertMuteByCode = async (code: string) => {
    setClearingMuteCode(code);
    setNotice(null);

    try {
      const response = await fetch(`/api/ops/alert-mutes/${code}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert mute could not be cleared.";

        throw new Error(message);
      }

      setNotice({
        message: "Alert mute was cleared on the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert mute could not be cleared.",
        tone: "error"
      });
    } finally {
      setClearingMuteCode(null);
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
  const captureAutomation = operator.captureAutomation;
  const history = operator.history;
  const observability = operator.observability;
  const observabilityTone = resolveStatusBannerTone(
    observability?.status ?? "unreachable"
  );
  const captureAutomationTone = resolveAutomationBannerTone(
    captureAutomation?.status ?? "unreachable"
  );

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
          observability?.message ??
          "Operational alerts are only loaded after the operator session resolves."
        }
        eyebrow={observability?.status ?? "hidden"}
        span={12}
        title="Operational alerts"
      >
        {observability ? (
          <>
            <div
              className={`status-banner status-banner--${observabilityTone}`}
            >
              <strong>{observability.status}</strong>
              <span>{observability.message}</span>
              <span>Checked {formatDateTime(observability.checkedAt)}</span>
            </div>
            <div className="pill-row">
              <Pill>
                Oldest queued{" "}
                {formatDurationSeconds(observability.oldestQueuedAgeSeconds)}
              </Pill>
              <Pill>
                Oldest running{" "}
                {formatDurationSeconds(observability.oldestRunningAgeSeconds)}
              </Pill>
            </div>
            {observability.alerts.length ? (
              <div className="ops-alert-list">
                {observability.alerts.map((alert) => (
                  <div
                    className={`status-banner status-banner--${
                      alert.severity === "critical" ? "error" : "info"
                    }`}
                    key={alert.code}
                  >
                    <strong>{alert.title}</strong>
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="asset-placeholder">
                No active operator alerts were derived from the latest queue,
                backend, and rolling-window signals.
              </div>
            )}
          </>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body={
          observability?.status === "ok" ||
          observability?.status === "warning" ||
          observability?.status === "critical"
            ? "Rolling windows summarize recent owner-scoped request volume, success rate, and completion duration so operator checks no longer depend on point-in-time queue depth alone."
            : (observability?.message ??
              "Rolling generation metrics could not be loaded for this operator.")
        }
        eyebrow={observability?.status ?? "unreachable"}
        span={12}
        title="Rolling generation metrics"
      >
        {observability?.windows.length ? (
          <div className="ops-window-list">
            {observability.windows.map((window) => (
              <WindowSummary key={window.windowKey} window={window} />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            Rolling generation windows are not available for this operator.
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard
        body={
          captureAutomation?.status === "healthy"
            ? "Worker-owned automation now persists observability captures on a recurring cadence while Redis lease coordination suppresses duplicate runs across replicas."
            : (captureAutomation?.message ??
              "Ops capture automation is only evaluated after the operator session resolves.")
        }
        eyebrow={captureAutomation?.status ?? "unreachable"}
        span={12}
        title="Capture automation"
      >
        {captureAutomation ? (
          <>
            <div
              className={`status-banner status-banner--${captureAutomationTone}`}
            >
              <strong>{captureAutomation.status}</strong>
              <span>{captureAutomation.message}</span>
            </div>
            <div className="pill-row">
              <Pill>
                {captureAutomation.enabled
                  ? "Scheduler enabled"
                  : "Manual only"}
              </Pill>
              <Pill>
                Interval{" "}
                {captureAutomation.intervalSeconds !== null
                  ? formatDurationSeconds(captureAutomation.intervalSeconds)
                  : "n/a"}
              </Pill>
              <Pill>
                Jitter{" "}
                {captureAutomation.jitterSeconds !== null
                  ? formatDurationSeconds(captureAutomation.jitterSeconds)
                  : "n/a"}
              </Pill>
              <Pill>
                Lock TTL{" "}
                {captureAutomation.lockTtlSeconds !== null
                  ? formatDurationSeconds(captureAutomation.lockTtlSeconds)
                  : "n/a"}
              </Pill>
              <Pill>
                {captureAutomation.runOnStart === null
                  ? "Run-on-start n/a"
                  : captureAutomation.runOnStart
                    ? "Runs on startup"
                    : "Startup capture disabled"}
              </Pill>
              <Pill>
                Last capture{" "}
                {captureAutomation.lastCaptureAgeSeconds !== null
                  ? `${formatDurationSeconds(captureAutomation.lastCaptureAgeSeconds)} ago`
                  : "n/a"}
              </Pill>
            </div>
            <div className="ops-activity-meta">
              <span>
                Latest persisted capture{" "}
                {captureAutomation.lastCapturedAt
                  ? formatDateTime(captureAutomation.lastCapturedAt)
                  : "not available"}
              </span>
            </div>
          </>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body={
          history?.status === "ok"
            ? "Persisted active alerts survive beyond one page load, carry explicit acknowledgment state, and clear automatically when the underlying worker-owned alert condition resolves or materially changes."
            : (history?.message ??
              "Persisted active alerts are only loaded after the operator session resolves.")
        }
        eyebrow={history?.status ?? "unreachable"}
        span={12}
        title="Active persisted alerts"
      >
        {history?.activeAlerts.length ? (
          <div className="ops-activity-list">
            {history.activeAlerts.map((alert) => (
              <ActiveAlertItem
                acknowledging={acknowledgingAlertStateId === alert.id}
                clearingMute={clearingMuteCode === alert.code}
                alert={alert}
                key={alert.id}
                onAcknowledge={acknowledgeAlertState}
                onClearMute={clearAlertMuteByAlertStateId}
                onMute={muteAlertState}
                muting={mutingAlertStateId === alert.id}
              />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No persisted active alerts are currently open for this operator.
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard
        body={
          history?.status === "ok"
            ? "Owner-scoped mute policy suppresses alert delivery for a bounded duration without hiding the underlying persisted alert state from `/ops`."
            : (history?.message ??
              "Muted alert policy is only loaded after the operator session resolves.")
        }
        eyebrow={history?.status ?? "unreachable"}
        span={12}
        title="Muted alert policy"
      >
        {history?.activeMutes.length ? (
          <div className="ops-activity-list">
            {history.activeMutes.map((mute) => (
              <ActiveMuteItem
                clearing={clearingMuteCode === mute.code}
                key={mute.id}
                mute={mute}
                onClear={clearAlertMuteByCode}
              />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No active alert mutes are configured for this operator.
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard
        body={
          history?.status === "ok"
            ? "Persisted captures retain multi-day observability checkpoints so operators can review how alert state, queue pressure, and recent generation windows changed over time."
            : (history?.message ??
              "Persisted observability history is only loaded after the operator session resolves.")
        }
        eyebrow={history?.status ?? "unreachable"}
        span={12}
        title="Persisted observability history"
      >
        {history?.captures.length ? (
          <div className="ops-window-list">
            {history.captures.map((capture) => (
              <PersistedCaptureItem capture={capture} key={capture.id} />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No persisted observability captures are available for this operator
            yet.
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard
        body={
          history?.status === "ok"
            ? "Delivered alert records persist the operator-facing alert timeline across internal audit-log and external webhook channels instead of limiting diagnosis to whatever is active on the current request."
            : (history?.message ??
              "Recent alert delivery history could not be loaded for this operator.")
        }
        eyebrow={history?.status ?? "unreachable"}
        span={12}
        title="Recent alert deliveries"
      >
        {history?.deliveries.length ? (
          <div className="ops-activity-list">
            {history.deliveries.map((delivery) => (
              <AlertDeliveryItem delivery={delivery} key={delivery.id} />
            ))}
          </div>
        ) : (
          <div className="asset-placeholder">
            No persisted alert deliveries are available for this operator yet.
          </div>
        )}
      </SurfaceCard>
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
            ? "Queued and running generation requests stay grouped here while the alert and rolling-window panels above summarize trend health."
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
            ? "Failed owner-scoped generation requests can be retried here without returning to the studio asset browser, even when alerts or rolling metrics indicate degradation."
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
