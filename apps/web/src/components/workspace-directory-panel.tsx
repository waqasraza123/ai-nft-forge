"use client";

import { Pill, SurfaceCard } from "@ai-nft-forge/ui";
import type { StudioWorkspaceDirectoryEntry } from "@ai-nft-forge/shared";

type WorkspaceDirectoryPanelProps = {
  body: string;
  entries: StudioWorkspaceDirectoryEntry[];
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

export function WorkspaceDirectoryPanel({
  body,
  entries,
  eyebrow,
  span,
  title
}: WorkspaceDirectoryPanelProps) {
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
              Workspace summaries will appear here after ownership or operator
              access is provisioned.
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
                {entry.current ? <Pill>Current workspace</Pill> : null}
              </div>
              <div className="pill-row">
                <Pill>{entry.brandCount} brands</Pill>
                <Pill>{entry.memberCount} members</Pill>
                <Pill>{entry.pendingInvitationCount} pending invites</Pill>
                <Pill>
                  {entry.pendingRoleEscalationCount} pending escalations
                </Pill>
              </div>
              <p className="surface-card__body-copy">
                Last activity: {formatDateTime(entry.lastActivityAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}
