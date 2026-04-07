import { z } from "zod";

export const opsAlertStateStatusSchema = z.enum(["active", "resolved"]);

export const opsAlertStateSummarySchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedByUserId: z.string().min(1).nullable(),
  code: z.string().min(1),
  firstObservedAt: z.string().datetime(),
  id: z.string().min(1),
  lastDeliveredAt: z.string().datetime().nullable(),
  lastObservedAt: z.string().datetime(),
  message: z.string().min(1),
  severity: z.enum(["critical", "warning"]),
  status: opsAlertStateStatusSchema,
  title: z.string().min(1)
});

export const opsAlertAcknowledgeResponseSchema = z.object({
  alert: opsAlertStateSummarySchema
});

export const opsErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1)
  })
});

export type OpsAlertStateSummary = z.infer<typeof opsAlertStateSummarySchema>;
export type OpsAlertAcknowledgeResponse = z.infer<
  typeof opsAlertAcknowledgeResponseSchema
>;
export type OpsErrorResponse = z.infer<typeof opsErrorResponseSchema>;
