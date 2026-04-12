import {
  opsWorkspaceAuditQuerySchema,
  opsWorkspaceAuditResponseSchema,
  studioWorkspaceAuditActionSchema,
  type OpsWorkspaceAuditCategory
} from "@ai-nft-forge/shared";

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

const workspaceAccessAuditActions = [
  "workspace_created",
  "workspace_invitation_accepted",
  "workspace_invitation_canceled",
  "workspace_invitation_created",
  "workspace_member_added",
  "workspace_member_removed"
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

const allWorkspaceAuditActions = [
  ...workspaceAccessAuditActions,
  ...ownershipTransferAuditActions
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

  return [...allWorkspaceAuditActions];
}

function resolveAuditCategory(
  action: (typeof studioWorkspaceAuditActionSchema.options)[number]
): Exclude<OpsWorkspaceAuditCategory, "all"> {
  return ownershipTransferAuditActionSet.has(action)
    ? "ownership_transfer"
    : "workspace_access";
}

function parseAuditMetadata(metadataJson: unknown) {
  return typeof metadataJson === "object" && metadataJson !== null
    ? metadataJson
    : {};
}

function serializeAuditLogEntry(input: AuditLogRecord) {
  const parsedAction = studioWorkspaceAuditActionSchema.safeParse(input.action);

  if (!parsedAction.success) {
    return null;
  }

  const metadata = parseAuditMetadata(input.metadataJson);

  return {
    action: parsedAction.data,
    actorUserId: input.actorId,
    actorWalletAddress:
      "actorWalletAddress" in metadata &&
      typeof metadata.actorWalletAddress === "string"
        ? metadata.actorWalletAddress
        : null,
    category: resolveAuditCategory(parsedAction.data),
    createdAt: input.createdAt.toISOString(),
    id: input.id,
    membershipId:
      "membershipId" in metadata && typeof metadata.membershipId === "string"
        ? metadata.membershipId
        : null,
    requestId:
      "requestId" in metadata && typeof metadata.requestId === "string"
        ? metadata.requestId
        : null,
    role:
      "role" in metadata &&
      (metadata.role === "owner" || metadata.role === "operator")
        ? metadata.role
        : null,
    targetUserId:
      "targetUserId" in metadata && typeof metadata.targetUserId === "string"
        ? metadata.targetUserId
        : null,
    targetWalletAddress:
      "targetWalletAddress" in metadata &&
      typeof metadata.targetWalletAddress === "string"
        ? metadata.targetWalletAddress
        : null
  };
}

function escapeCsvValue(value: string | null) {
  if (value === null) {
    return "";
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
    "role",
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
      entry.role,
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
