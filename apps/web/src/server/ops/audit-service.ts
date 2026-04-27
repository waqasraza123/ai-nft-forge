import {
  opsWorkspaceAuditQuerySchema,
  opsWorkspaceAuditResponseSchema,
  studioWorkspaceAuditActionSchema,
  type OpsWorkspaceAuditCategory
} from "@ai-nft-forge/shared";
import { z } from "zod";

import { OpsServiceError } from "./error";

type AuditLogRecord = {
  action: string;
  actorId: string;
  actorType: string;
  createdAt: Date;
  entityId: string;
  entityType: string;
  id: string;
  metadataJson: unknown;
};

type OpsAuditRepositorySet = {
  auditLogRepository: {
    listByEntity(input: {
      actions?: string[];
      cursor?: string;
      entityId: string;
      entityType: string;
      limit?: number;
    }): Promise<AuditLogRecord[]>;
  };
};

type OpsAuditServiceDependencies = {
  repositories: OpsAuditRepositorySet;
};

type SerializedAuditEntry = NonNullable<
  ReturnType<typeof serializeAuditLogEntry>
>;

const auditMetadataDateTimeSchema = z.string().datetime();
const auditMetadataIntegerSchema = z.number().int();
const auditMetadataNonEmptyStringSchema = z.string().min(1);
const auditMetadataSha256HashSchema = z.string().regex(/^[a-f0-9]{64}$/);

function parseWorkspaceRole(value: unknown) {
  return value === "owner" || value === "operator" || value === "viewer"
    ? value
    : null;
}

function parseAccessReviewStatus(value: unknown) {
  return value === "never_recorded" ||
    value === "current" ||
    value === "changed"
    ? value
    : null;
}

function parseDecommissionNotificationKind(value: unknown) {
  return value === "scheduled" || value === "upcoming" || value === "ready"
    ? value
    : null;
}

const workspaceAccessAuditActions = [
  "workspace_access_review_recorded",
  "workspace_created",
  "workspace_invitation_accepted",
  "workspace_invitation_canceled",
  "workspace_invitation_created",
  "workspace_invitation_role_updated",
  "workspace_member_added",
  "workspace_member_removed",
  "workspace_member_role_updated"
] as const;

const ownershipTransferAuditActions = [
  "workspace_owner_transferred",
  "workspace_role_escalation_approved",
  "workspace_role_escalation_canceled",
  "workspace_role_escalation_rejected",
  "workspace_role_escalation_requested"
] as const;
const ownershipTransferAuditActionSet = new Set<string>(
  ownershipTransferAuditActions
);

const workspaceLifecycleAuditActions = [
  "workspace_archived",
  "workspace_decommission_canceled",
  "workspace_decommission_executed",
  "workspace_decommission_notification_recorded",
  "workspace_decommission_scheduled",
  "workspace_invitation_reminder_sent",
  "workspace_reactivated",
  "workspace_suspended"
] as const;
const workspaceLifecycleAuditActionSet = new Set<string>(
  workspaceLifecycleAuditActions
);

const workspacePolicyAuditActions = [
  "workspace_lifecycle_automation_policy_updated",
  "workspace_lifecycle_delivery_policy_updated",
  "workspace_lifecycle_sla_policy_updated",
  "workspace_retention_policy_updated"
] as const;
const workspacePolicyAuditActionSet = new Set<string>(
  workspacePolicyAuditActions
);

const allWorkspaceAuditActions = [
  ...workspaceAccessAuditActions,
  ...ownershipTransferAuditActions,
  ...workspaceLifecycleAuditActions,
  ...workspacePolicyAuditActions
] as const satisfies ReadonlyArray<
  (typeof studioWorkspaceAuditActionSchema.options)[number]
>;

function resolveAuditActionsForCategory(category: OpsWorkspaceAuditCategory) {
  if (category === "workspace_access") {
    return [...workspaceAccessAuditActions];
  }

  if (category === "ownership_transfer") {
    return [...ownershipTransferAuditActions];
  }

  if (category === "workspace_lifecycle") {
    return [...workspaceLifecycleAuditActions];
  }

  if (category === "workspace_policy") {
    return [...workspacePolicyAuditActions];
  }

  return [...allWorkspaceAuditActions];
}

function resolveAuditCategory(
  action: (typeof studioWorkspaceAuditActionSchema.options)[number]
): Exclude<OpsWorkspaceAuditCategory, "all"> {
  if (ownershipTransferAuditActionSet.has(action)) {
    return "ownership_transfer";
  }

  if (workspaceLifecycleAuditActionSet.has(action)) {
    return "workspace_lifecycle";
  }

  if (workspacePolicyAuditActionSet.has(action)) {
    return "workspace_policy";
  }

  return "workspace_access";
}

function parseAuditMetadata(metadataJson: unknown) {
  return typeof metadataJson === "object" && metadataJson !== null
    ? metadataJson
    : {};
}

function getMetadataBoolean(input: { key: string; metadata: object }) {
  const metadata = input.metadata as Record<string, unknown>;

  return typeof metadata[input.key] === "boolean"
    ? (metadata[input.key] as boolean)
    : null;
}

function getMetadataNumber(input: { key: string; metadata: object }) {
  const metadata = input.metadata as Record<string, unknown>;
  const parsed = auditMetadataIntegerSchema.safeParse(metadata[input.key]);

  return parsed.success ? parsed.data : null;
}

function getMetadataString(input: { key: string; metadata: object }) {
  const metadata = input.metadata as Record<string, unknown>;
  const parsed = auditMetadataNonEmptyStringSchema.safeParse(
    metadata[input.key]
  );

  return parsed.success ? parsed.data : null;
}

function getMetadataDateTimeString(input: { key: string; metadata: object }) {
  const metadata = input.metadata as Record<string, unknown>;
  const parsed = auditMetadataDateTimeSchema.safeParse(metadata[input.key]);

  return parsed.success ? parsed.data : null;
}

function getMetadataSha256Hash(input: { key: string; metadata: object }) {
  const metadata = input.metadata as Record<string, unknown>;
  const parsed = auditMetadataSha256HashSchema.safeParse(metadata[input.key]);

  return parsed.success ? parsed.data : null;
}

function serializeAuditLogEntry(input: AuditLogRecord) {
  const parsedAction = studioWorkspaceAuditActionSchema.safeParse(input.action);

  if (!parsedAction.success) {
    return null;
  }

  const metadata = parseAuditMetadata(input.metadataJson);

  return {
    accessReviewLatestAttestationRecordedAt: getMetadataDateTimeString({
      key: "accessReviewLatestAttestationRecordedAt",
      metadata
    }),
    accessReviewLatestHash: getMetadataSha256Hash({
      key: "accessReviewLatestHash",
      metadata
    }),
    accessReviewStatus: parseAccessReviewStatus(
      getMetadataString({
        key: "accessReviewStatus",
        metadata
      })
    ),
    action: parsedAction.data,
    actorUserId: input.actorId,
    actorWalletAddress:
      "actorWalletAddress" in metadata &&
      typeof metadata.actorWalletAddress === "string"
        ? metadata.actorWalletAddress
        : null,
    automateDecommissionNotices: getMetadataBoolean({
      key: "automateDecommissionNotices",
      metadata
    }),
    automateInvitationReminders: getMetadataBoolean({
      key: "automateInvitationReminders",
      metadata
    }),
    automation: getMetadataBoolean({
      key: "automation",
      metadata
    }),
    category: resolveAuditCategory(parsedAction.data),
    createdAt: input.createdAt.toISOString(),
    defaultDecommissionRetentionDays: getMetadataNumber({
      key: "defaultDecommissionRetentionDays",
      metadata
    }),
    deliverDecommissionNotifications: getMetadataBoolean({
      key: "deliverDecommissionNotifications",
      metadata
    }),
    deliverInvitationReminders: getMetadataBoolean({
      key: "deliverInvitationReminders",
      metadata
    }),
    executeAfter: getMetadataDateTimeString({
      key: "executeAfter",
      metadata
    }),
    exportConfirmedAt: getMetadataDateTimeString({
      key: "exportConfirmedAt",
      metadata
    }),
    id: input.id,
    lifecycleAutomationEnabled: getMetadataBoolean({
      key: "lifecycleAutomationEnabled",
      metadata
    }),
    lifecycleSlaAutomationMaxAgeMinutes: getMetadataNumber({
      key: "lifecycleSlaAutomationMaxAgeMinutes",
      metadata
    }),
    lifecycleSlaEnabled: getMetadataBoolean({
      key: "lifecycleSlaEnabled",
      metadata
    }),
    lifecycleSlaWebhookFailureThreshold: getMetadataNumber({
      key: "lifecycleSlaWebhookFailureThreshold",
      metadata
    }),
    membershipId:
      "membershipId" in metadata && typeof metadata.membershipId === "string"
        ? metadata.membershipId
        : null,
    minimumDecommissionRetentionDays: getMetadataNumber({
      key: "minimumDecommissionRetentionDays",
      metadata
    }),
    notificationKind: parseDecommissionNotificationKind(
      getMetadataString({
        key: "notificationKind",
        metadata
      })
    ),
    requestId:
      "requestId" in metadata && typeof metadata.requestId === "string"
        ? metadata.requestId
        : null,
    previousRole:
      "previousRole" in metadata
        ? parseWorkspaceRole(metadata.previousRole)
        : null,
    reason: getMetadataString({
      key: "reason",
      metadata
    }),
    requireDecommissionReason: getMetadataBoolean({
      key: "requireDecommissionReason",
      metadata
    }),
    retentionDays: getMetadataNumber({
      key: "retentionDays",
      metadata
    }),
    reviewGeneratedAt: getMetadataDateTimeString({
      key: "reviewGeneratedAt",
      metadata
    }),
    reviewHash: getMetadataSha256Hash({
      key: "reviewHash",
      metadata
    }),
    role: "role" in metadata ? parseWorkspaceRole(metadata.role) : null,
    targetUserId:
      "targetUserId" in metadata && typeof metadata.targetUserId === "string"
        ? metadata.targetUserId
        : null,
    targetWalletAddress:
      "targetWalletAddress" in metadata &&
      typeof metadata.targetWalletAddress === "string"
        ? metadata.targetWalletAddress
        : null,
    webhookEnabled: getMetadataBoolean({
      key: "webhookEnabled",
      metadata
    })
  };
}

function escapeCsvValue(value: boolean | number | string | null) {
  if (value === null) {
    return "";
  }

  if (typeof value !== "string") {
    return String(value);
  }

  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function buildAuditCsv(input: { entries: SerializedAuditEntry[] }) {
  const header = [
    "created_at",
    "category",
    "action",
    "actor_user_id",
    "actor_wallet_address",
    "target_user_id",
    "target_wallet_address",
    "previous_role",
    "role",
    "review_hash",
    "review_generated_at",
    "access_review_status",
    "access_review_latest_hash",
    "access_review_latest_attestation_recorded_at",
    "automation",
    "notification_kind",
    "execute_after",
    "export_confirmed_at",
    "retention_days",
    "reason",
    "retention_default_days",
    "retention_minimum_days",
    "retention_reason_required",
    "lifecycle_automation_enabled",
    "automate_invitation_reminders",
    "automate_decommission_notices",
    "webhook_enabled",
    "deliver_invitation_reminders",
    "deliver_decommission_notifications",
    "lifecycle_sla_enabled",
    "lifecycle_sla_automation_max_age_minutes",
    "lifecycle_sla_webhook_failure_threshold",
    "membership_id",
    "request_id"
  ].join(",");

  const rows = input.entries.map((entry) =>
    [
      entry.createdAt,
      entry.category,
      entry.action,
      entry.actorUserId,
      entry.actorWalletAddress,
      entry.targetUserId,
      entry.targetWalletAddress,
      entry.previousRole,
      entry.role,
      entry.reviewHash,
      entry.reviewGeneratedAt,
      entry.accessReviewStatus,
      entry.accessReviewLatestHash,
      entry.accessReviewLatestAttestationRecordedAt,
      entry.automation,
      entry.notificationKind,
      entry.executeAfter,
      entry.exportConfirmedAt,
      entry.retentionDays,
      entry.reason,
      entry.defaultDecommissionRetentionDays,
      entry.minimumDecommissionRetentionDays,
      entry.requireDecommissionReason,
      entry.lifecycleAutomationEnabled,
      entry.automateInvitationReminders,
      entry.automateDecommissionNotices,
      entry.webhookEnabled,
      entry.deliverInvitationReminders,
      entry.deliverDecommissionNotifications,
      entry.lifecycleSlaEnabled,
      entry.lifecycleSlaAutomationMaxAgeMinutes,
      entry.lifecycleSlaWebhookFailureThreshold,
      entry.membershipId,
      entry.requestId
    ]
      .map((value) => escapeCsvValue(value))
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function createOpsAuditService(
  dependencies: OpsAuditServiceDependencies
) {
  return {
    async getWorkspaceAudit(input: {
      action?: (typeof studioWorkspaceAuditActionSchema.options)[number];
      category?: OpsWorkspaceAuditCategory;
      cursor?: string;
      limit?: number;
      workspaceId: string;
    }) {
      const parsedQuery = opsWorkspaceAuditQuerySchema.parse({
        action: input.action,
        category: input.category ?? "all",
        cursor: input.cursor,
        limit: input.limit ?? 25
      });

      const actions =
        parsedQuery.action !== undefined
          ? [parsedQuery.action]
          : resolveAuditActionsForCategory(parsedQuery.category ?? "all");
      const auditLogs =
        await dependencies.repositories.auditLogRepository.listByEntity({
          actions,
          ...(parsedQuery.cursor
            ? {
                cursor: parsedQuery.cursor
              }
            : {}),
          entityId: input.workspaceId,
          entityType: "workspace",
          limit: (parsedQuery.limit ?? 25) + 1
        });
      const hasMore = auditLogs.length > (parsedQuery.limit ?? 25);
      const serializedEntries = auditLogs
        .slice(0, parsedQuery.limit ?? 25)
        .flatMap((auditLog) => {
          const serializedEntry = serializeAuditLogEntry(auditLog);

          return serializedEntry ? [serializedEntry] : [];
        });

      return opsWorkspaceAuditResponseSchema.parse({
        audit: {
          actions,
          category: parsedQuery.category ?? "all",
          entries: serializedEntries,
          limit: parsedQuery.limit ?? 25,
          nextCursor: hasMore
            ? (serializedEntries[serializedEntries.length - 1]?.id ?? null)
            : null
        }
      });
    },

    async exportWorkspaceAuditCsv(input: {
      action?: (typeof studioWorkspaceAuditActionSchema.options)[number];
      category?: OpsWorkspaceAuditCategory;
      workspaceId: string;
    }) {
      const parsedQuery = opsWorkspaceAuditQuerySchema.parse({
        action: input.action,
        category: input.category ?? "all"
      });

      const actions =
        parsedQuery.action !== undefined
          ? [parsedQuery.action]
          : resolveAuditActionsForCategory(parsedQuery.category ?? "all");
      const auditLogs =
        await dependencies.repositories.auditLogRepository.listByEntity({
          actions,
          entityId: input.workspaceId,
          entityType: "workspace",
          limit: 500
        });
      const entries = auditLogs.flatMap((auditLog) => {
        const serializedEntry = serializeAuditLogEntry(auditLog);

        return serializedEntry ? [serializedEntry] : [];
      });

      if (entries.length === 0) {
        throw new OpsServiceError(
          "INVALID_REQUEST",
          "No workspace audit events matched the requested export filter.",
          404
        );
      }

      return {
        csv: buildAuditCsv({
          entries
        }),
        filename: `workspace-audit-${input.workspaceId}.csv`
      };
    }
  };
}
