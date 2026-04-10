import { z } from "zod";

export const commerceEnvSchema = z.object({
  COMMERCE_CHECKOUT_PROVIDER_MODE: z
    .enum(["disabled", "manual"])
    .default("manual"),
  COMMERCE_RESERVATION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .max(86400)
    .default(900)
});

export type CommerceEnv = z.infer<typeof commerceEnvSchema>;

export function parseCommerceEnv(
  rawEnvironment: NodeJS.ProcessEnv
): CommerceEnv {
  return commerceEnvSchema.parse(rawEnvironment);
}
