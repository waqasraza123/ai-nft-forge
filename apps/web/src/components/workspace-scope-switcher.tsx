"use client";

import {
  startTransition,
  type ChangeEvent,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";

import {
  studioWorkspaceSelectionResponseSchema,
  type StudioWorkspaceScopeSummary
} from "@ai-nft-forge/shared";
import { Pill } from "@ai-nft-forge/ui";

type WorkspaceScopeSwitcherProps = {
  currentWorkspaceSlug: string | null;
  workspaces: StudioWorkspaceScopeSummary[];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

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

export function WorkspaceScopeSwitcher({
  currentWorkspaceSlug,
  workspaces
}: WorkspaceScopeSwitcherProps) {
  const router = useRouter();
  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState(
    currentWorkspaceSlug ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
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
    <div className="studio-form">
      <label className="field-stack">
        <span className="field-label">Active workspace</span>
        <select
          className="input-field"
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
      <div className="studio-action-row">
        <button
          className="button-action"
          disabled={
            isSubmitting ||
            selectedWorkspaceSlug === (currentWorkspaceSlug ?? "") ||
            workspaces.length === 0
          }
          onClick={() => {
            void handleSubmit();
          }}
          type="button"
        >
          {isSubmitting ? "Switching…" : "Switch workspace"}
        </button>
      </div>
      <div className="pill-row">
        <Pill>{activeWorkspace?.slug ?? "no workspace"}</Pill>
        <Pill>{activeWorkspace?.role ?? "owner"}</Pill>
        <Pill>{workspaces.length} accessible</Pill>
      </div>
      {notice ? (
        <div
          className={`status-banner ${
            notice.tone === "error"
              ? "status-banner--error"
              : notice.tone === "success"
                ? "status-banner--success"
                : ""
          }`}
        >
          <strong>
            {notice.tone === "error"
              ? "Workspace error"
              : notice.tone === "success"
                ? "Workspace updated"
                : "Working"}
          </strong>
          <span>{notice.message}</span>
        </div>
      ) : null}
    </div>
  );
}
