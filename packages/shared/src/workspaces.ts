import { z } from "zod";

import {
  opsAlertSeveritySchema,
  opsReconciliationIssueKindSchema,
  opsReconciliationIssueSeveritySchema
} from "./ops.js";
import {
  studioBrandSummarySchema,
  studioWorkspaceAuditEntrySchema,
  studioWorkspaceDirectoryEntrySchema,
  studioWorkspaceInvitationSummarySchema,
  studioWorkspaceMemberSummarySchema,
  studioWorkspaceRoleEscalationSummarySchema,
  studioWorkspaceScopeSummarySchema,
  studioWorkspaceSummarySchema
} from "./studio-settings.js";

export const workspaceExportFormatSchema = z.enum(["json", "csv"]);

export const workspaceOffboardingBlockerCodeSchema = z.enum([
  "active_alerts",
  "open_checkouts",
  "open_reconciliation_issues"
]);

export const workspaceOffboardingCautionCodeSchema = z.enum([
  "live_publications",
  "pending_invitations",
  "pending_role_escalations",
  "unfulfilled_checkouts"
]);

export const workspaceOffboardingReadinessSchema = z.enum([
  "blocked",
  "review_required",
  "ready"
]);

export const workspaceOffboardingSummarySchema = z.object({
  activeAlertCount: z.number().int().min(0),
  blockerCodes: z.array(workspaceOffboardingBlockerCodeSchema),
  cautionCodes: z.array(workspaceOffboardingCautionCodeSchema),
  livePublicationCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  openReconciliationIssueCount: z.number().int().min(0),
  pendingInvitationCount: z.number().int().min(0),
  pendingRoleEscalationCount: z.number().int().min(0),
  readiness: workspaceOffboardingReadinessSchema,
  unfulfilledCheckoutCount: z.number().int().min(0)
});

export const workspaceOffboardingEntrySchema = z.object({
  current: z.boolean(),
  directory: studioWorkspaceDirectoryEntrySchema,
  summary: workspaceOffboardingSummarySchema,
  workspace: studioWorkspaceScopeSummarySchema
});

export const workspaceOffboardingOverviewResponseSchema = z.object({
  overview: z.object({
    generatedAt: z.string().datetime(),
    summary: z.object({
      blockedWorkspaceCount: z.number().int().min(0),
      readyWorkspaceCount: z.number().int().min(0),
      reviewRequiredWorkspaceCount: z.number().int().min(0),
      totalWorkspaceCount: z.number().int().min(0)
    }),
    workspaces: z.array(workspaceOffboardingEntrySchema)
  })
});

export const workspaceExportPublicationSchema = z.object({
  brandSlug: z.string().min(1),
  id: z.string().min(1),
  itemCount: z.number().int().min(0),
  mintedCount: z.number().int().min(0),
  publishedAt: z.string().datetime(),
  slug: z.string().min(1),
  storefrontStatus: z.enum(["ended", "live", "sold_out", "upcoming"]),
  title: z.string().min(1),
  updatedAt: z.string().datetime()
});

export const workspaceExportCheckoutSchema = z.object({
  checkoutUrl: z.string().url(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  fulfillmentAutomationStatus: z.enum([
    "completed",
    "failed",
    "idle",
    "processing",
    "queued",
    "submitted"
  ]),
  fulfillmentStatus: z.enum(["fulfilled", "unfulfilled"]),
  id: z.string().min(1),
  providerKind: z.enum(["manual", "stripe"]),
  publicId: z.string().min(1),
  publishedCollectionId: z.string().min(1),
  publishedCollectionTitle: z.string().min(1),
  status: z.enum(["canceled", "completed", "expired", "open"])
});

export const workspaceExportAlertSchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  code: z.string().min(1),
  firstObservedAt: z.string().datetime(),
  id: z.string().min(1),
  lastObservedAt: z.string().datetime(),
  message: z.string().min(1),
  severity: opsAlertSeveritySchema,
  title: z.string().min(1)
});

export const workspaceExportReconciliationIssueSchema = z.object({
  firstDetectedAt: z.string().datetime(),
  id: z.string().min(1),
  kind: opsReconciliationIssueKindSchema,
  lastDetectedAt: z.string().datetime(),
  message: z.string().min(1),
  severity: opsReconciliationIssueSeveritySchema,
  title: z.string().min(1)
});

export const workspaceExportResponseSchema = z.object({
  export: z.object({
    alerts: z.array(workspaceExportAlertSchema),
    auditEntries: z.array(studioWorkspaceAuditEntrySchema),
    brands: z.array(studioBrandSummarySchema),
    checkouts: z.array(workspaceExportCheckoutSchema),
    generatedAt: z.string().datetime(),
    invitations: z.array(studioWorkspaceInvitationSummarySchema),
    members: z.array(studioWorkspaceMemberSummarySchema),
    offboarding: workspaceOffboardingSummarySchema,
    ownerWalletAddress: z.string().min(1),
    publications: z.array(workspaceExportPublicationSchema),
    reconciliationIssues: z.array(workspaceExportReconciliationIssueSchema),
    roleEscalationRequests: z.array(studioWorkspaceRoleEscalationSummarySchema),
    workspace: studioWorkspaceSummarySchema
  })
});

export type WorkspaceExportFormat = z.infer<typeof workspaceExportFormatSchema>;
export type WorkspaceOffboardingBlockerCode = z.infer<
  typeof workspaceOffboardingBlockerCodeSchema
>;
export type WorkspaceOffboardingCautionCode = z.infer<
  typeof workspaceOffboardingCautionCodeSchema
>;
export type WorkspaceOffboardingReadiness = z.infer<
  typeof workspaceOffboardingReadinessSchema
>;
export type WorkspaceOffboardingSummary = z.infer<
  typeof workspaceOffboardingSummarySchema
>;
export type WorkspaceOffboardingEntry = z.infer<
  typeof workspaceOffboardingEntrySchema
>;
export type WorkspaceOffboardingOverviewResponse = z.infer<
  typeof workspaceOffboardingOverviewResponseSchema
>;
export type WorkspaceExportPublication = z.infer<
  typeof workspaceExportPublicationSchema
>;
export type WorkspaceExportCheckout = z.infer<
  typeof workspaceExportCheckoutSchema
>;
export type WorkspaceExportAlert = z.infer<typeof workspaceExportAlertSchema>;
export type WorkspaceExportReconciliationIssue = z.infer<
  typeof workspaceExportReconciliationIssueSchema
>;
export type WorkspaceExportResponse = z.infer<
  typeof workspaceExportResponseSchema
>;
