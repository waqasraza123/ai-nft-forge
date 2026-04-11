"use client";

import Link from "next/link";
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
import { Pill, SurfaceCard, SurfaceGrid } from "@ai-nft-forge/ui";

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
          <div className="studio-form">
            <label className="field-stack">
              <span className="field-label">Category</span>
              <select
                className="input-field"
                onChange={handleCategoryChange}
                value={category}
              >
                {auditCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span className="field-label">Action</span>
              <select
                className="input-field"
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
            </label>
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={isRefreshing}
                onClick={() => {
                  void refreshAudit();
                }}
                type="button"
              >
                {isRefreshing ? "Refreshing…" : "Apply filters"}
              </button>
              <a
                className="action-link"
                href={buildAuditUrl({
                  action: selectedAction,
                  category,
                  format: "csv"
                })}
              >
                Export CSV
              </a>
            </div>
          </div>
          <div className="pill-row">
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
          <div className="pill-row">
            <Pill>{audit.audit.actions.length} matching actions</Pill>
            <Pill>
              {audit.audit.nextCursor
                ? "more history available"
                : "end of current history"}
            </Pill>
            <Link className="inline-link" href="/studio/settings">
              Settings audit source
            </Link>
          </div>
          {audit.audit.entries.length ? (
            <div className="collection-item-list">
              {audit.audit.entries.map((entry: OpsWorkspaceAuditEntry) => (
                <div className="collection-item-card" key={entry.id}>
                  <div className="collection-item-card__copy">
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
                </div>
              ))}
            </div>
          ) : (
            <div className="collection-empty-state">
              No audit entries matched the current filter.
            </div>
          )}
          {audit.audit.nextCursor ? (
            <div className="studio-action-row">
              <button
                className="button-action"
                disabled={isLoadingMore}
                onClick={() => {
                  void handleLoadMore();
                }}
                type="button"
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </SurfaceCard>
      </SurfaceGrid>
      {notice ? (
        <div className={`notice-banner notice-banner--${notice.tone}`}>
          {notice.message}
        </div>
      ) : null}
    </>
  );
}
