import {
  ActionLink,
  OpsEmptyState,
  OpsPanelCard,
  OpsStatusNotice,
  Pill,
  SurfaceCard
} from "@ai-nft-forge/ui";
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
      <div className="space-y-4">
        {entries.length === 0 ? (
          <OpsEmptyState>
            <strong className="mb-1 block font-semibold">
              No accessible workspaces
            </strong>
            <p>
              Archive-readiness and export summaries will appear here after
              workspace access is provisioned.
            </p>
          </OpsEmptyState>
        ) : null}
        {entries.map((entry) => (
          <OpsPanelCard tone="neutral" key={entry.workspace.id}>
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
                  access review{" "}
                  {formatCode(entry.accessReview.attestationStatus)}
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
              <p className="text-sm text-[color:var(--color-muted)]">
                Last activity: {formatDateTime(entry.directory.lastActivityAt)}
              </p>
              {entry.summary.blockerCodes.length ? (
                <OpsStatusNotice
                  title="Archive blocked"
                  tone="error"
                  className="mt-0"
                >
                  <p>
                    Resolve{" "}
                    {entry.summary.blockerCodes.map(formatCode).join(", ")}{" "}
                    before offboarding this workspace.
                  </p>
                </OpsStatusNotice>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              entry.summary.cautionCodes.length ? (
                <OpsStatusNotice
                  title="Review before archive"
                  tone="info"
                  className="mt-0"
                >
                  <p>
                    Check{" "}
                    {entry.summary.cautionCodes.map(formatCode).join(", ")}{" "}
                    before final offboarding.
                  </p>
                </OpsStatusNotice>
              ) : null}
              {!entry.summary.blockerCodes.length &&
              !entry.summary.cautionCodes.length ? (
                <OpsStatusNotice
                  title="Archive-ready"
                  tone="success"
                  className="mt-0"
                >
                  <p>
                    No active operational blockers are currently attached to
                    this workspace.
                  </p>
                </OpsStatusNotice>
              ) : null}
              {entry.decommission ? (
                <OpsStatusNotice title="Decommission scheduled" tone="info">
                  <p>
                    Retention window ends on{" "}
                    {formatDateTime(entry.decommission.executeAfter)}.
                  </p>
                </OpsStatusNotice>
              ) : null}
              {entry.decommission ? (
                <OpsStatusNotice
                  title="Notice workflow"
                  tone="info"
                  className="mt-0"
                >
                  <p>
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
                </OpsStatusNotice>
              ) : null}
              <OpsStatusNotice
                title="Access review"
                tone={
                  entry.accessReview.attestationStatus === "current"
                    ? "success"
                    : "info"
                }
                className="mt-0"
              >
                <p>
                  {entry.accessReview.attestationStatus === "current"
                    ? "The latest access-review attestation matches the current evidence hash."
                    : entry.accessReview.latestAttestation
                      ? "Current access-review evidence has changed since the latest attestation."
                      : "No access review has been recorded for this workspace."}{" "}
                  Current hash{" "}
                  {entry.accessReview.currentEvidenceHash.slice(0, 12)}
                  {entry.accessReview.latestAttestation
                    ? ` · latest ${entry.accessReview.latestAttestation.reviewHash.slice(
                        0,
                        12
                      )} recorded ${formatDateTime(
                        entry.accessReview.latestAttestation.createdAt
                      )}`
                    : ""}
                  .
                </p>
              </OpsStatusNotice>
              {entry.lifecycleDelivery.latestDelivery ? (
                <OpsStatusNotice
                  title="Lifecycle delivery"
                  tone="info"
                  className="mt-0"
                >
                  <p>
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
                  </p>
                </OpsStatusNotice>
              ) : null}
              <OpsStatusNotice
                title="Lifecycle automation"
                tone="info"
                className="mt-0"
              >
                <p>
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
                </p>
              </OpsStatusNotice>
              <OpsStatusNotice
                className="mt-0"
                title="Lifecycle SLA"
                tone={getSlaTone(entry.lifecycleSlaSummary.status)}
              >
                <p>
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
              </OpsStatusNotice>
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
          </OpsPanelCard>
        ))}
      </div>
    </SurfaceCard>
  );
}
