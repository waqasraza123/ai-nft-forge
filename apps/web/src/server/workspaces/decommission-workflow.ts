import type {
  WorkspaceDecommissionNotificationKind,
  WorkspaceDecommissionNotificationSummary,
  WorkspaceDecommissionWorkflowSummary
} from "@ai-nft-forge/shared";
import {
  getNextWorkspaceDecommissionNotificationKind,
  workspaceDecommissionNotificationSummarySchema,
  workspaceDecommissionWorkflowSummarySchema
} from "@ai-nft-forge/shared";

export { getNextWorkspaceDecommissionNotificationKind } from "@ai-nft-forge/shared";

type DecommissionNotificationRecord = {
  id: string;
  kind: WorkspaceDecommissionNotificationKind;
  requestId: string;
  sentAt: Date;
  sentByUser: {
    walletAddress: string;
  };
  sentByUserId: string;
};

export function serializeWorkspaceDecommissionNotification(
  input: Pick<
    DecommissionNotificationRecord,
    "id" | "kind" | "sentAt" | "sentByUser" | "sentByUserId"
  >
): WorkspaceDecommissionNotificationSummary {
  return workspaceDecommissionNotificationSummarySchema.parse({
    id: input.id,
    kind: input.kind,
    sentAt: input.sentAt.toISOString(),
    sentByUserId: input.sentByUserId,
    sentByWalletAddress: input.sentByUser.walletAddress
  });
}

export function createWorkspaceDecommissionWorkflowSummary(input: {
  executeAfter: Date;
  notifications: DecommissionNotificationRecord[];
  now: Date;
}): WorkspaceDecommissionWorkflowSummary {
  const sortedNotifications = [...input.notifications].sort((left, right) => {
    const sentAtDifference = right.sentAt.getTime() - left.sentAt.getTime();

    if (sentAtDifference !== 0) {
      return sentAtDifference;
    }

    return right.id.localeCompare(left.id);
  });

  const latestNotification = sortedNotifications[0]
    ? serializeWorkspaceDecommissionNotification(sortedNotifications[0])
    : null;

  return workspaceDecommissionWorkflowSummarySchema.parse({
    latestNotification,
    nextDueKind: getNextWorkspaceDecommissionNotificationKind({
      executeAfter: input.executeAfter,
      existingNotificationKinds: sortedNotifications.map(
        (notification) => notification.kind
      ),
      now: input.now
    }),
    notificationCount: sortedNotifications.length
  });
}
