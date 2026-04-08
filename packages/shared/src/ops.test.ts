import { describe, expect, it } from "vitest";

import {
  createOpsAlertScheduleDayMask,
  evaluateOpsAlertEscalationPolicy,
  evaluateOpsAlertSchedulePolicy,
  formatOpsAlertScheduleMinuteOfDay,
  isValidOpsAlertScheduleTimeZone,
  opsAlertEscalationPolicyRequestSchema,
  opsAlertSchedulePolicyRequestSchema,
  parseOpsAlertScheduleDayMask
} from "./ops.js";

describe("ops shared contracts", () => {
  it("validates delivery schedule requests", () => {
    const result = opsAlertSchedulePolicyRequestSchema.parse({
      activeDays: ["mon", "tue", "wed", "thu", "fri"],
      endMinuteOfDay: 1020,
      startMinuteOfDay: 540,
      timezone: "America/New_York"
    });

    expect(result.timezone).toBe("America/New_York");
  });

  it("validates escalation policy requests", () => {
    const result = opsAlertEscalationPolicyRequestSchema.parse({
      firstReminderDelayMinutes: 60,
      repeatReminderIntervalMinutes: 180
    });

    expect(result.repeatReminderIntervalMinutes).toBe(180);
  });

  it("rejects invalid timezones for delivery schedule policies", () => {
    expect(isValidOpsAlertScheduleTimeZone("Mars/Olympus")).toBe(false);
  });

  it("round-trips schedule day masks", () => {
    const activeDaysMask = createOpsAlertScheduleDayMask([
      "mon",
      "wed",
      "fri"
    ]);

    expect(parseOpsAlertScheduleDayMask(activeDaysMask)).toEqual([
      "mon",
      "wed",
      "fri"
    ]);
  });

  it("evaluates same-day schedule windows in the configured timezone", () => {
    const result = evaluateOpsAlertSchedulePolicy({
      activeDays: ["mon", "tue", "wed", "thu", "fri"],
      endMinuteOfDay: 1020,
      referenceTime: new Date("2026-04-06T13:30:00.000Z"),
      startMinuteOfDay: 540,
      timezone: "America/New_York"
    });

    expect(result).toMatchObject({
      active: true,
      localDay: "mon",
      localMinuteOfDay: 570
    });
  });

  it("evaluates overnight schedule windows across local day boundaries", () => {
    const result = evaluateOpsAlertSchedulePolicy({
      activeDays: ["mon", "tue", "wed", "thu", "fri"],
      endMinuteOfDay: 360,
      referenceTime: new Date("2026-04-07T07:00:00.000Z"),
      startMinuteOfDay: 1320,
      timezone: "America/New_York"
    });

    expect(result).toMatchObject({
      active: true,
      localDay: "tue",
      localMinuteOfDay: 180
    });
  });

  it("formats minute-of-day values for operator display", () => {
    expect(formatOpsAlertScheduleMinuteOfDay(0)).toBe("00:00");
    expect(formatOpsAlertScheduleMinuteOfDay(1020)).toBe("17:00");
    expect(formatOpsAlertScheduleMinuteOfDay(1440)).toBe("24:00");
  });

  it("evaluates the first escalation reminder from the first webhook delivery", () => {
    const result = evaluateOpsAlertEscalationPolicy({
      acknowledgedAt: null,
      firstReminderDelayMinutes: 60,
      firstWebhookDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      lastWebhookDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      referenceTime: new Date("2026-04-07T10:00:00.000Z"),
      repeatReminderIntervalMinutes: 180
    });

    expect(result).toMatchObject({
      active: true,
      reason: "first_reminder"
    });
    expect(result.nextReminderAt?.toISOString()).toBe(
      "2026-04-07T10:00:00.000Z"
    );
  });

  it("suppresses escalation reminders for acknowledged alerts", () => {
    const result = evaluateOpsAlertEscalationPolicy({
      acknowledgedAt: new Date("2026-04-07T09:30:00.000Z"),
      firstReminderDelayMinutes: 60,
      firstWebhookDeliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      lastWebhookDeliveredAt: new Date("2026-04-07T11:00:00.000Z"),
      referenceTime: new Date("2026-04-07T14:00:00.000Z"),
      repeatReminderIntervalMinutes: 120
    });

    expect(result).toEqual({
      active: false,
      nextReminderAt: null,
      reason: "acknowledged"
    });
  });
});
