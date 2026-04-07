import { z } from "zod";

export const opsAlertStateStatusSchema = z.enum(["active", "resolved"]);

export const opsAlertMuteSummarySchema = z.object({
  code: z.string().min(1),
  id: z.string().min(1),
  mutedUntil: z.string().datetime()
});

export const opsAlertStateSummarySchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedByUserId: z.string().min(1).nullable(),
  code: z.string().min(1),
  firstObservedAt: z.string().datetime(),
  id: z.string().min(1),
  lastDeliveredAt: z.string().datetime().nullable(),
  lastObservedAt: z.string().datetime(),
  message: z.string().min(1),
  mutedUntil: z.string().datetime().nullable(),
  severity: z.enum(["critical", "warning"]),
  status: opsAlertStateStatusSchema,
  title: z.string().min(1)
});

export const opsAlertMuteRequestSchema = z.object({
  durationHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
});

export const opsAlertAcknowledgeResponseSchema = z.object({
  alert: opsAlertStateSummarySchema
});

export const opsAlertMuteResponseSchema = z.object({
  alert: opsAlertStateSummarySchema,
  mute: opsAlertMuteSummarySchema
});

export const opsAlertUnmuteResponseSchema = z.object({
  code: z.string().min(1),
  removed: z.boolean()
});

export const opsErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1)
  })
});

export type OpsAlertMuteSummary = z.infer<typeof opsAlertMuteSummarySchema>;
export type OpsAlertStateSummary = z.infer<typeof opsAlertStateSummarySchema>;
export type OpsAlertAcknowledgeResponse = z.infer<
  typeof opsAlertAcknowledgeResponseSchema
>;
export type OpsAlertMuteRequest = z.infer<typeof opsAlertMuteRequestSchema>;
export type OpsAlertMuteResponse = z.infer<typeof opsAlertMuteResponseSchema>;
export type OpsAlertUnmuteResponse = z.infer<
  typeof opsAlertUnmuteResponseSchema
>;
export type OpsErrorResponse = z.infer<typeof opsErrorResponseSchema>;
