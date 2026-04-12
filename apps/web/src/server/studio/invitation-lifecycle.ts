export {
  canSendWorkspaceInvitationReminder,
  getWorkspaceInvitationReminderReadyAt,
  getWorkspaceInvitationStatus
} from "@ai-nft-forge/shared";

export function isWorkspaceInvitationPending(
  status: "active" | "expiring" | "expired"
) {
  return status !== "expired";
}
