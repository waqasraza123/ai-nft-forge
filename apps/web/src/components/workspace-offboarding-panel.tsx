import { ActionLink, Pill, SurfaceCard } from "@ai-nft-forge/ui";
import type { WorkspaceOffboardingEntry } from "@ai-nft-forge/shared";

type OffboardingNoticeTone = "error" | "info" | "success";

type WorkspaceOffboardingPanelProps = {
  body: string;
  entries: WorkspaceOffboardingEntry[];
  eyebrow: string;
  span?: 4 | 6 | 8 | 12;
  title: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "No workspace activity recorded";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCode(value: string) {
  return value.replaceAll("_", " ");
}

function getSlaTone(
  status: WorkspaceOffboardingEntry["lifecycleSlaSummary"]["status"]
) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "disabled") {
    return "info";
  }

  return "error";
}

function getNoticeClass(tone: OffboardingNoticeTone) {
  if (tone === "error") {
    return "border-red-300/45 bg-red-500/12 text-red-50";
  }

  if (tone === "success") {
    return "border-emerald-300/45 bg-emerald-500/12 text-emerald-50";
  }

  return "border-cyan-300/45 bg-cyan-500/12 text-cyan-50";
}

export function WorkspaceOffboardingPanel({
  body,
  entries,
  eyebrow,
  span,
  title
}: WorkspaceOffboardingPanelProps) {
  return (
    <SurfaceCard
      body={body}
      eyebrow={eyebrow}
      title={title}
      {...(span ? { span } : {})}
    >
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3">
            <strong className="font-semibold">No accessible workspaces</strong>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Archive-readiness and export summaries will appear here after
              workspace access is provisioned.
            </p>
          </div>
        ) : null}
        {entries.map((entry) => (
          <article
            className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-4"
            key={entry.workspace.id}
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div>
                  <h3 className="text-base font-semibold">
                    {entry.workspace.name}
                  </h3>
                  <p className="text-sm text-[color:var(--color-muted)]">
                    {entry.workspace.slug} · {entry.workspace.role} ·{" "}
                    {entry.workspace.status}
                  </p>
                </div>
                <Pill>{formatCode(entry.summary.readiness)}</Pill>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>{entry.summary.openCheckoutCount} open checkouts</Pill>
                <Pill>{entry.summary.activeAlertCount} active alerts</Pill>
                <Pill>
                  {entry.summary.openReconciliationIssueCount} open
                  reconciliation
                </Pill>
                <Pill>{entry.summary.unfulfilledCheckoutCount} unfulfilled</Pill>
                <Pill>{entry.summary.livePublicationCount} live releases</Pill>
                <Pill>
                  {entry.directory.pendingInvitationCount} pending invites
                </Pill>
                <Pill>
                  {entry.directory.expiringInvitationCount} expiring invites
                </Pill>
                <Pill>{entry.directory.expiredInvitationCount} expired invites</Pill>
                <Pill>{entry.lifecycleDelivery.failedCount} lifecycle failed</Pill>
                <Pill>
                  {entry.lifecycleDelivery.deliveredCount} lifecycle delivered
                </Pill>
                <Pill>
                  automation {entry.lifecycleAutomationPolicy.enabled ? "on" : "off"}
                </Pill>
                <Pill>SLA {formatCode(entry.lifecycleSlaSummary.status)}</Pill>
                {entry.decommission ? (
                  <Pill>
                    decommission{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium"
                    }).format(new Date(entry.decommission.executeAfter))}
                  </Pill>
                ) : null}
              </div>
              <p className="text-sm text-[color:var(--color-muted)]">
                Last activity: {formatDateTime(entry.directory.lastActivityAt)}
              </p>
              {entry.summary.blockerCodes.length ? (
                <div className={`rounded-xl border p-3 ${getNoticeClass("error")}`}>
                  <strong className="block font-semibold">Archive blocked</strong>
                  <p className="mt-1 text-sm">
                    Resolve{" "}
                    {entry.summary.blockerCodes.map(formatCode).join(", ")} before
                    offboarding this workspace.
                  </p>
                </div>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              entry.summary.cautionCodes.length ? (
                <div className={`rounded-xl border p-3 ${getNoticeClass("info")}`}>
                  <strong className="block font-semibold">
                    Review before archive
                  </strong>
                  <p className="mt-1 text-sm">
                    Check{" "}
                    {entry.summary.cautionCodes.map(formatCode).join(", ")} before
                    final offboarding.
                  </p>
                </div>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              !entry.summary.cautionCodes.length ? (
                <div className={`rounded-xl border p-3 ${getNoticeClass("success")}`}>
                  <strong className="block font-semibold">Archive-ready</strong>
                  <p className="mt-1 text-sm">
                    No active operational blockers are currently attached to this
                    workspace.
                  </p>
                </div>
              ) : null}
              {entry.decommission ? (
                <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3">
                  <strong className="block font-semibold">
                    Decommission scheduled
                  </strong>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    Retention window ends on{" "}
                    {formatDateTime(entry.decommission.executeAfter)}.
                  </p>
                </div>
              ) : null}
              {entry.decommission ? (
                <div className={`rounded-xl border p-3 ${getNoticeClass("info")}`}>
                  <strong className="block font-semibold">Notice workflow</strong>
                  <p className="mt-1 text-sm">
                    {entry.decommissionWorkflow.notificationCount} recorded
                    notice(s)
                    {entry.decommissionWorkflow.nextDueKind
                      ? ` · next due ${formatCode(
                          entry.decommissionWorkflow.nextDueKind
                        )}`
                      : ""}
                    {entry.decommissionWorkflow.latestNotification
                      ? ` · latest ${formatCode(
                          entry.decommissionWorkflow.latestNotification.kind
                        )} ${formatDateTime(
                          entry.decommissionWorkflow.latestNotification.sentAt
                        )}`
                      : ""}
                    .
                  </p>
                </div>
              ) : null}
              {entry.lifecycleDelivery.latestDelivery ? (
                <div className={`rounded-xl border p-3 ${getNoticeClass("info")}`}>
                  <strong className="block font-semibold">Lifecycle delivery</strong>
                  <p className="mt-1 text-sm">
                    Policy webhook{" "}
                    {entry.lifecycleDeliveryPolicy.webhookEnabled
                      ? "enabled"
                      : "disabled"}{" "}
                    · audit-log delivered{" "}
                    {entry.lifecycleDelivery.auditLog.deliveredCount} · webhook
                    failed {entry.lifecycleDelivery.webhook.failedCount}
                    {entry.lifecycleDelivery.providers.length
                      ? ` · providers ${entry.lifecycleDelivery.providers
                          .map(
                            (provider) =>
                              `${provider.label} ${provider.deliveredCount}/${provider.failedCount}/${provider.queuedCount}`
                          )
                          .join(", ")}`
                      : ""}{" "}
                    · latest{" "}
                    {formatCode(
                      entry.lifecycleDelivery.latestDelivery.eventKind
                    )}{" "}
                    {formatCode(
                      entry.lifecycleDelivery.latestDelivery.deliveryChannel
                    )}{" "}
                    {formatCode(entry.lifecycleDelivery.latestDelivery.deliveryState)}{" "}
                    {formatDateTime(entry.lifecycleDelivery.latestDelivery.updatedAt)}.
                  </p>
                </div>
              ) : null}
              <div className={`rounded-xl border p-3 ${getNoticeClass("info")}`}>
                <strong className="block font-semibold">Lifecycle automation</strong>
                <p className="mt-1 text-sm">
                  Scheduler{" "}
                  {entry.lifecycleAutomationPolicy.enabled ? "enabled" : "disabled"}{" "}
                  · invitation reminders{" "}
                  {entry.lifecycleAutomationPolicy.automateInvitationReminders
                    ? "enabled"
                    : "disabled"}{" "}
                  · decommission notices{" "}
                  {entry.lifecycleAutomationPolicy.automateDecommissionNotices
                    ? "enabled"
                    : "disabled"}
                  .
                </p>
              </div>
              <div
                className={`rounded-xl border p-3 ${getNoticeClass(
                  getSlaTone(entry.lifecycleSlaSummary.status)
                )}`}
              >
                <strong className="block font-semibold">Lifecycle SLA</strong>
                <p className="mt-1 text-sm">
                  {entry.lifecycleSlaSummary.message} Policy max age{" "}
                  {entry.lifecycleSlaPolicy.automationMaxAgeMinutes}m · webhook
                  threshold {entry.lifecycleSlaPolicy.webhookFailureThreshold} ·
                  failed webhooks {entry.lifecycleSlaSummary.failedWebhookCount}
                  {entry.lifecycleSlaSummary.reasonCodes.length
                    ? ` · reasons ${entry.lifecycleSlaSummary.reasonCodes
                        .map(formatCode)
                        .join(", ")}`
                    : ""}
                  .
                </p>
              </div>
              {entry.workspace.role === "owner" ? (
                <div className="flex flex-wrap gap-2">
                  <ActionLink
                    href={`/api/studio/workspaces/${entry.workspace.id}/export?format=json`}
                  >
                    Export JSON
                  </ActionLink>
                  <ActionLink
                    href={`/api/studio/workspaces/${entry.workspace.id}/export?format=csv`}
                    tone="inline"
                  >
                    Export CSV
                  </ActionLink>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}
