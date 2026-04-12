import { z } from "zod";

import {
  studioWorkspaceDirectoryEntrySchema,
  studioWorkspaceScopeSummarySchema
} from "./studio-settings.js";
import { opsAlertSeveritySchema } from "./ops.js";

const fleetWorkspaceCommerceSummarySchema = z.object({
  automationFailedCheckoutCount: z.number().int().min(0),
  completedCheckoutCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  totalCheckoutCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0)
});

const fleetWorkspaceOpsSummarySchema = z.object({
  activeAlertCount: z.number().int().min(0),
  criticalAlertCount: z.number().int().min(0),
  openReconciliationIssueCount: z.number().int().min(0),
  warningAlertCount: z.number().int().min(0)
});

const fleetWorkspacePublicationSummarySchema = z.object({
  livePublicationCount: z.number().int().min(0),
  totalPublicationCount: z.number().int().min(0)
});

export const workspaceFleetWorkspaceSummarySchema = z.object({
  commerce: fleetWorkspaceCommerceSummarySchema,
  directory: studioWorkspaceDirectoryEntrySchema,
  ops: fleetWorkspaceOpsSummarySchema,
  publications: fleetWorkspacePublicationSummarySchema,
  workspace: studioWorkspaceScopeSummarySchema
});

export const workspaceFleetAlertSummarySchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  alertStateId: z.string().min(1),
  code: z.string().min(1),
  firstObservedAt: z.string().datetime(),
  lastObservedAt: z.string().datetime(),
  message: z.string().min(1),
  severity: opsAlertSeveritySchema,
  title: z.string().min(1),
  workspace: studioWorkspaceScopeSummarySchema
});

export const workspaceFleetSummarySchema = z.object({
  activeAlertCount: z.number().int().min(0),
  activeWorkspaceCount: z.number().int().min(0),
  archivedWorkspaceCount: z.number().int().min(0),
  completedCheckoutCount: z.number().int().min(0),
  criticalAlertCount: z.number().int().min(0),
  generatedAt: z.string().datetime(),
  openCheckoutCount: z.number().int().min(0),
  openReconciliationIssueCount: z.number().int().min(0),
  totalCheckoutCount: z.number().int().min(0),
  totalWorkspaceCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0)
});

export const workspaceFleetOverviewResponseSchema = z.object({
  fleet: z.object({
    alertQueue: z.array(workspaceFleetAlertSummarySchema),
    summary: workspaceFleetSummarySchema,
    workspaces: z.array(workspaceFleetWorkspaceSummarySchema)
  })
});

export const workspaceFleetScopedActionRequestSchema = z.object({
  workspaceId: z.string().min(1)
});

export const workspaceCommerceFleetReportWorkspaceSchema = z.object({
  automationFailedCheckoutCount: z.number().int().min(0),
  brandCount: z.number().int().min(0),
  completedCheckoutCount: z.number().int().min(0),
  current: z.boolean(),
  lastActivityAt: z.string().datetime().nullable(),
  livePublicationCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0),
  workspace: studioWorkspaceScopeSummarySchema
});

export const workspaceCommerceFleetReportResponseSchema = z.object({
  report: z.object({
    generatedAt: z.string().datetime(),
    scopeLabel: z.string().trim().min(1).max(160),
    summary: workspaceFleetSummarySchema,
    workspaces: z.array(workspaceCommerceFleetReportWorkspaceSchema)
  })
});

export type WorkspaceFleetAlertSummary = z.infer<
  typeof workspaceFleetAlertSummarySchema
>;
export type WorkspaceFleetOverviewResponse = z.infer<
  typeof workspaceFleetOverviewResponseSchema
>;
export type WorkspaceFleetScopedActionRequest = z.infer<
  typeof workspaceFleetScopedActionRequestSchema
>;
export type WorkspaceFleetSummary = z.infer<typeof workspaceFleetSummarySchema>;
export type WorkspaceFleetWorkspaceSummary = z.infer<
  typeof workspaceFleetWorkspaceSummarySchema
>;
export type WorkspaceCommerceFleetReportResponse = z.infer<
  typeof workspaceCommerceFleetReportResponseSchema
>;
export type WorkspaceCommerceFleetReportWorkspace = z.infer<
  typeof workspaceCommerceFleetReportWorkspaceSchema
>;
