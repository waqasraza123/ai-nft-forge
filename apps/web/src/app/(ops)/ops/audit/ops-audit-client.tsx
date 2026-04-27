"use client";

import {
  startTransition,
  type ChangeEvent,
  useEffect,
  useEffectEvent,
  useState
} from "react";

import {
  opsWorkspaceAuditResponseSchema,
  type OpsWorkspaceAuditCategory,
  type OpsWorkspaceAuditResponse,
  type OpsWorkspaceAuditEntry
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  ActionLink,
  ActionRow,
  FieldLabel,
  FieldStack,
  SelectField,
  Pill,
  EmptyState,
  OpsPanelCard,
  OpsPillRow,
  OpsStatusNotice,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

type OpsAuditClientProps = {
  initialAudit: OpsWorkspaceAuditResponse | null;
  workspaceSlug: string | null;
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

const auditCategoryOptions: Array<{
  label: string;
  value: OpsWorkspaceAuditCategory;
}> = [
  {
    label: "All activity",
    value: "all"
  },
  {
    label: "Workspace access",
    value: "workspace_access"
  },
  {
    label: "Ownership transfer",
    value: "ownership_transfer"
  },
  {
    label: "Workspace lifecycle",
    value: "workspace_lifecycle"
  },
  {
    label: "Workspace policy",
    value: "workspace_policy"
  }
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBoolean(value: boolean | null) {
  if (value === null) {
    return null;
  }

  return value ? "on" : "off";
}

function formatAuditRoleMetadata(entry: OpsWorkspaceAuditEntry) {
  if (entry.reviewHash) {
    const reviewLabel =
      entry.action === "workspace_access_review_recorded"
        ? "Access review"
        : "Access review gate";

    return `${reviewLabel} ${entry.reviewHash.slice(0, 12)}${entry.reviewGeneratedAt ? ` · generated ${formatDateTime(entry.reviewGeneratedAt)}` : ""}`;
  }

  if (entry.previousRole && entry.role) {
    return `Role ${entry.previousRole} -> ${entry.role}`;
  }

  if (entry.role) {
    return `Role ${entry.role}`;
  }

  if (
    entry.category === "workspace_lifecycle" ||
    entry.category === "workspace_policy"
  ) {
    return "Operational event";
  }

  return "No access metadata";
}

function formatAuditOperationalMetadata(entry: OpsWorkspaceAuditEntry) {
  const parts: string[] = [];

  if (entry.automation) {
    parts.push("automation");
  }

  if (entry.notificationKind) {
    parts.push(`notice ${entry.notificationKind}`);
  }

  if (entry.retentionDays !== null) {
    parts.push(`retention ${entry.retentionDays}d`);
  }

  if (entry.executeAfter) {
    parts.push(`execute after ${formatDateTime(entry.executeAfter)}`);
  }

  if (entry.accessReviewStatus) {
    parts.push(
      `access review ${entry.accessReviewStatus.replaceAll("_", " ")}`
    );
  }

  if (entry.defaultDecommissionRetentionDays !== null) {
    parts.push(`default ${entry.defaultDecommissionRetentionDays}d`);
  }

  if (entry.minimumDecommissionRetentionDays !== null) {
    parts.push(`minimum ${entry.minimumDecommissionRetentionDays}d`);
  }

  const requireReason = formatBoolean(entry.requireDecommissionReason);

  if (requireReason) {
    parts.push(`reason required ${requireReason}`);
  }

  const automationEnabled = formatBoolean(entry.lifecycleAutomationEnabled);

  if (automationEnabled) {
    parts.push(`automation ${automationEnabled}`);
  }

  const invitationAutomation = formatBoolean(entry.automateInvitationReminders);

  if (invitationAutomation) {
    parts.push(`invitation reminders ${invitationAutomation}`);
  }

  const decommissionAutomation = formatBoolean(
    entry.automateDecommissionNotices
  );

  if (decommissionAutomation) {
    parts.push(`decommission notices ${decommissionAutomation}`);
  }

  const webhookEnabled = formatBoolean(entry.webhookEnabled);

  if (webhookEnabled) {
    parts.push(`webhook ${webhookEnabled}`);
  }

  const invitationDelivery = formatBoolean(entry.deliverInvitationReminders);

  if (invitationDelivery) {
    parts.push(`deliver invitations ${invitationDelivery}`);
  }

  const decommissionDelivery = formatBoolean(
    entry.deliverDecommissionNotifications
  );

  if (decommissionDelivery) {
    parts.push(`deliver decommission ${decommissionDelivery}`);
  }

  const slaEnabled = formatBoolean(entry.lifecycleSlaEnabled);

  if (slaEnabled) {
    parts.push(`SLA ${slaEnabled}`);
  }

  if (entry.lifecycleSlaAutomationMaxAgeMinutes !== null) {
    parts.push(`${entry.lifecycleSlaAutomationMaxAgeMinutes}m max age`);
  }

  if (entry.lifecycleSlaWebhookFailureThreshold !== null) {
    parts.push(
      `${entry.lifecycleSlaWebhookFailureThreshold} failure threshold`
    );
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function buildAuditUrl(input: {
  action: string;
  category: OpsWorkspaceAuditCategory;
  cursor?: string | null;
  format?: "csv";
}) {
  const params = new URLSearchParams();

  if (input.category !== "all") {
    params.set("category", input.category);
  }

  if (input.action.length > 0) {
    params.set("action", input.action);
  }

  if (input.cursor) {
    params.set("cursor", input.cursor);
  }

  if (input.format) {
    params.set("format", input.format);
  }

  const query = params.toString();

  return query.length > 0 ? `/api/ops/audit?${query}` : "/api/ops/audit";
}

async function parseAuditResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message);
    }

    throw new Error("Workspace audit activity could not be loaded.");
  }

  return opsWorkspaceAuditResponseSchema.parse(payload);
}

export function OpsAuditClient({
  initialAudit,
  workspaceSlug
}: OpsAuditClientProps) {
  const [audit, setAudit] = useState(initialAudit);
  const [category, setCategory] = useState<OpsWorkspaceAuditCategory>(
    initialAudit?.audit.category ?? "all"
  );
  const [selectedAction, setSelectedAction] = useState<
    OpsWorkspaceAuditEntry["action"] | ""
  >("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const availableActions = Array.from(
    new Set(
      [
        ...(audit?.audit.entries.map((entry) => entry.action) ?? []),
        ...(audit?.audit.actions ?? [])
      ].sort()
    )
  ) as OpsWorkspaceAuditEntry["action"][];

  useEffect(() => {
    if (selectedAction !== "" && !availableActions.includes(selectedAction)) {
      setSelectedAction("");
    }
  }, [availableActions, selectedAction]);

  const refreshAudit = useEffectEvent(async () => {
    setIsRefreshing(true);
    setNotice({
      message: "Refreshing workspace audit activity…",
      tone: "info"
    });

    try {
      const response = await fetch(
        buildAuditUrl({
          action: selectedAction,
          category
        }),
        {
          cache: "no-store"
        }
      );
      const result = await parseAuditResponse(response);

      startTransition(() => {
        setAudit(result);
      });
      setNotice({
        message: "Workspace audit activity refreshed.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace audit activity could not be refreshed.",
        tone: "error"
      });
    } finally {
      setIsRefreshing(false);
    }
  });

  async function handleLoadMore() {
    if (!audit?.audit.nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setNotice({
      message: "Loading additional audit activity…",
      tone: "info"
    });

    try {
      const response = await fetch(
        buildAuditUrl({
          action: selectedAction,
          category,
          cursor: audit.audit.nextCursor
        }),
        {
          cache: "no-store"
        }
      );
      const result = await parseAuditResponse(response);

      startTransition(() => {
        setAudit((currentAudit) =>
          currentAudit
            ? {
                audit: {
                  ...result.audit,
                  entries: [
                    ...currentAudit.audit.entries,
                    ...result.audit.entries
                  ]
                }
              }
            : result
        );
      });
      setNotice({
        message: "Additional audit activity loaded.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Additional audit activity could not be loaded.",
        tone: "error"
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setCategory(event.target.value as OpsWorkspaceAuditCategory);
  }

  function handleActionChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedAction(
      event.target.value as OpsWorkspaceAuditEntry["action"] | ""
    );
  }

  if (!workspaceSlug || !audit) {
    return (
      <SurfaceGrid>
        <SurfaceCard
          body="Sign in with workspace access to review audit activity and export it from ops."
          eyebrow="Session required"
          span={12}
          title="Workspace audit unavailable"
        />
      </SurfaceGrid>
    );
  }

  return (
    <>
      <SurfaceGrid>
        <SurfaceCard
          body="Use category and action filters to narrow the operational timeline, then export the current filter to CSV for offline review or handoff."
          eyebrow="Filters"
          span={4}
          title="Audit controls"
        >
          <div className="grid gap-3">
            <FieldStack>
              <FieldLabel>Category</FieldLabel>
              <SelectField onChange={handleCategoryChange} value={category}>
                {auditCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </FieldStack>
            <FieldStack>
              <FieldLabel>Action</FieldLabel>
              <SelectField onChange={handleActionChange} value={selectedAction}>
                <option value="">All actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll("_", " ")}
                  </option>
                ))}
              </SelectField>
            </FieldStack>
            <ActionRow compact>
              <ActionButton
                disabled={isRefreshing}
                onClick={() => {
                  void refreshAudit();
                }}
                tone="primary"
                type="button"
              >
                {isRefreshing ? "Refreshing…" : "Apply filters"}
              </ActionButton>
              <ActionLink
                href={buildAuditUrl({
                  action: selectedAction,
                  category,
                  format: "csv"
                })}
                tone="inline"
              >
                Export CSV
              </ActionLink>
            </ActionRow>
          </div>
          <ActionRow compact className="mt-3">
            <Pill>{workspaceSlug}</Pill>
            <Pill>{audit.audit.entries.length} loaded</Pill>
            <Pill>{category.replaceAll("_", " ")}</Pill>
          </ActionRow>
        </SurfaceCard>
        <SurfaceCard
          body="The audit stream now centralizes access, ownership-transfer, workspace lifecycle, and policy events so operators do not have to pivot between settings screens to reconstruct what happened."
          eyebrow="Timeline"
          span={8}
          title="Workspace activity"
        >
          <OpsPillRow>
            <Pill>{audit.audit.actions.length} matching actions</Pill>
            <Pill>
              {audit.audit.nextCursor
                ? "more history available"
                : "end of current history"}
            </Pill>
            <ActionLink href="/studio/settings" tone="inline">
              Settings audit source
            </ActionLink>
          </OpsPillRow>
          {audit.audit.entries.length ? (
            <div className="mt-3 space-y-3">
              {audit.audit.entries.map((entry: OpsWorkspaceAuditEntry) => {
                const operationalMetadata =
                  formatAuditOperationalMetadata(entry);

                return (
                  <OpsPanelCard tone="neutral" key={entry.id}>
                    <div className="grid gap-1">
                      <strong>{entry.action.replaceAll("_", " ")}</strong>
                      <span>
                        {formatDateTime(entry.createdAt)} ·{" "}
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span>
                        Actor {entry.actorWalletAddress ?? entry.actorUserId}
                        {entry.targetWalletAddress
                          ? ` · target ${entry.targetWalletAddress}`
                          : ""}
                      </span>
                      <span>
                        {formatAuditRoleMetadata(entry)}
                        {entry.membershipId
                          ? ` · membership ${entry.membershipId}`
                          : ""}
                        {entry.requestId ? ` · request ${entry.requestId}` : ""}
                      </span>
                      {operationalMetadata ? (
                        <span>{operationalMetadata}</span>
                      ) : null}
                      {entry.reason ? <span>Reason {entry.reason}</span> : null}
                    </div>
                  </OpsPanelCard>
                );
              })}
            </div>
          ) : (
            <EmptyState className="mt-3 p-3">
              No audit entries matched the current filter.
            </EmptyState>
          )}
          {audit.audit.nextCursor ? (
            <ActionRow compact className="mt-3">
              <ActionButton
                disabled={isLoadingMore}
                type="button"
                onClick={() => {
                  void handleLoadMore();
                }}
                tone="primary"
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </ActionButton>
            </ActionRow>
          ) : null}
        </SurfaceCard>
      </SurfaceGrid>
      {notice ? (
        <OpsStatusNotice className="mt-4" tone={notice.tone}>
          {notice.message}
        </OpsStatusNotice>
      ) : null}
    </>
  );
}
