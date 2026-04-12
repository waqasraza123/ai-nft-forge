type WorkspaceStatus = "active" | "archived" | "suspended";

export function resolvePreferredAccessibleWorkspace<
  T extends {
    status: WorkspaceStatus;
  }
>(workspaces: T[]) {
  return workspaces.find((workspace) => workspace.status === "active") ?? workspaces[0] ?? null;
}

export function createInactiveWorkspaceMessage(status: WorkspaceStatus) {
  if (status === "archived") {
    return "This workspace is archived and read-only. Reactivate it before making changes.";
  }

  if (status === "suspended") {
    return "This workspace is suspended and read-only. Reactivate it before making changes.";
  }

  return "This workspace is not active.";
}

export function assertWorkspaceIsActive<T extends { status: WorkspaceStatus }>(
  workspace: T,
  createError: (message: string) => Error
): asserts workspace is T & { status: "active" } {
  if (workspace.status !== "active") {
    throw createError(createInactiveWorkspaceMessage(workspace.status));
  }
}
