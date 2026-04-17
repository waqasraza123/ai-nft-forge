"use client";

import {
  formatOpsAlertScheduleMinuteOfDay,
  opsAlertScheduleDayValues,
  type OpsAlertScheduleDay
} from "@ai-nft-forge/shared";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  type ButtonHTMLAttributes,
  useEffect,
  useState
} from "react";

import {
  StatusBanner,
  ActionButton,
  ActionLink,
  cn,
  FieldLabel,
  FieldStack,
  InputField,
  OpsPanelCard,
  OpsEmptyState,
  OpsStatusNotice,
  MetricTile,
  Pill
} from "@ai-nft-forge/ui";

import type {
  OpsAlertDeliverySummary,
  OpsAlertEscalation,
  OpsAlertMuteSummary,
  OpsAlertRouting,
  OpsAlertSchedule,
  OpsAlertStateSummary,
  OpsCaptureAutomation,
  OpsGenerationActivitySummary,
  OpsGenerationWindowSummary,
  OpsOperatorObservability,
  OpsPersistedCaptureSummary,
  OpsReconciliationAutomation,
  OpsReconciliationSummary,
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

type OpsCommandTone = "critical" | "healthy" | "neutral" | "warning";

const alertScheduleDayLabelByValue: Record<OpsAlertScheduleDay, string> = {
  fri: "Fri",
  mon: "Mon",
  sat: "Sat",
  sun: "Sun",
  thu: "Thu",
  tue: "Tue",
  wed: "Wed"
};

function resolveOpsGridClass() {
  return "grid gap-4 xl:grid-cols-6";
}

function resolveOpsSettingsGridClass() {
  return "grid gap-3 md:grid-cols-2 xl:grid-cols-4";
}

function resolveOpsCheckboxClass() {
  return "flex items-center gap-2.5 text-sm text-[color:var(--color-text)]";
}

function resolveOpsCheckboxInputClass() {
  return "size-4 rounded border border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]";
}

type OpsActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

function OpsActionButton({ className, ...props }: OpsActionButtonProps) {
  return (
    <ActionButton
      className={cn(
        "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
        className
      )}
      tone="secondary"
      {...props}
    />
  );
}

function resolveOpsPillRowClass() {
  return "flex flex-wrap gap-2";
}

function resolveOpsCommandSignalTone(tone: OpsCommandTone) {
  if (tone === "critical") {
    return "border-rose-400/45 bg-rose-500/12 text-rose-100";
  }

  if (tone === "warning") {
    return "border-amber-400/35 bg-amber-500/12 text-amber-100";
  }

  if (tone === "healthy") {
    return "border-emerald-400/35 bg-emerald-500/12 text-emerald-100";
  }

  return "border-[color:var(--color-line)] bg-[color:var(--color-surface)]/65 text-[color:var(--color-text)]";
}

function resolveOpsActionRowClass() {
  return "mt-2 flex flex-wrap gap-2";
}

function resolveOpsCommandSignalGridClass() {
  return "grid gap-4 xl:grid-cols-3";
}

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

function resolveReconciliationBannerTone(
  status: OpsReconciliationSummary["status"]
) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "stale") {
    return "info";
  }

  return "error";
}

function resolveReconciliationAutomationTone(
  status: OpsReconciliationAutomation["status"]
) {
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

function resolveNoticeBannerTone(
  tone: "error" | "info" | "success"
): "error" | "info" | "success" {
  if (tone === "error") {
    return "error";
  }

  if (tone === "success") {
    return "success";
  }

  return "info";
}

function resolveOpsCommandToneFromObservability(
  status: OpsOperatorObservability["status"] | null | undefined
): OpsCommandTone {
  if (status === "critical" || status === "unreachable") {
    return "critical";
  }

  if (status === "warning") {
    return "warning";
  }

  if (status === "ok") {
    return "healthy";
  }

  return "neutral";
}

function resolveOpsCommandToneFromRouting(
  status: OpsAlertRouting["status"] | null | undefined
): OpsCommandTone {
  if (status === "unreachable") {
    return "critical";
  }

  if (status === "unconfigured") {
    return "warning";
  }

  if (status === "configured") {
    return "healthy";
  }

  return "neutral";
}

function resolveOpsCommandToneFromEscalation(
  status: OpsAlertEscalation["status"] | null | undefined
): OpsCommandTone {
  if (status === "unreachable") {
    return "critical";
  }

  if (status === "disabled" || status === "unconfigured") {
    return "warning";
  }

  if (status === "configured") {
    return "healthy";
  }

  return "neutral";
}

function resolveOpsCommandToneFromSchedule(
  status: OpsAlertSchedule["status"] | null | undefined
): OpsCommandTone {
  if (status === "inactive" || status === "unreachable") {
    return "critical";
  }

  if (status === "unconfigured") {
    return "warning";
  }

  if (status === "active") {
    return "healthy";
  }

  return "neutral";
}

function resolveOpsCommandToneFromReconciliation(
  status: OpsReconciliationSummary["status"] | null | undefined
): OpsCommandTone {
  if (status === "warning" || status === "unreachable") {
    return "critical";
  }

  if (status === "stale") {
    return "warning";
  }

  if (status === "healthy") {
    return "healthy";
  }

  return "neutral";
}

function resolveOpsCommandToneFromAutomation(
  status:
    | OpsCaptureAutomation["status"]
    | OpsReconciliationAutomation["status"]
    | null
    | undefined
): OpsCommandTone {
  if (status === "stale" || status === "unreachable" || status === "warning") {
    return "critical";
  }

  if (status === "disabled") {
    return "warning";
  }

  if (status === "healthy") {
    return "healthy";
  }

  return "neutral";
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

  return activeDays
    .map((activeDay) => alertScheduleDayLabelByValue[activeDay])
    .join(", ");
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
  const startMinuteOfDay = hasOverride ? (policy.startMinuteOfDay ?? 540) : 540;
  const endMinuteOfDay = hasOverride ? (policy.endMinuteOfDay ?? 1020) : 1020;

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
    timezone: hasOverride && policy.timezone !== null ? policy.timezone : "UTC"
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

function OpsCommandSection({
  children,
  description,
  eyebrow,
  title
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className={resolveOpsCommandSectionClass()}>
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
          {title}
        </h2>
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function resolveOpsCommandSectionClass() {
  return "space-y-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-background)] p-4";
}

function OpsCommandModule({
  actions,
  children,
  description,
  eyebrow,
  span = "standard",
  tone = "neutral",
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  span?: "full" | "standard" | "wide";
  tone?: OpsCommandTone;
  title: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-surface)]",
        resolveOpsCommandToneClasses(tone),
        span === "wide" && "xl:col-span-2",
        span === "full" && "xl:col-span-6",
        span === "standard" && "xl:col-span-3",
        "space-y-3"
      )}
    >
      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
          {eyebrow}
        </span>
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm text-[color:var(--color-muted)]">{description}</p>
      </div>
      {actions ? (
        <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
      ) : null}
      <div className="space-y-3">{children}</div>
    </article>
  );
}

function resolveOpsCommandToneClasses(tone: OpsCommandTone) {
  if (tone === "critical") {
    return "ring-1 ring-rose-400/20";
  }

  if (tone === "warning") {
    return "ring-1 ring-amber-400/20";
  }

  if (tone === "healthy") {
    return "ring-1 ring-emerald-400/20";
  }

  return "ring-1 ring-transparent";
}

function OpsCommandSignal({
  detail,
  label,
  meta,
  tone,
  value
}: {
  detail: string;
  label: string;
  meta: string;
  tone: OpsCommandTone;
  value: string;
}) {
  return (
    <OpsPanelCard tone={tone} className="space-y-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
        {label}
      </span>
      <strong className="text-2xl text-[color:var(--color-text)]">
        {value}
      </strong>
      <span className="text-sm text-[color:var(--color-muted)]">{detail}</span>
      <span className="text-xs text-[color:var(--color-muted)]">{meta}</span>
    </OpsPanelCard>
  );
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
  const itemTone: OpsCommandTone =
    activity.status === "failed"
      ? "warning"
      : activity.status === "running" || activity.status === "queued"
        ? "neutral"
        : "healthy";

  return (
    <OpsPanelCard tone={itemTone}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{activity.sourceAsset.originalFilename}</strong>
          <span>{renderActivityTiming(activity)}</span>
        </div>
        <Pill>{activity.status}</Pill>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill>{activity.pipelineKey}</Pill>
        <Pill>{activity.requestedVariantCount} variants</Pill>
        <Pill>{activity.generatedAssetCount} stored rows</Pill>
        <Pill>{activity.queueJobId ?? "No queue job id"}</Pill>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-[color:var(--color-muted)] sm:grid-cols-2">
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
        <div
          className={cn(
            "rounded-xl border border-red-500/45 bg-red-500/12 p-3 text-sm text-red-50",
            "leading-tight"
          )}
        >
          <strong>{activity.failureCode ?? "GENERATION_FAILED"}</strong>
          <span>{activity.failureMessage}</span>
        </div>
      ) : null}
      {onRetry ? (
        <div className={resolveOpsActionRowClass()}>
          <OpsActionButton
            disabled={retrying}
            onClick={() => {
              void onRetry(activity.id);
            }}
            type="button"
          >
            {retrying ? "Retrying…" : "Retry generation"}
          </OpsActionButton>
        </div>
      ) : null}
    </OpsPanelCard>
  );
}

function WindowSummary({ window }: { window: OpsGenerationWindowSummary }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-3",
        resolveOpsCaptureWindowTone("neutral")
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{window.label}</strong>
          <span>From {formatDateTime(window.from)}</span>
        </div>
        <Pill>{window.windowKey}</Pill>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
  const itemTone =
    capture.observabilityStatus === "critical"
      ? "critical"
      : capture.observabilityStatus === "warning"
        ? "warning"
        : "neutral";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-3",
        resolveOpsCaptureWindowTone(itemTone)
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{formatDateTime(capture.capturedAt)}</strong>
          <span>{capture.observabilityMessage}</span>
        </div>
        <Pill>{capture.observabilityStatus}</Pill>
      </div>
      <div className="flex flex-wrap gap-2">
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
      <div className="mt-2 flex flex-wrap gap-2">
        <Pill>Waiting {capture.queueCounts.waiting ?? "n/a"}</Pill>
        <Pill>Active {capture.queueCounts.active ?? "n/a"}</Pill>
        <Pill>Failed {capture.queueCounts.failed ?? "n/a"}</Pill>
        <Pill>Completed {capture.queueCounts.completed ?? "n/a"}</Pill>
      </div>
      <div className="mt-2 grid gap-2">
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
      ? "critical"
      : delivery.severity === "critical"
        ? "warning"
        : "neutral";

  return (
    <OpsPanelCard tone={tone}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{delivery.title}</strong>
          <span>{delivery.message}</span>
        </div>
        <Pill>{delivery.deliveryState}</Pill>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill>{delivery.code}</Pill>
        <Pill>{delivery.severity}</Pill>
        <Pill>{delivery.deliveryChannel}</Pill>
      </div>
      <StatusBanner
        tone={
          delivery.deliveryState === "failed"
            ? "error"
            : delivery.severity === "critical"
              ? "info"
              : "success"
        }
      >
        <strong>
          {delivery.deliveredAt
            ? `Delivered ${formatDateTime(delivery.deliveredAt)}`
            : `Recorded ${formatDateTime(delivery.createdAt)}`}
        </strong>
        <span>
          {delivery.failureMessage ??
            "This alert was persisted through an operator delivery channel."}
        </span>
      </StatusBanner>
    </OpsPanelCard>
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
  const tone = alert.severity === "critical" ? "critical" : "warning";

  return (
    <OpsPanelCard tone={tone}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{alert.title}</strong>
          <span>{alert.message}</span>
        </div>
        <Pill>{alert.severity}</Pill>
      </div>
      <div className="flex flex-wrap gap-2">
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
      <StatusBanner tone={alert.severity === "critical" ? "error" : "info"}>
        <strong>First seen {formatDateTime(alert.firstObservedAt)}</strong>
        <span>Last seen {formatDateTime(alert.lastObservedAt)}</span>
        <span>
          Last delivered{" "}
          {alert.lastDeliveredAt
            ? formatDateTime(alert.lastDeliveredAt)
            : "not recorded"}
        </span>
      </StatusBanner>
      <div className={resolveOpsActionRowClass()}>
        {!alert.acknowledgedAt ? (
          <OpsActionButton
            disabled={acknowledging}
            onClick={() => {
              void onAcknowledge(alert.id);
            }}
            type="button"
          >
            {acknowledging ? "Acknowledging…" : "Acknowledge alert"}
          </OpsActionButton>
        ) : null}
        <OpsActionButton
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 1);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 1h"}
        </OpsActionButton>
        <OpsActionButton
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 24);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 1d"}
        </OpsActionButton>
        <OpsActionButton
          disabled={muting || clearingMute}
          onClick={() => {
            void onMute(alert.id, 24 * 7);
          }}
          type="button"
        >
          {muting ? "Saving mute…" : "Mute 7d"}
        </OpsActionButton>
        {alert.mutedUntil ? (
          <OpsActionButton
            disabled={muting || clearingMute}
            onClick={() => {
              void onClearMute(alert.id);
            }}
            type="button"
          >
            {clearingMute ? "Clearing mute…" : "Clear mute"}
          </OpsActionButton>
        ) : null}
      </div>
    </OpsPanelCard>
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
    <OpsPanelCard tone="neutral">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong>{mute.code}</strong>
          <span>Muted until {formatDateTime(mute.mutedUntil)}</span>
        </div>
        <Pill>mute</Pill>
      </div>
      <div className={resolveOpsActionRowClass()}>
        <OpsActionButton
          disabled={clearing}
          onClick={() => {
            void onClear(mute.code);
          }}
          type="button"
        >
          {clearing ? "Clearing mute…" : "Clear mute"}
        </OpsActionButton>
      </div>
    </OpsPanelCard>
  );
}

function resolveOpsCaptureWindowTone(tone: OpsCommandTone) {
  if (tone === "critical") {
    return "border-rose-400/35";
  }

  if (tone === "warning") {
    return "border-amber-400/30";
  }

  return "border-[color:var(--color-line)]";
}

function resolveOpsCommandWindowClass() {
  return "grid gap-2";
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
  const [repairingReconciliationIssueId, setRepairingReconciliationIssueId] =
    useState<string | null>(null);
  const [ignoringReconciliationIssueId, setIgnoringReconciliationIssueId] =
    useState<string | null>(null);
  const [runningReconciliation, setRunningReconciliation] = useState(false);
  const [retryingGenerationRequestId, setRetryingGenerationRequestId] =
    useState<string | null>(null);
  const canManageOpsPolicy = operator.access?.canManageOpsPolicy ?? false;
  const operatorRoleLabel =
    operator.access?.role === "owner" ? "Owner" : "Operator";

  useEffect(() => {
    setAlertEscalationDraft(
      createAlertEscalationDraft(operator.alertEscalation)
    );
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

  const runReconciliation = async () => {
    setRunningReconciliation(true);
    setNotice(null);

    try {
      const response = await fetch("/api/ops/reconciliation/run", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Reconciliation could not be started."
        );
      }

      setNotice({
        message: "Reconciliation run completed from the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Reconciliation could not be started.",
        tone: "error"
      });
    } finally {
      setRunningReconciliation(false);
    }
  };

  const repairReconciliationIssue = async (issueId: string) => {
    setRepairingReconciliationIssueId(issueId);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/ops/reconciliation/issues/${issueId}/repair`,
        {
          method: "POST"
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Reconciliation repair could not be completed."
        );
      }

      setNotice({
        message: "Reconciliation repair completed from the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Reconciliation repair could not be completed.",
        tone: "error"
      });
    } finally {
      setRepairingReconciliationIssueId(null);
    }
  };

  const ignoreReconciliationIssue = async (issueId: string) => {
    setIgnoringReconciliationIssueId(issueId);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/ops/reconciliation/issues/${issueId}/ignore`,
        {
          method: "POST"
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : "Reconciliation issue could not be ignored."
        );
      }

      setNotice({
        message: "Reconciliation issue was ignored from the ops surface.",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Reconciliation issue could not be ignored.",
        tone: "error"
      });
    } finally {
      setIgnoringReconciliationIssueId(null);
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
        message:
          "Webhook alert escalation policy was reset to the default policy.",
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
        message:
          "Webhook alert delivery schedule was reset to the default policy.",
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
      <div className="space-y-6">
        <OpsCommandSection
          description="Public runtime health is still visible above, but live queue state, alert controls, reconciliation, and generation recovery stay behind the authenticated operator boundary."
          eyebrow="Operator access"
          title="Authentication unlocks command actions"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <OpsCommandModule
              description="Use a studio session to move from passive runtime checks into queue triage, alert handling, reconciliation repair, and retry control."
              eyebrow="Sign-in required"
              title="Operator command surface"
              tone="warning"
            >
              <div className="flex flex-wrap gap-2">
                <Pill>Queue depth hidden</Pill>
                <Pill>Active alerts hidden</Pill>
                <Pill>Reconciliation hidden</Pill>
                <Pill>Retry actions disabled</Pill>
              </div>
              <div className="mt-3">
                <ActionLink href="/sign-in?next=%2Fops" tone="action">
                  Sign in to /ops
                </ActionLink>
              </div>
            </OpsCommandModule>
            <OpsCommandModule
              description="Workspace-aware commands stay protected so alert policy and remediation actions remain scoped to a real owner or operator session."
              eyebrow="Available after sign-in"
              title="What the locked view omits"
            >
              <div className="flex flex-wrap gap-2">
                <Pill>Workspace-scoped queue metrics</Pill>
                <Pill>Persisted alerts and mutes</Pill>
                <Pill>Reconciliation issues and repairs</Pill>
                <Pill>Owner retry controls</Pill>
              </div>
            </OpsCommandModule>
          </div>
        </OpsCommandSection>
      </div>
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
  const reconciliation = operator.reconciliation;
  const reconciliationAutomation = operator.reconciliationAutomation;
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
  const reconciliationTone = resolveReconciliationBannerTone(
    reconciliation?.status ?? "unreachable"
  );
  const reconciliationAutomationTone = resolveReconciliationAutomationTone(
    reconciliationAutomation?.status ?? "unreachable"
  );
  const activeAlerts = history?.activeAlerts ?? [];
  const activeMutes = history?.activeMutes ?? [];
  const alertDeliveries = history?.deliveries ?? [];
  const persistedCaptures = history?.captures ?? [];
  const derivedAlerts = observability?.alerts ?? [];
  const activeRequests = activity?.active ?? [];
  const retryableFailures = activity?.retryableFailures ?? [];
  const openIssues = reconciliation?.openIssues ?? [];
  const criticalActiveAlertCount = activeAlerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const warningActiveAlertCount =
    activeAlerts.length - criticalActiveAlertCount;
  const criticalDerivedAlertCount = derivedAlerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const attentionCriticalCount =
    criticalActiveAlertCount + (reconciliation?.openCriticalIssueCount ?? 0);
  const attentionWarningCount =
    warningActiveAlertCount +
    (reconciliation?.openWarningIssueCount ?? 0) +
    (criticalDerivedAlertCount > 0 ? 0 : derivedAlerts.length);
  const attentionTone: OpsCommandTone =
    attentionCriticalCount > 0
      ? "critical"
      : attentionWarningCount > 0 ||
          observability?.status === "warning" ||
          observability?.status === "critical"
        ? "warning"
        : "healthy";
  const queueTone: OpsCommandTone =
    queue?.status === "unreachable"
      ? "critical"
      : queue?.counts?.failed && queue.counts.failed > 0
        ? "warning"
        : queue?.status === "ok"
          ? "healthy"
          : "neutral";
  const automationTone: OpsCommandTone =
    resolveOpsCommandToneFromAutomation(captureAutomation?.status) ===
      "critical" ||
    resolveOpsCommandToneFromAutomation(reconciliationAutomation?.status) ===
      "critical"
      ? "critical"
      : resolveOpsCommandToneFromAutomation(captureAutomation?.status) ===
            "warning" ||
          resolveOpsCommandToneFromAutomation(
            reconciliationAutomation?.status
          ) === "warning"
        ? "warning"
        : captureAutomation || reconciliationAutomation
          ? "healthy"
          : "neutral";
  const policyToneCandidates: OpsCommandTone[] = [
    resolveOpsCommandToneFromRouting(alertRouting?.status),
    resolveOpsCommandToneFromSchedule(alertSchedule?.status),
    resolveOpsCommandToneFromEscalation(alertEscalation?.status)
  ];
  const policyTone = policyToneCandidates.includes("critical")
    ? "critical"
    : policyToneCandidates.includes("warning")
      ? "warning"
      : policyToneCandidates.includes("healthy")
        ? "healthy"
        : "neutral";
  const activityTone: OpsCommandTone =
    retryableFailures.length > 0
      ? "warning"
      : activeRequests.length > 0
        ? "neutral"
        : "healthy";
  const historyTone: OpsCommandTone =
    persistedCaptures.length > 0 || alertDeliveries.length > 0
      ? "neutral"
      : "healthy";

  return (
    <div className="space-y-6">
      {notice ? (
        <OpsStatusNotice
          tone={resolveNoticeBannerTone(notice.tone)}
          title={
            notice.tone === "error"
              ? "Operator action failed"
              : notice.tone === "success"
                ? "Operator action recorded"
                : "Operator action in progress"
          }
        >
          {notice.message}
        </OpsStatusNotice>
      ) : null}
      <div className={resolveOpsCommandSignalGridClass()}>
        <OpsCommandSignal
          detail={`${activeAlerts.length} persisted alerts · ${openIssues.length} reconciliation issues`}
          label="Needs attention"
          meta={`${criticalDerivedAlertCount} critical derived alerts in the latest runtime snapshot`}
          tone={attentionTone}
          value={
            attentionCriticalCount > 0
              ? `${attentionCriticalCount} critical`
              : attentionWarningCount > 0
                ? `${attentionWarningCount} warning`
                : "Stable"
          }
        />
        <OpsCommandSignal
          detail={
            queue?.status === "ok"
              ? `Waiting ${queue.counts.waiting} · Active ${queue.counts.active} · Failed ${queue.counts.failed}`
              : (queue?.message ??
                "Queue depth is unavailable for the current session.")
          }
          label="Queue runtime"
          meta={
            queue?.status === "ok"
              ? `${queue.workerAdapter ?? "Unknown adapter"} · ${queue.concurrency}x concurrency`
              : `Checked ${queue ? formatDateTime(queue.checkedAt) : "n/a"}`
          }
          tone={queueTone}
          value={
            queue?.status === "ok"
              ? queue.queueName
              : (queue?.status ?? "unavailable")
          }
        />
        <OpsCommandSignal
          detail={
            captureAutomation || reconciliationAutomation
              ? `Capture ${captureAutomation?.status ?? "n/a"} · Reconciliation ${reconciliationAutomation?.status ?? "n/a"}`
              : "Automation health is unavailable for the current session."
          }
          label="Automation"
          meta={
            captureAutomation?.lastCapturedAt ||
            reconciliationAutomation?.lastRunAt
              ? `Last capture ${captureAutomation?.lastCapturedAt ? formatDateTime(captureAutomation.lastCapturedAt) : "n/a"} · Last run ${reconciliationAutomation?.lastRunAt ? formatDateTime(reconciliationAutomation.lastRunAt) : "n/a"}`
              : "No recent automation evidence reported"
          }
          tone={automationTone}
          value={
            captureAutomation?.status === "healthy" &&
            reconciliationAutomation?.status === "healthy"
              ? "Healthy"
              : captureAutomation || reconciliationAutomation
                ? "Review"
                : "Unavailable"
          }
        />
        <OpsCommandSignal
          detail={
            alertRouting || alertSchedule || alertEscalation
              ? `${alertRouting?.policy.webhookMode ?? "n/a"} routing · ${alertSchedule?.status ?? "n/a"} schedule · ${alertEscalation?.status ?? "n/a"} escalation`
              : "Alert policy modules are unavailable for the current session."
          }
          label="Delivery policy"
          meta={
            canManageOpsPolicy
              ? "Owner controls available in policy modules"
              : "Operator access is read-only for policy modules"
          }
          tone={policyTone}
          value={
            alertRouting?.webhookConfigured
              ? "Configured"
              : alertRouting
                ? "No webhook"
                : "Unavailable"
          }
        />
        <OpsCommandSignal
          detail={`${activeRequests.length} active requests · ${retryableFailures.length} retryable failures`}
          label="Operator workload"
          meta={`${activeMutes.length} active mutes · ${alertDeliveries.length} recent deliveries`}
          tone={activityTone}
          value={
            retryableFailures.length > 0
              ? `${retryableFailures.length} retries`
              : activeRequests.length > 0
                ? `${activeRequests.length} active`
                : "Clear"
          }
        />
        <OpsCommandSignal
          detail={`${persistedCaptures.length} persisted captures · ${alertDeliveries.length} recorded deliveries`}
          label="Evidence trail"
          meta={
            history?.status === "ok"
              ? history.message
              : (history?.message ??
                "Historical evidence is unavailable for the current session.")
          }
          tone={historyTone}
          value={history?.status ?? "unavailable"}
        />
      </div>
      <OpsCommandSection
        description="Critical alerts and open reconciliation drift stay at the top of the command surface so an operator can see what is broken and act immediately."
        eyebrow="Attention now"
        title="Triage and remediation"
      >
        <div className={resolveOpsGridClass()}>
          <OpsCommandModule
            description={
              observability
                ? observability.message
                : "Operational alerts are only loaded after the operator session resolves."
            }
            eyebrow="Alert posture"
            span="wide"
            title="Active alerts and latest runtime signals"
            tone={
              resolveOpsCommandToneFromObservability(observability?.status) ===
              "critical"
                ? "critical"
                : activeAlerts.length > 0
                  ? attentionTone
                  : "neutral"
            }
          >
            {observability ? (
              <>
                <StatusBanner tone={observabilityTone}>
                  <strong>{observability.status}</strong>
                  <span>{observability.message}</span>
                  <span>Checked {formatDateTime(observability.checkedAt)}</span>
                </StatusBanner>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Critical alerts"
                    value={String(criticalActiveAlertCount)}
                  />
                  <MetricTile
                    label="Warning alerts"
                    value={String(warningActiveAlertCount)}
                  />
                  <MetricTile
                    label="Oldest queued"
                    value={formatDurationSeconds(
                      observability.oldestQueuedAgeSeconds
                    )}
                  />
                  <MetricTile
                    label="Oldest running"
                    value={formatDurationSeconds(
                      observability.oldestRunningAgeSeconds
                    )}
                  />
                </div>
                {derivedAlerts.length ? (
                  <div className="space-y-2.5">
                    {derivedAlerts.map((alert) => (
                      <StatusBanner
                        key={alert.code}
                        tone={alert.severity === "critical" ? "error" : "info"}
                      >
                        <strong>{alert.title}</strong>
                        <span>{alert.message}</span>
                      </StatusBanner>
                    ))}
                  </div>
                ) : (
                  <OpsEmptyState>
                    No active operator alerts were derived from the latest
                    queue, backend, and rolling-window signals.
                  </OpsEmptyState>
                )}
              </>
            ) : null}
            {activeAlerts.length ? (
              <div className="space-y-2.5">
                {activeAlerts.map((alert) => (
                  <ActiveAlertItem
                    acknowledging={acknowledgingAlertStateId === alert.id}
                    alert={alert}
                    clearingMute={clearingMuteCode === alert.code}
                    key={alert.id}
                    muting={mutingAlertStateId === alert.id}
                    onAcknowledge={acknowledgeAlertState}
                    onClearMute={clearAlertMuteByAlertStateId}
                    onMute={muteAlertState}
                  />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No persisted active alerts are currently open for this operator.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
          <OpsCommandModule
            actions={
              <OpsActionButton
                disabled={runningReconciliation}
                onClick={() => {
                  void runReconciliation();
                }}
                type="button"
              >
                {runningReconciliation
                  ? "Running reconciliation…"
                  : "Run reconciliation"}
              </OpsActionButton>
            }
            description={
              reconciliation
                ? reconciliation.message
                : "Reconciliation state is only loaded after the operator session resolves."
            }
            eyebrow="Reconciliation"
            title="Open drift and repairable issues"
            tone={resolveOpsCommandToneFromReconciliation(
              reconciliation?.status
            )}
          >
            {reconciliation ? (
              <>
                <StatusBanner tone={reconciliationTone}>
                  <strong>{reconciliation.status}</strong>
                  <span>{reconciliation.message}</span>
                  <span>
                    Last run{" "}
                    {reconciliation.lastRun
                      ? formatDateTime(reconciliation.lastRun.completedAt)
                      : "not recorded"}
                  </span>
                </StatusBanner>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Critical open"
                    value={String(reconciliation.openCriticalIssueCount)}
                  />
                  <MetricTile
                    label="Warning open"
                    value={String(reconciliation.openWarningIssueCount)}
                  />
                  <MetricTile
                    label="Latest run"
                    value={
                      reconciliation.lastRun
                        ? reconciliation.lastRun.status
                        : "n/a"
                    }
                  />
                  <MetricTile
                    label="Issues recorded"
                    value={String(openIssues.length)}
                  />
                </div>
              </>
            ) : null}
            {openIssues.length ? (
              <div className="space-y-2.5">
                {openIssues.map((issue) => (
                  <OpsPanelCard
                    tone={
                      issue.severity === "critical" ? "critical" : "warning"
                    }
                    key={issue.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-1">
                        <strong>{issue.title}</strong>
                        <span>{issue.message}</span>
                      </div>
                      <Pill>{issue.severity}</Pill>
                    </div>
                    <div className={resolveOpsPillRowClass()}>
                      <Pill>{issue.kind}</Pill>
                      <Pill>
                        Detected {formatDateTime(issue.lastDetectedAt)}
                      </Pill>
                      <Pill>
                        {issue.repairable ? "Repairable" : "Manual only"}
                      </Pill>
                    </div>
                    <div className="grid gap-1 text-xs text-[color:var(--color-muted)] md:grid-cols-2">
                      {Object.entries(issue.detail).map(([key, value]) => (
                        <span key={key}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                    <div className={resolveOpsActionRowClass()}>
                      <OpsActionButton
                        disabled={
                          !issue.repairable ||
                          repairingReconciliationIssueId === issue.id
                        }
                        onClick={() => {
                          void repairReconciliationIssue(issue.id);
                        }}
                        type="button"
                      >
                        {repairingReconciliationIssueId === issue.id
                          ? "Repairing…"
                          : "Repair issue"}
                      </OpsActionButton>
                      <OpsActionButton
                        disabled={ignoringReconciliationIssueId === issue.id}
                        onClick={() => {
                          void ignoreReconciliationIssue(issue.id);
                        }}
                        type="button"
                      >
                        {ignoringReconciliationIssueId === issue.id
                          ? "Ignoring…"
                          : "Ignore issue"}
                      </OpsActionButton>
                    </div>
                  </OpsPanelCard>
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No open reconciliation issues are recorded for this operator.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
        </div>
      </OpsCommandSection>
      <OpsCommandSection
        description="Queue state, active generation work, retryable failures, and recurring automation health stay grouped together for rapid operational scanning."
        eyebrow="Current system state"
        title="Runtime and automation"
      >
        <div className={resolveOpsGridClass()}>
          <OpsCommandModule
            description={
              queue?.status === "ok"
                ? queue.message
                : (queue?.message ??
                  "Queue diagnostics are only loaded after the operator session resolves.")
            }
            eyebrow="Queue health"
            title="Generation dispatch queue"
            tone={queueTone}
          >
            {queue ? (
              <>
                <StatusBanner tone={queue.status === "ok" ? "info" : "error"}>
                  <strong>{queue.queueName}</strong>
                  <span>{queue.message}</span>
                  <span>Checked {formatDateTime(queue.checkedAt)}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
                  <Pill>{queue.service ?? "Worker service unavailable"}</Pill>
                  <Pill>{queue.workerAdapter ?? "Unknown adapter"}</Pill>
                  <Pill>
                    {queue.concurrency !== null
                      ? `${queue.concurrency}x concurrency`
                      : "No concurrency signal"}
                  </Pill>
                </div>
                {queue.counts ? (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
          </OpsCommandModule>
          <OpsCommandModule
            description={
              activity?.status === "ok"
                ? "Queued and running generation requests stay grouped here while attention modules above summarize immediate risk."
                : (activity?.message ??
                  "Recent activity could not be loaded for this operator.")
            }
            eyebrow="Active work"
            title="Current generation requests"
            tone={activeRequests.length > 0 ? "neutral" : "healthy"}
          >
            {activeRequests.length ? (
              <div className="space-y-2.5">
                {activeRequests.map((entry) => (
                  <ActivityItem activity={entry} key={entry.id} />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No queued or running generation requests are owned by this
                session.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              activity?.status === "ok"
                ? "Failed owner-scoped generation requests can be retried here without returning to the studio asset browser."
                : (activity?.message ??
                  "Retryable failure history could not be loaded for this operator.")
            }
            eyebrow="Recovery queue"
            title="Retryable failures"
            tone={retryableFailures.length > 0 ? "warning" : "healthy"}
          >
            {retryableFailures.length ? (
              <div className="space-y-2.5">
                {retryableFailures.map((entry) => (
                  <ActivityItem
                    activity={entry}
                    key={entry.id}
                    onRetry={retryGenerationRequest}
                    retrying={retryingGenerationRequestId === entry.id}
                  />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No failed generation requests are currently retryable for this
                session.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              captureAutomation?.status === "healthy"
                ? "Worker-owned automation now persists observability captures on a recurring cadence while lease coordination suppresses duplicate runs."
                : (captureAutomation?.message ??
                  "Ops capture automation is only evaluated after the operator session resolves.")
            }
            eyebrow="Automation"
            title="Capture automation"
            tone={resolveOpsCommandToneFromAutomation(
              captureAutomation?.status
            )}
          >
            {captureAutomation ? (
              <>
                <StatusBanner tone={captureAutomationTone}>
                  <strong>{captureAutomation.status}</strong>
                  <span>{captureAutomation.message}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
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
              </>
            ) : null}
          </OpsCommandModule>
          <OpsCommandModule
            actions={
              <ActionLink href="/ops/fleet" tone="inline">
                Fleet triage
              </ActionLink>
            }
            description={
              reconciliationAutomation
                ? "Recurring reconciliation health stays visible here while repair and ignore actions remain in the attention zone above."
                : "Reconciliation automation is only evaluated after the operator session resolves."
            }
            eyebrow="Automation"
            title="Reconciliation automation"
            tone={resolveOpsCommandToneFromAutomation(
              reconciliationAutomation?.status
            )}
          >
            {reconciliationAutomation ? (
              <>
                <StatusBanner tone={reconciliationAutomationTone}>
                  <strong>{reconciliationAutomation.status}</strong>
                  <span>{reconciliationAutomation.message}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
                  <Pill>
                    Interval{" "}
                    {reconciliationAutomation.intervalSeconds !== null
                      ? formatDurationSeconds(
                          reconciliationAutomation.intervalSeconds
                        )
                      : "n/a"}
                  </Pill>
                  <Pill>
                    Jitter{" "}
                    {reconciliationAutomation.jitterSeconds !== null
                      ? formatDurationSeconds(
                          reconciliationAutomation.jitterSeconds
                        )
                      : "n/a"}
                  </Pill>
                  <Pill>
                    Lock TTL{" "}
                    {reconciliationAutomation.lockTtlSeconds !== null
                      ? formatDurationSeconds(
                          reconciliationAutomation.lockTtlSeconds
                        )
                      : "n/a"}
                  </Pill>
                  <Pill>
                    {reconciliationAutomation.runOnStart === null
                      ? "Run-on-start n/a"
                      : reconciliationAutomation.runOnStart
                        ? "Runs on startup"
                        : "Startup reconciliation disabled"}
                  </Pill>
                  <Pill>
                    Last run{" "}
                    {reconciliationAutomation.lastRunAgeSeconds !== null
                      ? `${formatDurationSeconds(reconciliationAutomation.lastRunAgeSeconds)} ago`
                      : "n/a"}
                  </Pill>
                </div>
              </>
            ) : null}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              observability?.status === "ok" ||
              observability?.status === "warning" ||
              observability?.status === "critical"
                ? "Rolling windows summarize recent request volume, success rate, and completion duration."
                : (observability?.message ??
                  "Rolling generation metrics could not be loaded for this operator.")
            }
            eyebrow="Runtime history"
            span="wide"
            title="Rolling generation metrics"
            tone={resolveOpsCommandToneFromObservability(observability?.status)}
          >
            {observability?.windows.length ? (
              <div className="space-y-2.5">
                {observability.windows.map((window) => (
                  <WindowSummary key={window.windowKey} window={window} />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                Rolling generation windows are not available for this operator.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
        </div>
      </OpsCommandSection>
      <OpsCommandSection
        description="Alert routing, schedule, escalation, and mute state remain grouped as trustworthy control modules rather than scattered diagnostic cards."
        eyebrow="Control and policy"
        title="Alert delivery controls"
      >
        <div className={resolveOpsGridClass()}>
          <OpsCommandModule
            description={
              alertRouting?.message ??
              "Alert routing policy is only loaded after the operator session resolves."
            }
            eyebrow="Routing"
            title="Webhook alert routing"
            tone={resolveOpsCommandToneFromRouting(alertRouting?.status)}
          >
            {alertRouting ? (
              <>
                {!canManageOpsPolicy ? (
                  <StatusBanner tone="info">
                    <strong>Operator read-only</strong>
                    <span>
                      {operatorRoleLabel} access can inspect routing state, but
                      only workspace owners can change delivery policy.
                    </span>
                  </StatusBanner>
                ) : null}
                <StatusBanner tone={alertRoutingTone}>
                  <strong>{alertRouting.status}</strong>
                  <span>{alertRouting.message}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
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
                <div className={resolveOpsActionRowClass()}>
                  <OpsActionButton
                    disabled={
                      !canManageOpsPolicy ||
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
                  </OpsActionButton>
                  <OpsActionButton
                    disabled={
                      !canManageOpsPolicy ||
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
                  </OpsActionButton>
                  <OpsActionButton
                    disabled={
                      !canManageOpsPolicy ||
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
                  </OpsActionButton>
                  {alertRouting.policy.source === "owner_override" ? (
                    <OpsActionButton
                      disabled={
                        !canManageOpsPolicy || savingAlertRoutingAction !== null
                      }
                      onClick={() => {
                        void resetAlertRoutingPolicy();
                      }}
                      type="button"
                    >
                      {savingAlertRoutingAction === "default"
                        ? "Resetting…"
                        : "Use default"}
                    </OpsActionButton>
                  ) : null}
                </div>
              </>
            ) : null}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              alertSchedule?.message ??
              "Alert delivery schedule is only loaded after the operator session resolves."
            }
            eyebrow="Schedule"
            title="Webhook delivery window"
            tone={resolveOpsCommandToneFromSchedule(alertSchedule?.status)}
          >
            {alertSchedule ? (
              <>
                {!canManageOpsPolicy ? (
                  <StatusBanner tone="info">
                    <strong>Operator read-only</strong>
                    <span>
                      {operatorRoleLabel} access can inspect schedule state, but
                      only workspace owners can change alert hours.
                    </span>
                  </StatusBanner>
                ) : null}
                <StatusBanner tone={alertScheduleTone}>
                  <strong>{alertSchedule.status}</strong>
                  <span>{alertSchedule.message}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
                  <Pill>
                    {alertSchedule.webhookConfigured
                      ? "Webhook configured"
                      : "Webhook not configured"}
                  </Pill>
                  <Pill>{alertSchedule.policy.source}</Pill>
                  <Pill>
                    {alertSchedule.policy.source === "owner_override"
                      ? formatAlertScheduleDayList(
                          alertSchedule.policy.activeDays
                        )
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
                    {alertSchedule.policy.timezone ??
                      alertScheduleDraft.timezone}
                  </Pill>
                  <Pill>Local now {alertSchedule.localTimeLabel ?? "n/a"}</Pill>
                </div>
                <div className={resolveOpsSettingsGridClass()}>
                  <FieldStack>
                    <FieldLabel>Timezone</FieldLabel>
                    <InputField
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertScheduleAction !== null
                      }
                      onChange={(event) => {
                        setAlertScheduleDraft((currentDraft) => ({
                          ...currentDraft,
                          timezone: event.target.value
                        }));
                      }}
                      type="text"
                      value={alertScheduleDraft.timezone}
                    />
                  </FieldStack>
                  <FieldStack>
                    <FieldLabel>Start</FieldLabel>
                    <InputField
                      disabled={
                        !canManageOpsPolicy ||
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
                  </FieldStack>
                  <FieldStack>
                    <FieldLabel>End</FieldLabel>
                    <InputField
                      disabled={
                        !canManageOpsPolicy ||
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
                  </FieldStack>
                  <label className={resolveOpsCheckboxClass()}>
                    <input
                      className={resolveOpsCheckboxInputClass()}
                      checked={alertScheduleDraft.allDay}
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertScheduleAction !== null
                      }
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
                <div className={resolveOpsPillRowClass()}>
                  {opsAlertScheduleDayValues.map((activeDay) => {
                    const selected =
                      alertScheduleDraft.activeDays.includes(activeDay);

                    return (
                      <OpsActionButton
                        aria-pressed={selected}
                        disabled={
                          !canManageOpsPolicy ||
                          savingAlertScheduleAction !== null
                        }
                        key={activeDay}
                        onClick={() => {
                          setAlertScheduleDraft((currentDraft) => ({
                            ...currentDraft,
                            activeDays: currentDraft.activeDays.includes(
                              activeDay
                            )
                              ? currentDraft.activeDays.filter(
                                  (scheduleDay) => scheduleDay !== activeDay
                                )
                              : opsAlertScheduleDayValues.filter(
                                  (scheduleDay) =>
                                    scheduleDay === activeDay ||
                                    currentDraft.activeDays.includes(
                                      scheduleDay
                                    )
                                )
                          }));
                        }}
                        type="button"
                      >
                        {alertScheduleDayLabelByValue[activeDay]}
                        {selected ? " on" : ""}
                      </OpsActionButton>
                    );
                  })}
                </div>
                <div className={resolveOpsActionRowClass()}>
                  <OpsActionButton
                    disabled={
                      !canManageOpsPolicy || savingAlertScheduleAction !== null
                    }
                    onClick={() => {
                      void updateAlertSchedulePolicy();
                    }}
                    type="button"
                  >
                    {savingAlertScheduleAction === "save"
                      ? "Saving…"
                      : "Save schedule"}
                  </OpsActionButton>
                  {alertSchedule.policy.source === "owner_override" ? (
                    <OpsActionButton
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertScheduleAction !== null
                      }
                      onClick={() => {
                        void resetAlertSchedulePolicy();
                      }}
                      type="button"
                    >
                      {savingAlertScheduleAction === "default"
                        ? "Resetting…"
                        : "Use default"}
                    </OpsActionButton>
                  ) : null}
                </div>
              </>
            ) : null}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              alertEscalation?.message ??
              "Alert escalation policy is only loaded after the operator session resolves."
            }
            eyebrow="Escalation"
            title="Reminder policy"
            tone={resolveOpsCommandToneFromEscalation(alertEscalation?.status)}
          >
            {alertEscalation ? (
              <>
                {!canManageOpsPolicy ? (
                  <StatusBanner tone="info">
                    <strong>Operator read-only</strong>
                    <span>
                      {operatorRoleLabel} access can inspect escalation state,
                      but only workspace owners can change reminder policy.
                    </span>
                  </StatusBanner>
                ) : null}
                <StatusBanner tone={alertEscalationTone}>
                  <strong>{alertEscalation.status}</strong>
                  <span>{alertEscalation.message}</span>
                </StatusBanner>
                <div className={resolveOpsPillRowClass()}>
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
                    {alertEscalation.policy.repeatReminderIntervalMinutes !==
                    null
                      ? formatDurationSeconds(
                          alertEscalation.policy.repeatReminderIntervalMinutes *
                            60
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
                <div className={resolveOpsSettingsGridClass()}>
                  <FieldStack>
                    <FieldLabel>First reminder (minutes)</FieldLabel>
                    <InputField
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertEscalationAction !== null
                      }
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
                  </FieldStack>
                  <FieldStack>
                    <FieldLabel>Repeat interval (minutes)</FieldLabel>
                    <InputField
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertEscalationAction !== null
                      }
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
                  </FieldStack>
                </div>
                <div className={resolveOpsActionRowClass()}>
                  <OpsActionButton
                    disabled={
                      !canManageOpsPolicy ||
                      savingAlertEscalationAction !== null
                    }
                    onClick={() => {
                      void updateAlertEscalationPolicy();
                    }}
                    type="button"
                  >
                    {savingAlertEscalationAction === "save"
                      ? "Saving…"
                      : "Save escalation"}
                  </OpsActionButton>
                  {alertEscalation.policy.source === "owner_override" ? (
                    <OpsActionButton
                      disabled={
                        !canManageOpsPolicy ||
                        savingAlertEscalationAction !== null
                      }
                      onClick={() => {
                        void resetAlertEscalationPolicy();
                      }}
                      type="button"
                    >
                      {savingAlertEscalationAction === "default"
                        ? "Resetting…"
                        : "Use default"}
                    </OpsActionButton>
                  ) : null}
                </div>
              </>
            ) : null}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              history?.status === "ok"
                ? "Mute policy suppresses alert delivery for bounded durations without hiding the underlying alert state."
                : (history?.message ??
                  "Muted alert policy is only loaded after the operator session resolves.")
            }
            eyebrow="Noise control"
            title="Active mutes"
            tone={activeMutes.length > 0 ? "warning" : "healthy"}
          >
            {activeMutes.length ? (
              <div className="space-y-2.5">
                {activeMutes.map((mute) => (
                  <ActiveMuteItem
                    clearing={clearingMuteCode === mute.code}
                    key={mute.id}
                    mute={mute}
                    onClear={clearAlertMuteByCode}
                  />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No active alert mutes are configured for this operator.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
        </div>
      </OpsCommandSection>
      <OpsCommandSection
        description="Historical captures and delivery records stay lower on the page to support diagnosis without crowding the live attention and control zones."
        eyebrow="Evidence and history"
        title="Operational trail"
      >
        <div className={resolveOpsGridClass()}>
          <OpsCommandModule
            description={
              history?.status === "ok"
                ? "Persisted captures retain multi-day observability checkpoints so operators can review how alert state and queue pressure changed over time."
                : (history?.message ??
                  "Persisted observability history is only loaded after the operator session resolves.")
            }
            eyebrow="Observability history"
            span="wide"
            title="Persisted runtime captures"
            tone={persistedCaptures.length > 0 ? "neutral" : "healthy"}
          >
            {persistedCaptures.length ? (
              <div className="space-y-2.5">
                {persistedCaptures.map((capture) => (
                  <PersistedCaptureItem capture={capture} key={capture.id} />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No persisted observability captures are available for this
                operator yet.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
          <OpsCommandModule
            description={
              history?.status === "ok"
                ? "Delivered alert records persist the operator-facing alert timeline across audit-log and webhook channels."
                : (history?.message ??
                  "Recent alert delivery history could not be loaded for this operator.")
            }
            eyebrow="Delivery evidence"
            title="Recent alert deliveries"
            tone={
              alertDeliveries.some(
                (delivery) => delivery.deliveryState === "failed"
              )
                ? "warning"
                : alertDeliveries.length > 0
                  ? "neutral"
                  : "healthy"
            }
          >
            {alertDeliveries.length ? (
              <div className="space-y-2.5">
                {alertDeliveries.map((delivery) => (
                  <AlertDeliveryItem delivery={delivery} key={delivery.id} />
                ))}
              </div>
            ) : (
              <OpsEmptyState>
                No persisted alert deliveries are available for this operator
                yet.
              </OpsEmptyState>
            )}
          </OpsCommandModule>
        </div>
      </OpsCommandSection>
    </div>
  );
}
