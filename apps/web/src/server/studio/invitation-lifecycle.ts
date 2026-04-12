import type { StudioWorkspaceInvitationStatus } from "@ai-nft-forge/shared";

export const workspaceInvitationExpiringWindowMilliseconds =
  72 * 60 * 60 * 1000;
export const workspaceInvitationReminderCooldownMilliseconds =
  24 * 60 * 60 * 1000;

export function getWorkspaceInvitationStatus(input: {
  expiresAt: Date;
  now: Date;
}): StudioWorkspaceInvitationStatus {
  const expiresAtTime = input.expiresAt.getTime();
  const nowTime = input.now.getTime();

  if (expiresAtTime <= nowTime) {
    return "expired";
  }

  if (expiresAtTime - nowTime <= workspaceInvitationExpiringWindowMilliseconds) {
    return "expiring";
  }

  return "active";
}

export function isWorkspaceInvitationPending(
  status: StudioWorkspaceInvitationStatus
) {
  return status !== "expired";
}

export function getWorkspaceInvitationReminderReadyAt(input: {
  lastRemindedAt: Date | null;
}) {
  if (!input.lastRemindedAt) {
    return null;
  }

  return new Date(
    input.lastRemindedAt.getTime() +
      workspaceInvitationReminderCooldownMilliseconds
  );
}

export function canSendWorkspaceInvitationReminder(input: {
  expiresAt: Date;
  lastRemindedAt: Date | null;
  now: Date;
}) {
  if (getWorkspaceInvitationStatus(input) === "expired") {
    return false;
  }

  const reminderReadyAt = getWorkspaceInvitationReminderReadyAt({
    lastRemindedAt: input.lastRemindedAt
  });

  if (!reminderReadyAt) {
    return true;
  }

  return reminderReadyAt.getTime() <= input.now.getTime();
}
