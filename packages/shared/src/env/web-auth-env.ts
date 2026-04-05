import { z } from "zod";

export const webAuthEnvSchema = z.object({
  AUTH_MESSAGE_STATEMENT: z
    .string()
    .trim()
    .min(1)
    .default("Sign in to AI NFT Forge"),
  AUTH_NONCE_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .max(60)
    .default(10),
  AUTH_SESSION_COOKIE_NAME: z
    .string()
    .trim()
    .min(1)
    .default("ai_nft_forge_session"),
  AUTH_SESSION_TTL_DAYS: z.coerce.number().int().positive().max(90).default(30)
});

export type WebAuthEnv = z.infer<typeof webAuthEnvSchema>;

export function parseWebAuthEnv(rawEnvironment: NodeJS.ProcessEnv): WebAuthEnv {
  return webAuthEnvSchema.parse(rawEnvironment);
}
