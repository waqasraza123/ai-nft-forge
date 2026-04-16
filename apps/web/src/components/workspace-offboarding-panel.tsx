import Link from "next/link";

import { Pill, SurfaceCard } from "@ai-nft-forge/ui";
import type { WorkspaceOffboardingEntry } from "@ai-nft-forge/shared";

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
      <div className="stack-md">
        {entries.length === 0 ? (
          <div className="status-banner">
            <strong>No accessible workspaces</strong>
            <span>
              Archive-readiness and export summaries will appear here after
              workspace access is provisioned.
            </span>
          </div>
        ) : null}
        {entries.map((entry) => (
          <article className="collection-list-card" key={entry.workspace.id}>
            <div className="stack-sm">
              <div className="collection-list-card__header">
                <div>
                  <h3>{entry.workspace.name}</h3>
                  <p>
                    {entry.workspace.slug} · {entry.workspace.role} ·{" "}
                    {entry.workspace.status}
                  </p>
                </div>
                <Pill>{formatCode(entry.summary.readiness)}</Pill>
              </div>
              <div className="pill-row">
                <Pill>{entry.summary.openCheckoutCount} open checkouts</Pill>
                <Pill>{entry.summary.activeAlertCount} active alerts</Pill>
                <Pill>
                  {entry.summary.openReconciliationIssueCount} open
                  reconciliation
                </Pill>
                <Pill>
                  {entry.summary.unfulfilledCheckoutCount} unfulfilled
                </Pill>
                <Pill>{entry.summary.livePublicationCount} live releases</Pill>
                <Pill>
                  {entry.directory.pendingInvitationCount} pending invites
                </Pill>
                <Pill>
                  {entry.directory.expiringInvitationCount} expiring invites
                </Pill>
                <Pill>
                  {entry.directory.expiredInvitationCount} expired invites
                </Pill>
                <Pill>
                  {entry.lifecycleDelivery.failedCount} lifecycle failed
                </Pill>
                <Pill>
                  {entry.lifecycleDelivery.deliveredCount} lifecycle delivered
                </Pill>
                <Pill>
                  automation{" "}
                  {entry.lifecycleAutomationPolicy.enabled ? "on" : "off"}
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
              <p className="surface-card__body-copy">
                Last activity: {formatDateTime(entry.directory.lastActivityAt)}
              </p>
              {entry.summary.blockerCodes.length ? (
                <div className="status-banner status-banner--error">
                  <strong>Archive blocked</strong>
                  <span>
                    Resolve{" "}
                    {entry.summary.blockerCodes.map(formatCode).join(", ")}{" "}
                    before offboarding this workspace.
                  </span>
                </div>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              entry.summary.cautionCodes.length ? (
                <div className="status-banner status-banner--info">
                  <strong>Review before archive</strong>
                  <span>
                    Check{" "}
                    {entry.summary.cautionCodes.map(formatCode).join(", ")}{" "}
                    before final offboarding.
                  </span>
                </div>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              !entry.summary.cautionCodes.length ? (
                <div className="status-banner status-banner--success">
                  <strong>Archive-ready</strong>
                  <span>
                    No active operational blockers are currently attached to
                    this workspace.
                  </span>
                </div>
              ) : null}
              {entry.decommission ? (
                <div className="status-banner">
                  <strong>Decommission scheduled</strong>
                  <span>
                    Retention window ends on{" "}
                    {formatDateTime(entry.decommission.executeAfter)}.
                  </span>
                </div>
              ) : null}
              {entry.decommission ? (
                <div className="status-banner status-banner--info">
                  <strong>Notice workflow</strong>
                  <span>
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
                  </span>
                </div>
              ) : null}
              {entry.lifecycleDelivery.latestDelivery ? (
                <div className="status-banner status-banner--info">
                  <strong>Lifecycle delivery</strong>
                  <span>
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
                    {formatCode(
                      entry.lifecycleDelivery.latestDelivery.deliveryState
                    )}{" "}
                    {formatDateTime(
                      entry.lifecycleDelivery.latestDelivery.updatedAt
                    )}
                    .
                  </span>
                </div>
              ) : null}
              <div className="status-banner status-banner--info">
                <strong>Lifecycle automation</strong>
                <span>
                  Scheduler{" "}
                  {entry.lifecycleAutomationPolicy.enabled
                    ? "enabled"
                    : "disabled"}{" "}
                  · invitation reminders{" "}
                  {entry.lifecycleAutomationPolicy.automateInvitationReminders
                    ? "enabled"
                    : "disabled"}{" "}
                  · decommission notices{" "}
                  {entry.lifecycleAutomationPolicy.automateDecommissionNotices
                    ? "enabled"
                    : "disabled"}
                  .
                </span>
              </div>
              <div
                className={`status-banner status-banner--${getSlaTone(
                  entry.lifecycleSlaSummary.status
                )}`}
              >
                <strong>Lifecycle SLA</strong>
                <span>
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
                </span>
              </div>
              {entry.workspace.role === "owner" ? (
                <div className="studio-action-row">
                  <Link
                    className="action-link"
                    href={`/api/studio/workspaces/${entry.workspace.id}/export?format=json`}
                  >
                    Export JSON
                  </Link>
                  <Link
                    className="inline-link"
                    href={`/api/studio/workspaces/${entry.workspace.id}/export?format=csv`}
                  >
                    Export CSV
                  </Link>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}
