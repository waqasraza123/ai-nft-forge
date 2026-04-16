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
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-emerald-200/20 bg-emerald-500/8 p-3 text-emerald-100">
            <strong className="font-semibold">No accessible workspaces</strong>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Workspace summaries will appear here after ownership or operator
              access is provisioned.
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
                  <h3 className="text-base font-semibold">{entry.workspace.name}</h3>
                  <p className="text-sm text-[color:var(--color-muted)]">
                    {entry.workspace.slug} · {entry.workspace.role} ·{" "}
                    {entry.workspace.status}
                  </p>
                </div>
                {entry.current ? <Pill>Current workspace</Pill> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>{entry.brandCount} brands</Pill>
                <Pill>{entry.memberCount} members</Pill>
                <Pill>{entry.pendingInvitationCount} pending invites</Pill>
                <Pill>{entry.expiringInvitationCount} expiring invites</Pill>
                <Pill>{entry.expiredInvitationCount} expired invites</Pill>
                <Pill>
                  {entry.pendingRoleEscalationCount} pending escalations
                </Pill>
              </div>
              <p className="text-sm text-[color:var(--color-muted)]">
                Last activity: {formatDateTime(entry.lastActivityAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}
