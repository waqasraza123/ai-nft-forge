import { z } from "zod";

export const commerceEnvSchema = z.object({
  COMMERCE_CHECKOUT_PROVIDER_MODE: z
    .enum(["disabled", "manual", "stripe"])
    .default("manual"),
  COMMERCE_STRIPE_PUBLISHABLE_KEY: z.string().trim().min(1).optional(),
  COMMERCE_STRIPE_SECRET_KEY: z.string().trim().min(1).optional(),
  COMMERCE_STRIPE_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  COMMERCE_RESERVATION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(86400)
    .default(900)
}).superRefine((value, context) => {
  if (value.COMMERCE_CHECKOUT_PROVIDER_MODE !== "stripe") {
    return;
  }

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
});

export type CommerceEnv = z.infer<typeof commerceEnvSchema>;

export function parseCommerceEnv(
  rawEnvironment: NodeJS.ProcessEnv
): CommerceEnv {
  return commerceEnvSchema.parse(rawEnvironment);
}
