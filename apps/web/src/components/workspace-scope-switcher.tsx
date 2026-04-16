"use client";

import {
  startTransition,
  type ChangeEvent,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";

import { ActionButton, Pill } from "@ai-nft-forge/ui";
import {
  studioWorkspaceSelectionResponseSchema,
  type StudioWorkspaceScopeSummary
} from "@ai-nft-forge/shared";

type WorkspaceScopeSwitcherProps = {
  currentWorkspaceSlug: string | null;
  workspaces: StudioWorkspaceScopeSummary[];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
};

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 404:
      return "The requested workspace is not available.";
    default:
      return "Workspace scope could not be changed.";
  }
}

function getNoticeToneClass(tone: NoticeState["tone"]) {
  if (tone === "error") {
    return "border-red-400/45 bg-red-500/10 text-red-100";
  }

  if (tone === "success") {
    return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
  }

  return "border-cyan-400/35 bg-cyan-500/12 text-cyan-100";
}

export function WorkspaceScopeSwitcher({
  currentWorkspaceSlug,
  workspaces
}: WorkspaceScopeSwitcherProps) {
  const router = useRouter();
  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState(
    currentWorkspaceSlug ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const activeWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.slug === currentWorkspaceSlug) ??
      workspaces[0] ??
      null,
    [currentWorkspaceSlug, workspaces]
  );

  useEffect(() => {
    setSelectedWorkspaceSlug(currentWorkspaceSlug ?? workspaces[0]?.slug ?? "");
  }, [currentWorkspaceSlug, workspaces]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setNotice({
      message:
        selectedWorkspaceSlug.length > 0
          ? `Switching to ${selectedWorkspaceSlug}…`
          : "Resetting workspace scope…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/workspace-selection", {
        body: JSON.stringify({
          workspaceSlug:
            selectedWorkspaceSlug.length > 0 ? selectedWorkspaceSlug : null
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
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

        throw new Error(createFallbackErrorMessage(response));
      }

      studioWorkspaceSelectionResponseSchema.parse(payload);
      startTransition(() => {
        router.refresh();
      });
      setNotice({
        message: "Workspace scope updated.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace scope could not be changed.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedWorkspaceSlug(event.target.value);
  }

  return (
    <section className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/70 p-4">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
          Active workspace
        </span>
        <select
          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm text-[color:var(--color-text)]"
          onChange={handleChange}
          value={selectedWorkspaceSlug}
        >
          {workspaces.length === 0 ? (
            <option value="">No accessible workspaces</option>
          ) : null}
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.slug}>
              {workspace.name} · {workspace.role} · {workspace.status}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3">
        <ActionButton
          disabled={
            isSubmitting ||
            selectedWorkspaceSlug === (currentWorkspaceSlug ?? "") ||
            workspaces.length === 0
          }
          onClick={() => {
            void handleSubmit();
          }}
          tone="primary"
          type="button"
        >
          {isSubmitting ? "Switching…" : "Switch workspace"}
        </ActionButton>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill>{activeWorkspace?.slug ?? "no workspace"}</Pill>
        <Pill>{activeWorkspace?.role ?? "owner"}</Pill>
        <Pill>{workspaces.length} accessible</Pill>
      </div>
      {notice ? (
        <div
          className={`mt-3 rounded-xl border p-3 text-sm ${getNoticeToneClass(notice.tone)}`}
        >
          <strong className="block font-semibold">
            {notice.tone === "error"
              ? "Workspace error"
              : notice.tone === "success"
                ? "Workspace updated"
                : "Working"}
          </strong>
          <span>{notice.message}</span>
        </div>
      ) : null}
    </section>
  );
}
