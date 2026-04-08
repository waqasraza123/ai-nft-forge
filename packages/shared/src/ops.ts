import { z } from "zod";

export const opsAlertSeveritySchema = z.enum(["critical", "warning"]);
export const opsAlertStateStatusSchema = z.enum(["active", "resolved"]);
export const opsAlertRoutingWebhookModeSchema = z.enum([
  "all",
  "critical_only",
  "disabled"
]);
const opsAlertEscalationDelayMinutesSchema = z.number().int().min(1).max(10080);
export const opsAlertScheduleDayValues = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat"
] as const;
export const opsAlertScheduleDaySchema = z.enum(opsAlertScheduleDayValues);

const opsAlertScheduleDayBitByValue = {
  sun: 1 << 0,
  mon: 1 << 1,
  tue: 1 << 2,
  wed: 1 << 3,
  thu: 1 << 4,
  fri: 1 << 5,
  sat: 1 << 6
} as const;

const opsAlertScheduleTimeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isValidOpsAlertScheduleTimeZone, {
    message: "Expected a valid IANA timezone."
  });

const opsAlertScheduleMinuteOfDaySchema = z.number().int().min(0).max(1439);
const opsAlertScheduleEndMinuteOfDaySchema = z.number().int().min(1).max(1440);

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
  severity: opsAlertSeveritySchema,
  status: opsAlertStateStatusSchema,
  title: z.string().min(1)
});

export const opsAlertRoutingPolicySummarySchema = z.object({
  id: z.string().min(1).nullable(),
  source: z.enum(["default", "owner_override"]),
  updatedAt: z.string().datetime().nullable(),
  webhookMode: opsAlertRoutingWebhookModeSchema
});

export const opsAlertEscalationPolicySummarySchema = z.object({
  firstReminderDelayMinutes: opsAlertEscalationDelayMinutesSchema.nullable(),
  id: z.string().min(1).nullable(),
  repeatReminderIntervalMinutes: opsAlertEscalationDelayMinutesSchema.nullable(),
  source: z.enum(["default", "owner_override"]),
  updatedAt: z.string().datetime().nullable()
});

export const opsAlertSchedulePolicySummarySchema = z.object({
  activeDays: z.array(opsAlertScheduleDaySchema),
  endMinuteOfDay: z.number().int().min(1).max(1440).nullable(),
  id: z.string().min(1).nullable(),
  source: z.enum(["default", "owner_override"]),
  startMinuteOfDay: z.number().int().min(0).max(1439).nullable(),
  timezone: z.string().min(1).max(100).nullable(),
  updatedAt: z.string().datetime().nullable()
});

export const opsAlertMuteRequestSchema = z.object({
  durationHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
});

export const opsAlertRoutingPolicyRequestSchema = z.object({
  webhookMode: opsAlertRoutingWebhookModeSchema
});

export const opsAlertEscalationPolicyRequestSchema = z.object({
  firstReminderDelayMinutes: opsAlertEscalationDelayMinutesSchema,
  repeatReminderIntervalMinutes: opsAlertEscalationDelayMinutesSchema
});

export const opsAlertSchedulePolicyRequestSchema = z
  .object({
    activeDays: z
      .array(opsAlertScheduleDaySchema)
      .min(1)
      .max(7)
      .refine(
        (activeDays) => new Set(activeDays).size === activeDays.length,
        "Expected unique schedule days."
      ),
    endMinuteOfDay: opsAlertScheduleEndMinuteOfDaySchema,
    startMinuteOfDay: opsAlertScheduleMinuteOfDaySchema,
    timezone: opsAlertScheduleTimeZoneSchema
  })
  .refine(
    (value) => value.startMinuteOfDay !== value.endMinuteOfDay,
    "Expected a non-empty delivery window."
  );

export const opsAlertAcknowledgeResponseSchema = z.object({
  alert: opsAlertStateSummarySchema
});

export const opsAlertRoutingPolicyResponseSchema = z.object({
  policy: opsAlertRoutingPolicySummarySchema
});

export const opsAlertEscalationPolicyResponseSchema = z.object({
  policy: opsAlertEscalationPolicySummarySchema
});

export const opsAlertSchedulePolicyResponseSchema = z.object({
  policy: opsAlertSchedulePolicySummarySchema
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
export type OpsAlertScheduleDay = z.infer<typeof opsAlertScheduleDaySchema>;
export type OpsAlertSchedulePolicySummary = z.infer<
  typeof opsAlertSchedulePolicySummarySchema
>;
export type OpsAlertEscalationPolicySummary = z.infer<
  typeof opsAlertEscalationPolicySummarySchema
>;
export type OpsAlertRoutingPolicySummary = z.infer<
  typeof opsAlertRoutingPolicySummarySchema
>;
export type OpsAlertStateSummary = z.infer<typeof opsAlertStateSummarySchema>;
export type OpsAlertAcknowledgeResponse = z.infer<
  typeof opsAlertAcknowledgeResponseSchema
>;
export type OpsAlertMuteRequest = z.infer<typeof opsAlertMuteRequestSchema>;
export type OpsAlertSchedulePolicyRequest = z.infer<
  typeof opsAlertSchedulePolicyRequestSchema
>;
export type OpsAlertEscalationPolicyRequest = z.infer<
  typeof opsAlertEscalationPolicyRequestSchema
>;
export type OpsAlertSchedulePolicyResponse = z.infer<
  typeof opsAlertSchedulePolicyResponseSchema
>;
export type OpsAlertEscalationPolicyResponse = z.infer<
  typeof opsAlertEscalationPolicyResponseSchema
>;
export type OpsAlertRoutingPolicyRequest = z.infer<
  typeof opsAlertRoutingPolicyRequestSchema
>;
export type OpsAlertRoutingPolicyResponse = z.infer<
  typeof opsAlertRoutingPolicyResponseSchema
>;
export type OpsAlertMuteResponse = z.infer<typeof opsAlertMuteResponseSchema>;
export type OpsAlertUnmuteResponse = z.infer<
  typeof opsAlertUnmuteResponseSchema
>;
export type OpsErrorResponse = z.infer<typeof opsErrorResponseSchema>;

export function isValidOpsAlertScheduleTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone
    }).format(new Date());

    return true;
  } catch {
    return false;
  }
}

export function createOpsAlertScheduleDayMask(activeDays: OpsAlertScheduleDay[]) {
  return [...new Set(activeDays)].reduce(
    (mask, activeDay) => mask | opsAlertScheduleDayBitByValue[activeDay],
    0
  );
}

export function parseOpsAlertScheduleDayMask(activeDaysMask: number) {
  return opsAlertScheduleDayValues.filter(
    (activeDay) =>
      (activeDaysMask & opsAlertScheduleDayBitByValue[activeDay]) !== 0
  );
}

function getOpsAlertScheduleWeekdayFormatter(timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
    weekday: "short"
  });
}

function parseLocalWeekdayLabel(label: string): OpsAlertScheduleDay {
  switch (label) {
    case "Sun":
      return "sun";
    case "Mon":
      return "mon";
    case "Tue":
      return "tue";
    case "Wed":
      return "wed";
    case "Thu":
      return "thu";
    case "Fri":
      return "fri";
    case "Sat":
      return "sat";
    default:
      throw new Error("Unexpected localized weekday label.");
  }
}

export function formatOpsAlertScheduleMinuteOfDay(minuteOfDay: number) {
  const normalizedMinuteOfDay = Math.max(0, Math.min(1440, minuteOfDay));

  if (normalizedMinuteOfDay === 1440) {
    return "24:00";
  }

  const hours = Math.floor(normalizedMinuteOfDay / 60);
  const minutes = normalizedMinuteOfDay % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function formatOpsAlertScheduleLocalTime(input: {
  referenceTime: Date;
  timezone: string;
}) {
  return getOpsAlertScheduleWeekdayFormatter(input.timezone).format(
    input.referenceTime
  );
}

export function evaluateOpsAlertSchedulePolicy(input: {
  activeDays: OpsAlertScheduleDay[];
  endMinuteOfDay: number;
  referenceTime: Date;
  startMinuteOfDay: number;
  timezone: string;
}) {
  const parts = getOpsAlertScheduleWeekdayFormatter(input.timezone)
    .formatToParts(input.referenceTime)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    }, {});
  const localDay = parseLocalWeekdayLabel(parts.weekday ?? "");
  const localMinuteOfDay =
    Number(parts.hour ?? "0") * 60 + Number(parts.minute ?? "0");
  const activeDays = new Set(input.activeDays);
  const currentDayIndex = opsAlertScheduleDayValues.indexOf(localDay);
  const previousDay =
    opsAlertScheduleDayValues[
      (currentDayIndex + opsAlertScheduleDayValues.length - 1) %
        opsAlertScheduleDayValues.length
    ] ?? "sat";
  const active =
    input.startMinuteOfDay < input.endMinuteOfDay
      ? activeDays.has(localDay) &&
        localMinuteOfDay >= input.startMinuteOfDay &&
        localMinuteOfDay < input.endMinuteOfDay
      : (activeDays.has(localDay) &&
          localMinuteOfDay >= input.startMinuteOfDay) ||
        (activeDays.has(previousDay) &&
          localMinuteOfDay < input.endMinuteOfDay);

  return {
    active,
    localDay,
    localMinuteOfDay
  };
}

export function evaluateOpsAlertEscalationPolicy(input: {
  acknowledgedAt: Date | null;
  firstReminderDelayMinutes: number;
  firstWebhookDeliveredAt: Date;
  lastWebhookDeliveredAt: Date;
  referenceTime: Date;
  repeatReminderIntervalMinutes: number;
}) {
  if (input.acknowledgedAt !== null) {
    return {
      active: false,
      nextReminderAt: null,
      reason: "acknowledged"
    } as const;
  }

  const nextReminderAt =
    input.firstWebhookDeliveredAt.getTime() ===
    input.lastWebhookDeliveredAt.getTime()
      ? new Date(
          input.firstWebhookDeliveredAt.getTime() +
            input.firstReminderDelayMinutes * 60 * 1000
        )
      : new Date(
          input.lastWebhookDeliveredAt.getTime() +
            input.repeatReminderIntervalMinutes * 60 * 1000
        );

  return {
    active: input.referenceTime.getTime() >= nextReminderAt.getTime(),
    nextReminderAt,
    reason:
      input.firstWebhookDeliveredAt.getTime() ===
      input.lastWebhookDeliveredAt.getTime()
        ? "first_reminder"
        : "repeat_reminder"
  } as const;
}
