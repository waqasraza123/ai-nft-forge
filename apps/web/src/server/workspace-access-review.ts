import { createHash } from "node:crypto";

import {
  studioWorkspaceAccessReviewAttestationResponseSchema,
  studioWorkspaceAccessReviewResponseSchema,
  studioWorkspaceAccessReviewVerificationSchema,
  studioWorkspaceAuditActionSchema,
  studioWorkspaceAuditEntrySchema,
  type StudioWorkspaceAccessReviewResponse,
  type StudioWorkspaceAccessReviewRow,
  type StudioWorkspaceAccessReviewSummary,
  type StudioWorkspaceAccessReviewVerification,
  type StudioWorkspaceRole,
  type StudioWorkspaceSummary
} from "@ai-nft-forge/shared";

import { getWorkspaceInvitationStatus } from "./studio/invitation-lifecycle";

export type WorkspaceAccessReviewAuditLogRecord = {
  action: string;
  actorId: string;
  createdAt: Date;
  id: string;
  metadataJson: unknown;
};

export type WorkspaceAccessReviewInvitationRecord = {
  createdAt: Date;
  expiresAt: Date;
  id: string;
  role: StudioWorkspaceRole;
  walletAddress: string;
};

export type WorkspaceAccessReviewMembershipRecord = {
  createdAt: Date;
  id: string;
  role: StudioWorkspaceRole;
  user: {
    id: string;
    walletAddress: string;
  };
};

export type WorkspaceAccessReviewOwnerRecord = {
  id: string;
  walletAddress: string;
};

export type WorkspaceAccessReviewRoleEscalationRecord = {
  createdAt: Date;
  id: string;
  requestedByUser: {
    walletAddress: string;
  };
  requestedByUserId: string;
  requestedRole: StudioWorkspaceRole;
  status: "approved" | "canceled" | "pending" | "rejected";
  targetUser: {
    walletAddress: string;
  };
  targetUserId: string;
};

export type WorkspaceAccessReviewWorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived" | "suspended";
};

function serializeWorkspace(input: WorkspaceAccessReviewWorkspaceRecord) {
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    status: input.status
  } satisfies StudioWorkspaceSummary;
}

function getAuditMetadataString(input: {
  auditLog: Pick<WorkspaceAccessReviewAuditLogRecord, "metadataJson">;
  key: string;
}) {
  const metadata: Record<string, unknown> =
    typeof input.auditLog.metadataJson === "object" &&
    input.auditLog.metadataJson !== null
      ? (input.auditLog.metadataJson as Record<string, unknown>)
      : {};
  const value = metadata[input.key];

  return typeof value === "string" ? value : null;
}

function getAuditMetadataNumber(input: {
  auditLog: Pick<WorkspaceAccessReviewAuditLogRecord, "metadataJson">;
  key: string;
}) {
  const metadata: Record<string, unknown> =
    typeof input.auditLog.metadataJson === "object" &&
    input.auditLog.metadataJson !== null
      ? (input.auditLog.metadataJson as Record<string, unknown>)
      : {};
  const value = metadata[input.key];

  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function serializeWorkspaceAccessReviewAuditEntry(
  input: WorkspaceAccessReviewAuditLogRecord
) {
  const parsedAction = studioWorkspaceAuditActionSchema.safeParse(input.action);

  if (!parsedAction.success) {
    return null;
  }

  const targetWalletAddress = getAuditMetadataString({
    auditLog: input,
    key: "targetWalletAddress"
  });
  const actorWalletAddress =
    getAuditMetadataString({
      auditLog: input,
      key: "actorWalletAddress"
    }) ?? targetWalletAddress;
  const membershipId = getAuditMetadataString({
    auditLog: input,
    key: "membershipId"
  });
  const previousRole = getAuditMetadataString({
    auditLog: input,
    key: "previousRole"
  });
  const reviewGeneratedAt = getAuditMetadataString({
    auditLog: input,
    key: "reviewGeneratedAt"
  });
  const reviewHash = getAuditMetadataString({
    auditLog: input,
    key: "reviewHash"
  });
  const role = getAuditMetadataString({
    auditLog: input,
    key: "role"
  });
  const targetUserId = getAuditMetadataString({
    auditLog: input,
    key: "targetUserId"
  });

  if (!actorWalletAddress) {
    return null;
  }

  const parsed = studioWorkspaceAuditEntrySchema.safeParse({
    action: parsedAction.data,
    actorUserId: input.actorId,
    actorWalletAddress,
    createdAt: input.createdAt.toISOString(),
    id: input.id,
    membershipId,
    previousRole,
    reviewGeneratedAt,
    reviewHash,
    role,
    targetUserId,
    targetWalletAddress
  });

  return parsed.success ? parsed.data : null;
}

function serializeAccessReviewAttestation(input: {
  auditLog: WorkspaceAccessReviewAuditLogRecord;
  workspace: WorkspaceAccessReviewWorkspaceRecord;
}) {
  if (input.auditLog.action !== "workspace_access_review_recorded") {
    return null;
  }

  const actorWalletAddress = getAuditMetadataString({
    auditLog: input.auditLog,
    key: "actorWalletAddress"
  });
  const reviewGeneratedAt = getAuditMetadataString({
    auditLog: input.auditLog,
    key: "reviewGeneratedAt"
  });
  const reviewHash = getAuditMetadataString({
    auditLog: input.auditLog,
    key: "reviewHash"
  });
  const auditEntryCount = getAuditMetadataNumber({
    auditLog: input.auditLog,
    key: "reviewAuditEntryCount"
  });
  const invitationCount = getAuditMetadataNumber({
    auditLog: input.auditLog,
    key: "reviewInvitationCount"
  });
  const memberCount = getAuditMetadataNumber({
    auditLog: input.auditLog,
    key: "reviewMemberCount"
  });
  const pendingRoleEscalationCount = getAuditMetadataNumber({
    auditLog: input.auditLog,
    key: "reviewPendingRoleEscalationCount"
  });
  const roleEscalationCount = getAuditMetadataNumber({
    auditLog: input.auditLog,
    key: "reviewRoleEscalationCount"
  });

  if (
    !actorWalletAddress ||
    !reviewGeneratedAt ||
    !reviewHash ||
    auditEntryCount === null ||
    invitationCount === null ||
    memberCount === null ||
    pendingRoleEscalationCount === null ||
    roleEscalationCount === null
  ) {
    return null;
  }

  const parsed =
    studioWorkspaceAccessReviewAttestationResponseSchema.shape.attestation.safeParse(
      {
        actorUserId: input.auditLog.actorId,
        actorWalletAddress,
        auditEntryId: input.auditLog.id,
        createdAt: input.auditLog.createdAt.toISOString(),
        reviewGeneratedAt,
        reviewHash,
        summary: {
          auditEntryCount,
          invitationCount,
          memberCount,
          pendingRoleEscalationCount,
          roleEscalationCount
        },
        workspace: serializeWorkspace(input.workspace)
      }
    );

  return parsed.success ? parsed.data : null;
}

function getLatestAccessReviewAttestation(input: {
  auditLogs: WorkspaceAccessReviewAuditLogRecord[];
  workspace: WorkspaceAccessReviewWorkspaceRecord;
}) {
  for (const auditLog of input.auditLogs) {
    const attestation = serializeAccessReviewAttestation({
      auditLog,
      workspace: input.workspace
    });

    if (attestation) {
      return attestation;
    }
  }

  return null;
}

function createAccessReviewEvidenceHash(input: {
  rows: StudioWorkspaceAccessReviewRow[];
  summary: StudioWorkspaceAccessReviewSummary;
  workspace: StudioWorkspaceSummary;
}) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createAccessReviewSummaryDelta(input: {
  current: StudioWorkspaceAccessReviewSummary;
  previous: StudioWorkspaceAccessReviewSummary;
}) {
  return {
    auditEntryCount:
      input.current.auditEntryCount - input.previous.auditEntryCount,
    invitationCount:
      input.current.invitationCount - input.previous.invitationCount,
    memberCount: input.current.memberCount - input.previous.memberCount,
    pendingRoleEscalationCount:
      input.current.pendingRoleEscalationCount -
      input.previous.pendingRoleEscalationCount,
    roleEscalationCount:
      input.current.roleEscalationCount - input.previous.roleEscalationCount
  };
}

function createWorkspaceAccessReviewSnapshot(input: {
  auditLogs: WorkspaceAccessReviewAuditLogRecord[];
  attestationAuditLogs: WorkspaceAccessReviewAuditLogRecord[];
  generatedAt: Date;
  invitations: WorkspaceAccessReviewInvitationRecord[];
  memberships: WorkspaceAccessReviewMembershipRecord[];
  now: Date;
  owner: WorkspaceAccessReviewOwnerRecord;
  roleEscalationRequests: WorkspaceAccessReviewRoleEscalationRecord[];
  workspace: WorkspaceAccessReviewWorkspaceRecord;
}) {
  const ownerMemberRow = {
    action: null,
    createdAt: null,
    expiresAt: null,
    invitationId: null,
    membershipId: null,
    previousRole: null,
    recordType: "member" as const,
    requestId: null,
    reviewGeneratedAt: null,
    reviewHash: null,
    role: "owner" as const,
    status: "active",
    targetUserId: null,
    targetWalletAddress: null,
    userId: input.owner.id,
    walletAddress: input.owner.walletAddress
  };
  const memberRows = input.memberships.map((membership) => ({
    action: null,
    createdAt: membership.createdAt.toISOString(),
    expiresAt: null,
    invitationId: null,
    membershipId: membership.id,
    previousRole: null,
    recordType: "member" as const,
    requestId: null,
    reviewGeneratedAt: null,
    reviewHash: null,
    role: membership.role,
    status: "active",
    targetUserId: null,
    targetWalletAddress: null,
    userId: membership.user.id,
    walletAddress: membership.user.walletAddress
  }));
  const invitationRows = input.invitations.map((invitation) => ({
    action: null,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    invitationId: invitation.id,
    membershipId: null,
    previousRole: null,
    recordType: "invitation" as const,
    requestId: null,
    reviewGeneratedAt: null,
    reviewHash: null,
    role: invitation.role,
    status: getWorkspaceInvitationStatus({
      expiresAt: invitation.expiresAt,
      now: input.now
    }),
    targetUserId: null,
    targetWalletAddress: null,
    userId: null,
    walletAddress: invitation.walletAddress
  }));
  const roleEscalationRows = input.roleEscalationRequests.map((request) => ({
    action: null,
    createdAt: request.createdAt.toISOString(),
    expiresAt: null,
    invitationId: null,
    membershipId: null,
    previousRole: null,
    recordType: "role_escalation" as const,
    requestId: request.id,
    reviewGeneratedAt: null,
    reviewHash: null,
    role: request.requestedRole,
    status: request.status,
    targetUserId: request.targetUserId,
    targetWalletAddress: request.targetUser.walletAddress,
    userId: request.requestedByUserId,
    walletAddress: request.requestedByUser.walletAddress
  }));
  const auditRows = input.auditLogs.flatMap((auditLog) => {
    const entry = serializeWorkspaceAccessReviewAuditEntry(auditLog);

    if (!entry || entry.action === "workspace_access_review_recorded") {
      return [];
    }

    return [
      {
        action: entry.action,
        createdAt: entry.createdAt,
        expiresAt: null,
        invitationId: null,
        membershipId: entry.membershipId,
        previousRole: entry.previousRole,
        recordType: "audit" as const,
        requestId: getAuditMetadataString({
          auditLog,
          key: "requestId"
        }),
        reviewGeneratedAt: entry.reviewGeneratedAt,
        reviewHash: entry.reviewHash,
        role: entry.role,
        status: null,
        targetUserId: entry.targetUserId,
        targetWalletAddress: entry.targetWalletAddress,
        userId: entry.actorUserId,
        walletAddress: entry.actorWalletAddress
      }
    ];
  });
  const rows = [
    ownerMemberRow,
    ...memberRows,
    ...invitationRows,
    ...roleEscalationRows,
    ...auditRows
  ];
  const summary = {
    auditEntryCount: auditRows.length,
    invitationCount: invitationRows.length,
    memberCount: memberRows.length + 1,
    pendingRoleEscalationCount: roleEscalationRows.filter(
      (row) => row.status === "pending"
    ).length,
    roleEscalationCount: roleEscalationRows.length
  };
  const workspace = serializeWorkspace(input.workspace);
  const evidenceHash = createAccessReviewEvidenceHash({
    rows,
    summary,
    workspace
  });
  const latestAttestation = getLatestAccessReviewAttestation({
    auditLogs: input.attestationAuditLogs,
    workspace: input.workspace
  });
  const attestationStatus = latestAttestation
    ? latestAttestation.reviewHash === evidenceHash
      ? "current"
      : "changed"
    : "never_recorded";
  const summaryDelta = latestAttestation
    ? createAccessReviewSummaryDelta({
        current: summary,
        previous: latestAttestation.summary
      })
    : null;

  return {
    attestationStatus,
    evidenceHash,
    generatedAt: input.generatedAt.toISOString(),
    latestAttestation,
    rows,
    summary,
    summaryDelta,
    workspace
  };
}

export function createWorkspaceAccessReview(input: {
  auditLogs: WorkspaceAccessReviewAuditLogRecord[];
  attestationAuditLogs?: WorkspaceAccessReviewAuditLogRecord[];
  generatedAt: Date;
  invitations: WorkspaceAccessReviewInvitationRecord[];
  memberships: WorkspaceAccessReviewMembershipRecord[];
  now?: Date;
  owner: WorkspaceAccessReviewOwnerRecord;
  roleEscalationRequests: WorkspaceAccessReviewRoleEscalationRecord[];
  workspace: WorkspaceAccessReviewWorkspaceRecord;
}): StudioWorkspaceAccessReviewResponse {
  const snapshot = createWorkspaceAccessReviewSnapshot({
    ...input,
    attestationAuditLogs: input.attestationAuditLogs ?? input.auditLogs,
    now: input.now ?? input.generatedAt
  });

  return studioWorkspaceAccessReviewResponseSchema.parse({
    report: snapshot
  });
}

export function createWorkspaceAccessReviewVerification(input: {
  auditLogs: WorkspaceAccessReviewAuditLogRecord[];
  attestationAuditLogs?: WorkspaceAccessReviewAuditLogRecord[];
  generatedAt: Date;
  invitations: WorkspaceAccessReviewInvitationRecord[];
  memberships: WorkspaceAccessReviewMembershipRecord[];
  now?: Date;
  owner: WorkspaceAccessReviewOwnerRecord;
  roleEscalationRequests: WorkspaceAccessReviewRoleEscalationRecord[];
  workspace: WorkspaceAccessReviewWorkspaceRecord;
}): StudioWorkspaceAccessReviewVerification {
  const snapshot = createWorkspaceAccessReviewSnapshot({
    ...input,
    attestationAuditLogs: input.attestationAuditLogs ?? input.auditLogs,
    now: input.now ?? input.generatedAt
  });

  return studioWorkspaceAccessReviewVerificationSchema.parse({
    attestationStatus: snapshot.attestationStatus,
    currentEvidenceHash: snapshot.evidenceHash,
    generatedAt: snapshot.generatedAt,
    latestAttestation: snapshot.latestAttestation,
    summaryDelta: snapshot.summaryDelta
  });
}
