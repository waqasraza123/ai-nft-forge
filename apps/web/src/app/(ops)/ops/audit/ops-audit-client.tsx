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
  FieldLabel,
  FieldStack,
  Pill,
  StatusBanner,
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
  }
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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
              <select
                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                onChange={handleCategoryChange}
                value={category}
              >
                {auditCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldStack>
            <FieldStack>
              <FieldLabel>Action</FieldLabel>
              <select
                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                onChange={handleActionChange}
                value={selectedAction}
              >
                <option value="">All actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </FieldStack>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{workspaceSlug}</Pill>
            <Pill>{audit.audit.entries.length} loaded</Pill>
            <Pill>{category.replaceAll("_", " ")}</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The audit stream now centralizes invitation, membership, and ownership-transfer lifecycle events so operators do not have to pivot between settings screens to reconstruct what happened."
          eyebrow="Timeline"
          span={8}
          title="Workspace activity"
        >
          <div className="flex flex-wrap gap-2">
            <Pill>{audit.audit.actions.length} matching actions</Pill>
            <Pill>
              {audit.audit.nextCursor
                ? "more history available"
                : "end of current history"}
            </Pill>
            <ActionLink href="/studio/settings" tone="inline">
              Settings audit source
            </ActionLink>
          </div>
          {audit.audit.entries.length ? (
            <div className="mt-3 space-y-3">
              {audit.audit.entries.map((entry: OpsWorkspaceAuditEntry) => (
                <article
                  className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4"
                  key={entry.id}
                >
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
                      {entry.role ? `Role ${entry.role}` : "No role metadata"}
                      {entry.membershipId
                        ? ` · membership ${entry.membershipId}`
                        : ""}
                      {entry.requestId ? ` · request ${entry.requestId}` : ""}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-muted)]">
              No audit entries matched the current filter.
            </div>
          )}
          {audit.audit.nextCursor ? (
            <div className="mt-3 flex flex-wrap gap-2">
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
            </div>
          ) : null}
        </SurfaceCard>
      </SurfaceGrid>
      {notice ? (
        <StatusBanner className="mt-4" tone={notice.tone}>
          {notice.message}
        </StatusBanner>
      ) : null}
    </>
  );
}
