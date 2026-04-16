import { z } from "zod";

import {
  optionalTrimmedStringSchema,
  optionalUrlSchema
} from "./optional-environment-value.js";

export const commerceEnvSchema = z
  .object({
    COMMERCE_CHECKOUT_PROVIDER_MODE: z
      .enum(["disabled", "manual", "stripe"])
      .default("manual"),
    COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN: optionalTrimmedStringSchema,
    COMMERCE_FULFILLMENT_CALLBACK_BASE_URL: optionalUrlSchema,
    COMMERCE_FULFILLMENT_PROVIDER_MODE: z
      .enum(["manual", "webhook"])
      .default("manual"),
    COMMERCE_FULFILLMENT_WEBHOOK_BEARER_TOKEN: optionalTrimmedStringSchema,
    COMMERCE_FULFILLMENT_WEBHOOK_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(30000)
      .default(5000),
    COMMERCE_FULFILLMENT_WEBHOOK_URL: optionalUrlSchema,
    COMMERCE_STRIPE_PUBLISHABLE_KEY: optionalTrimmedStringSchema,
    COMMERCE_STRIPE_SECRET_KEY: optionalTrimmedStringSchema,
    COMMERCE_STRIPE_WEBHOOK_SECRET: optionalTrimmedStringSchema,
    COMMERCE_RESERVATION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(86400)
      .default(900)
  })
  .superRefine((value, context) => {
    if (value.COMMERCE_CHECKOUT_PROVIDER_MODE === "stripe") {
      if (!value.COMMERCE_STRIPE_PUBLISHABLE_KEY) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "COMMERCE_STRIPE_PUBLISHABLE_KEY is required when COMMERCE_CHECKOUT_PROVIDER_MODE=stripe.",
          path: ["COMMERCE_STRIPE_PUBLISHABLE_KEY"]
        });
      }

      if (!value.COMMERCE_STRIPE_SECRET_KEY) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "COMMERCE_STRIPE_SECRET_KEY is required when COMMERCE_CHECKOUT_PROVIDER_MODE=stripe.",
          path: ["COMMERCE_STRIPE_SECRET_KEY"]
        });
      }

      if (!value.COMMERCE_STRIPE_WEBHOOK_SECRET) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "COMMERCE_STRIPE_WEBHOOK_SECRET is required when COMMERCE_CHECKOUT_PROVIDER_MODE=stripe.",
          path: ["COMMERCE_STRIPE_WEBHOOK_SECRET"]
        });
      }
    }

    if (value.COMMERCE_FULFILLMENT_PROVIDER_MODE !== "webhook") {
      return;
    }

    if (!value.COMMERCE_FULFILLMENT_WEBHOOK_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "COMMERCE_FULFILLMENT_WEBHOOK_URL is required when COMMERCE_FULFILLMENT_PROVIDER_MODE=webhook.",
        path: ["COMMERCE_FULFILLMENT_WEBHOOK_URL"]
      });
    }

    if (!value.COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN is required when COMMERCE_FULFILLMENT_PROVIDER_MODE=webhook.",
        path: ["COMMERCE_FULFILLMENT_CALLBACK_BEARER_TOKEN"]
      });
    }

    if (!value.COMMERCE_FULFILLMENT_CALLBACK_BASE_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "COMMERCE_FULFILLMENT_CALLBACK_BASE_URL is required when COMMERCE_FULFILLMENT_PROVIDER_MODE=webhook.",
        path: ["COMMERCE_FULFILLMENT_CALLBACK_BASE_URL"]
      });
    }
  });

export type CommerceEnv = z.infer<typeof commerceEnvSchema>;

export function parseCommerceEnv(
  rawEnvironment: NodeJS.ProcessEnv
): CommerceEnv {
  return commerceEnvSchema.parse(rawEnvironment);
}
