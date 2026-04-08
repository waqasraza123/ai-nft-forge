"use client";

import {
  formatOpsAlertScheduleMinuteOfDay,
  opsAlertScheduleDayValues,
  type OpsAlertScheduleDay
} from "@ai-nft-forge/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MetricTile, Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

import type {
  OpsAlertDeliverySummary,
  OpsAlertEscalation,
  OpsAlertMuteSummary,
  OpsAlertRouting,
  OpsAlertSchedule,
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

type AlertScheduleDraft = {
  activeDays: OpsAlertScheduleDay[];
  allDay: boolean;
  endTime: string;
  startTime: string;
  timezone: string;
};

type AlertEscalationDraft = {
  firstReminderDelayMinutes: string;
  repeatReminderIntervalMinutes: string;
};

const alertScheduleDayLabelByValue: Record<OpsAlertScheduleDay, string> = {
  fri: "Fri",
  mon: "Mon",
  sat: "Sat",
  sun: "Sun",
  thu: "Thu",
  tue: "Tue",
  wed: "Wed"
};

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

function resolveAlertRoutingTone(status: OpsAlertRouting["status"]) {
  if (status === "configured") {
    return "success";
  }

  if (status === "unconfigured") {
    return "info";
  }

  return "error";
}

function resolveAlertEscalationTone(status: OpsAlertEscalation["status"]) {
  if (status === "configured") {
    return "success";
  }

  if (status === "disabled" || status === "unconfigured") {
    return "info";
  }

  return "error";
}

function resolveAlertScheduleTone(status: OpsAlertSchedule["status"]) {
  if (status === "active") {
    return "success";
  }

  if (status === "unconfigured") {
    return "info";
  }

  return "error";
}

function formatAlertScheduleDayList(activeDays: OpsAlertScheduleDay[]) {
  if (activeDays.length === 0) {
    return "Always";
  }

  if (activeDays.length === 7) {
    return "Every day";
  }

  if (
    activeDays.length === 5 &&
    activeDays.join(",") === "mon,tue,wed,thu,fri"
  ) {
    return "Weekdays";
  }

  return activeDays.map((activeDay) => alertScheduleDayLabelByValue[activeDay]).join(", ");
}

function minuteOfDayToTimeValue(minuteOfDay: number) {
  if (minuteOfDay >= 1440) {
    return "23:59";
  }

  const hours = Math.floor(minuteOfDay / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (minuteOfDay % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function parseTimeValueToMinuteOfDay(timeValue: string) {
  const [hoursValue, minutesValue] = timeValue.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function createAlertScheduleDraft(
  alertSchedule: OpsAlertSchedule | null
): AlertScheduleDraft {
  const policy = alertSchedule?.policy;
  const hasOverride = policy?.source === "owner_override";
  const startMinuteOfDay = hasOverride ? policy.startMinuteOfDay ?? 540 : 540;
  const endMinuteOfDay = hasOverride ? policy.endMinuteOfDay ?? 1020 : 1020;

  return {
    activeDays: hasOverride
      ? [...policy.activeDays]
      : ["mon", "tue", "wed", "thu", "fri"],
    allDay: hasOverride
      ? startMinuteOfDay === 0 && endMinuteOfDay === 1440
      : false,
    endTime:
      hasOverride && endMinuteOfDay !== null
        ? minuteOfDayToTimeValue(endMinuteOfDay)
        : "17:00",
    startTime:
      hasOverride && startMinuteOfDay !== null
        ? minuteOfDayToTimeValue(startMinuteOfDay)
        : "09:00",
    timezone:
      hasOverride && policy.timezone !== null ? policy.timezone : "UTC"
  };
}

function createAlertEscalationDraft(
  alertEscalation: OpsAlertEscalation | null
): AlertEscalationDraft {
  const policy = alertEscalation?.policy;
  const hasOverride = policy?.source === "owner_override";

  return {
    firstReminderDelayMinutes:
      hasOverride && policy.firstReminderDelayMinutes !== null
        ? String(policy.firstReminderDelayMinutes)
        : "60",
    repeatReminderIntervalMinutes:
      hasOverride && policy.repeatReminderIntervalMinutes !== null
        ? String(policy.repeatReminderIntervalMinutes)
        : "180"
  };
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
  const [alertEscalationDraft, setAlertEscalationDraft] =
    useState<AlertEscalationDraft>(() =>
      createAlertEscalationDraft(operator.alertEscalation)
    );
  const [alertScheduleDraft, setAlertScheduleDraft] =
    useState<AlertScheduleDraft>(() =>
      createAlertScheduleDraft(operator.alertSchedule)
    );
  const [acknowledgingAlertStateId, setAcknowledgingAlertStateId] = useState<
    string | null
  >(null);
  const [clearingMuteCode, setClearingMuteCode] = useState<string | null>(null);
  const [savingAlertRoutingAction, setSavingAlertRoutingAction] = useState<
    "all" | "critical_only" | "default" | "disabled" | null
  >(null);
  const [savingAlertEscalationAction, setSavingAlertEscalationAction] =
    useState<"default" | "save" | null>(null);
  const [savingAlertScheduleAction, setSavingAlertScheduleAction] = useState<
    "default" | "save" | null
  >(null);
  const [mutingAlertStateId, setMutingAlertStateId] = useState<string | null>(
    null
  );
  const [retryingGenerationRequestId, setRetryingGenerationRequestId] =
    useState<string | null>(null);

  useEffect(() => {
    setAlertEscalationDraft(createAlertEscalationDraft(operator.alertEscalation));
  }, [operator.alertEscalation]);

  useEffect(() => {
    setAlertScheduleDraft(createAlertScheduleDraft(operator.alertSchedule));
  }, [operator.alertSchedule]);

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

  const updateAlertRoutingPolicy = async (
    webhookMode: "all" | "critical_only" | "disabled"
  ) => {
    setSavingAlertRoutingAction(webhookMode);
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-routing", {
        body: JSON.stringify({
          webhookMode
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
            : "Alert routing policy could not be updated.";

        throw new Error(message);
      }

      setNotice({
        message:
          webhookMode === "disabled"
            ? "Webhook alert delivery was disabled for this operator."
            : webhookMode === "critical_only"
              ? "Webhook alert delivery is now limited to critical alerts."
              : "Webhook alert delivery is now enabled for warning and critical alerts.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert routing policy could not be updated.",
        tone: "error"
      });
    } finally {
      setSavingAlertRoutingAction(null);
    }
  };

  const resetAlertRoutingPolicy = async () => {
    setSavingAlertRoutingAction("default");
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-routing", {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert routing policy could not be reset.";

        throw new Error(message);
      }

      setNotice({
        message: "Webhook alert routing was reset to the default policy.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert routing policy could not be reset.",
        tone: "error"
      });
    } finally {
      setSavingAlertRoutingAction(null);
    }
  };

  const updateAlertEscalationPolicy = async () => {
    const firstReminderDelayMinutes = Number.parseInt(
      alertEscalationDraft.firstReminderDelayMinutes,
      10
    );
    const repeatReminderIntervalMinutes = Number.parseInt(
      alertEscalationDraft.repeatReminderIntervalMinutes,
      10
    );

    if (
      !Number.isInteger(firstReminderDelayMinutes) ||
      !Number.isInteger(repeatReminderIntervalMinutes) ||
      firstReminderDelayMinutes < 1 ||
      repeatReminderIntervalMinutes < 1
    ) {
      setNotice({
        message:
          "Alert escalation requires positive whole-minute reminder delays.",
        tone: "error"
      });
      return;
    }

    setSavingAlertEscalationAction("save");
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-escalation", {
        body: JSON.stringify({
          firstReminderDelayMinutes,
          repeatReminderIntervalMinutes
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
            : "Alert escalation policy could not be updated.";

        throw new Error(message);
      }

      setNotice({
        message:
          "Webhook alert escalation policy was updated for this operator.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert escalation policy could not be updated.",
        tone: "error"
      });
    } finally {
      setSavingAlertEscalationAction(null);
    }
  };

  const resetAlertEscalationPolicy = async () => {
    setSavingAlertEscalationAction("default");
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-escalation", {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert escalation policy could not be reset.";

        throw new Error(message);
      }

      setNotice({
        message: "Webhook alert escalation policy was reset to the default policy.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert escalation policy could not be reset.",
        tone: "error"
      });
    } finally {
      setSavingAlertEscalationAction(null);
    }
  };

  const updateAlertSchedulePolicy = async () => {
    const startMinuteOfDay = alertScheduleDraft.allDay
      ? 0
      : parseTimeValueToMinuteOfDay(alertScheduleDraft.startTime);
    const endMinuteOfDay = alertScheduleDraft.allDay
      ? 1440
      : parseTimeValueToMinuteOfDay(alertScheduleDraft.endTime);

    if (
      startMinuteOfDay === null ||
      endMinuteOfDay === null ||
      alertScheduleDraft.activeDays.length === 0
    ) {
      setNotice({
        message:
          "Alert schedule requires a valid timezone, at least one active day, and a valid delivery window.",
        tone: "error"
      });
      return;
    }

    setSavingAlertScheduleAction("save");
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-schedule", {
        body: JSON.stringify({
          activeDays: alertScheduleDraft.activeDays,
          endMinuteOfDay,
          startMinuteOfDay,
          timezone: alertScheduleDraft.timezone.trim()
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
            : "Alert delivery schedule could not be updated.";

        throw new Error(message);
      }

      setNotice({
        message:
          "Webhook alert delivery schedule was updated for this operator.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert delivery schedule could not be updated.",
        tone: "error"
      });
    } finally {
      setSavingAlertScheduleAction(null);
    }
  };

  const resetAlertSchedulePolicy = async () => {
    setSavingAlertScheduleAction("default");
    setNotice(null);

    try {
      const response = await fetch("/api/ops/alert-schedule", {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Alert delivery schedule could not be reset.";

        throw new Error(message);
      }

      setNotice({
        message: "Webhook alert delivery schedule was reset to the default policy.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Alert delivery schedule could not be reset.",
        tone: "error"
      });
    } finally {
      setSavingAlertScheduleAction(null);
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
  const alertEscalation = operator.alertEscalation;
  const alertRouting = operator.alertRouting;
  const alertSchedule = operator.alertSchedule;
  const captureAutomation = operator.captureAutomation;
  const history = operator.history;
  const observability = operator.observability;
  const observabilityTone = resolveStatusBannerTone(
    observability?.status ?? "unreachable"
  );
  const alertRoutingTone = resolveAlertRoutingTone(
    alertRouting?.status ?? "unreachable"
  );
  const alertEscalationTone = resolveAlertEscalationTone(
    alertEscalation?.status ?? "unreachable"
  );
  const alertScheduleTone = resolveAlertScheduleTone(
    alertSchedule?.status ?? "unreachable"
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
          alertRouting?.message ??
          "Alert routing policy is only loaded after the operator session resolves."
        }
        eyebrow={alertRouting?.status ?? "unreachable"}
        span={12}
        title="Alert routing policy"
      >
        {alertRouting ? (
          <>
            <div className={`status-banner status-banner--${alertRoutingTone}`}>
              <strong>{alertRouting.status}</strong>
              <span>{alertRouting.message}</span>
            </div>
            <div className="pill-row">
              <Pill>
                {alertRouting.webhookConfigured
                  ? "Webhook configured"
                  : "Webhook not configured"}
              </Pill>
              <Pill>{alertRouting.policy.webhookMode}</Pill>
              <Pill>{alertRouting.policy.source}</Pill>
              <Pill>
                Updated{" "}
                {alertRouting.policy.updatedAt
                  ? formatDateTime(alertRouting.policy.updatedAt)
                  : "default"}
              </Pill>
            </div>
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={
                  savingAlertRoutingAction !== null ||
                  alertRouting.policy.webhookMode === "all"
                }
                onClick={() => {
                  void updateAlertRoutingPolicy("all");
                }}
                type="button"
              >
                {savingAlertRoutingAction === "all"
                  ? "Saving…"
                  : "Route all alerts"}
              </button>
              <button
                className="button-action"
                disabled={
                  savingAlertRoutingAction !== null ||
                  alertRouting.policy.webhookMode === "critical_only"
                }
                onClick={() => {
                  void updateAlertRoutingPolicy("critical_only");
                }}
                type="button"
              >
                {savingAlertRoutingAction === "critical_only"
                  ? "Saving…"
                  : "Critical only"}
              </button>
              <button
                className="button-action"
                disabled={
                  savingAlertRoutingAction !== null ||
                  alertRouting.policy.webhookMode === "disabled"
                }
                onClick={() => {
                  void updateAlertRoutingPolicy("disabled");
                }}
                type="button"
              >
                {savingAlertRoutingAction === "disabled"
                  ? "Saving…"
                  : "Disable webhook"}
              </button>
              {alertRouting.policy.source === "owner_override" ? (
                <button
                  className="button-action"
                  disabled={savingAlertRoutingAction !== null}
                  onClick={() => {
                    void resetAlertRoutingPolicy();
                  }}
                  type="button"
                >
                  {savingAlertRoutingAction === "default"
                    ? "Resetting…"
                    : "Use default"}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body={
          alertSchedule?.message ??
          "Alert delivery schedule is only loaded after the operator session resolves."
        }
        eyebrow={alertSchedule?.status ?? "unreachable"}
        span={12}
        title="Alert delivery schedule"
      >
        {alertSchedule ? (
          <>
            <div className={`status-banner status-banner--${alertScheduleTone}`}>
              <strong>{alertSchedule.status}</strong>
              <span>{alertSchedule.message}</span>
            </div>
            <div className="pill-row">
              <Pill>
                {alertSchedule.webhookConfigured
                  ? "Webhook configured"
                  : "Webhook not configured"}
              </Pill>
              <Pill>{alertSchedule.policy.source}</Pill>
              <Pill>
                {alertSchedule.policy.source === "owner_override"
                  ? formatAlertScheduleDayList(alertSchedule.policy.activeDays)
                  : "Always"}
              </Pill>
              <Pill>
                {alertSchedule.policy.source === "owner_override" &&
                alertSchedule.policy.startMinuteOfDay !== null &&
                alertSchedule.policy.endMinuteOfDay !== null
                  ? `${formatOpsAlertScheduleMinuteOfDay(
                      alertSchedule.policy.startMinuteOfDay
                    )}-${formatOpsAlertScheduleMinuteOfDay(
                      alertSchedule.policy.endMinuteOfDay
                    )}`
                  : "All hours"}
              </Pill>
              <Pill>
                {alertSchedule.policy.timezone ?? alertScheduleDraft.timezone}
              </Pill>
              <Pill>
                Local now {alertSchedule.localTimeLabel ?? "n/a"}
              </Pill>
            </div>
            <div className="ops-settings-grid">
              <label className="studio-field">
                <span>Timezone</span>
                <input
                  className="studio-input"
                  disabled={savingAlertScheduleAction !== null}
                  onChange={(event) => {
                    setAlertScheduleDraft((currentDraft) => ({
                      ...currentDraft,
                      timezone: event.target.value
                    }));
                  }}
                  type="text"
                  value={alertScheduleDraft.timezone}
                />
              </label>
              <label className="studio-field">
                <span>Start</span>
                <input
                  className="studio-input"
                  disabled={
                    savingAlertScheduleAction !== null ||
                    alertScheduleDraft.allDay
                  }
                  onChange={(event) => {
                    setAlertScheduleDraft((currentDraft) => ({
                      ...currentDraft,
                      startTime: event.target.value
                    }));
                  }}
                  step={60}
                  type="time"
                  value={alertScheduleDraft.startTime}
                />
              </label>
              <label className="studio-field">
                <span>End</span>
                <input
                  className="studio-input"
                  disabled={
                    savingAlertScheduleAction !== null ||
                    alertScheduleDraft.allDay
                  }
                  onChange={(event) => {
                    setAlertScheduleDraft((currentDraft) => ({
                      ...currentDraft,
                      endTime: event.target.value
                    }));
                  }}
                  step={60}
                  type="time"
                  value={alertScheduleDraft.endTime}
                />
              </label>
              <label className="studio-checkbox">
                <input
                  checked={alertScheduleDraft.allDay}
                  disabled={savingAlertScheduleAction !== null}
                  onChange={(event) => {
                    setAlertScheduleDraft((currentDraft) => ({
                      ...currentDraft,
                      allDay: event.target.checked
                    }));
                  }}
                  type="checkbox"
                />
                <span>All day on active days</span>
              </label>
            </div>
            <div className="pill-row">
              {opsAlertScheduleDayValues.map((activeDay) => {
                const selected =
                  alertScheduleDraft.activeDays.includes(activeDay);

                return (
                  <button
                    aria-pressed={selected}
                    className="button-action"
                    disabled={savingAlertScheduleAction !== null}
                    key={activeDay}
                    onClick={() => {
                      setAlertScheduleDraft((currentDraft) => ({
                        ...currentDraft,
                        activeDays: currentDraft.activeDays.includes(activeDay)
                          ? currentDraft.activeDays.filter(
                              (scheduleDay) => scheduleDay !== activeDay
                            )
                          : opsAlertScheduleDayValues.filter(
                              (scheduleDay) =>
                                scheduleDay === activeDay ||
                                currentDraft.activeDays.includes(scheduleDay)
                            )
                      }));
                    }}
                    type="button"
                  >
                    {alertScheduleDayLabelByValue[activeDay]}
                    {selected ? " on" : ""}
                  </button>
                );
              })}
            </div>
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={savingAlertScheduleAction !== null}
                onClick={() => {
                  void updateAlertSchedulePolicy();
                }}
                type="button"
              >
                {savingAlertScheduleAction === "save"
                  ? "Saving…"
                  : "Save schedule"}
              </button>
              {alertSchedule.policy.source === "owner_override" ? (
                <button
                  className="button-action"
                  disabled={savingAlertScheduleAction !== null}
                  onClick={() => {
                    void resetAlertSchedulePolicy();
                  }}
                  type="button"
                >
                  {savingAlertScheduleAction === "default"
                    ? "Resetting…"
                    : "Use default"}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </SurfaceCard>
      <SurfaceCard
        body={
          alertEscalation?.message ??
          "Alert escalation policy is only loaded after the operator session resolves."
        }
        eyebrow={alertEscalation?.status ?? "unreachable"}
        span={12}
        title="Alert escalation policy"
      >
        {alertEscalation ? (
          <>
            <div
              className={`status-banner status-banner--${alertEscalationTone}`}
            >
              <strong>{alertEscalation.status}</strong>
              <span>{alertEscalation.message}</span>
            </div>
            <div className="pill-row">
              <Pill>
                {alertEscalation.webhookConfigured
                  ? "Webhook configured"
                  : "Webhook not configured"}
              </Pill>
              <Pill>{alertEscalation.policy.source}</Pill>
              <Pill>
                First reminder{" "}
                {alertEscalation.policy.firstReminderDelayMinutes !== null
                  ? formatDurationSeconds(
                      alertEscalation.policy.firstReminderDelayMinutes * 60
                    )
                  : "disabled"}
              </Pill>
              <Pill>
                Repeat every{" "}
                {alertEscalation.policy.repeatReminderIntervalMinutes !== null
                  ? formatDurationSeconds(
                      alertEscalation.policy.repeatReminderIntervalMinutes * 60
                    )
                  : "disabled"}
              </Pill>
              <Pill>
                Updated{" "}
                {alertEscalation.policy.updatedAt
                  ? formatDateTime(alertEscalation.policy.updatedAt)
                  : "default"}
              </Pill>
            </div>
            <div className="ops-settings-grid">
              <label className="studio-field">
                <span>First reminder (minutes)</span>
                <input
                  className="studio-input"
                  disabled={savingAlertEscalationAction !== null}
                  min={1}
                  onChange={(event) => {
                    setAlertEscalationDraft((currentDraft) => ({
                      ...currentDraft,
                      firstReminderDelayMinutes: event.target.value
                    }));
                  }}
                  step={1}
                  type="number"
                  value={alertEscalationDraft.firstReminderDelayMinutes}
                />
              </label>
              <label className="studio-field">
                <span>Repeat interval (minutes)</span>
                <input
                  className="studio-input"
                  disabled={savingAlertEscalationAction !== null}
                  min={1}
                  onChange={(event) => {
                    setAlertEscalationDraft((currentDraft) => ({
                      ...currentDraft,
                      repeatReminderIntervalMinutes: event.target.value
                    }));
                  }}
                  step={1}
                  type="number"
                  value={alertEscalationDraft.repeatReminderIntervalMinutes}
                />
              </label>
            </div>
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={savingAlertEscalationAction !== null}
                onClick={() => {
                  void updateAlertEscalationPolicy();
                }}
                type="button"
              >
                {savingAlertEscalationAction === "save"
                  ? "Saving…"
                  : "Save escalation"}
              </button>
              {alertEscalation.policy.source === "owner_override" ? (
                <button
                  className="button-action"
                  disabled={savingAlertEscalationAction !== null}
                  onClick={() => {
                    void resetAlertEscalationPolicy();
                  }}
                  type="button"
                >
                  {savingAlertEscalationAction === "default"
                    ? "Resetting…"
                    : "Use default"}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
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
