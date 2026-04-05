import { z } from "zod";

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");

export const nonceValueSchema = z.string().trim().min(16).max(256);

export const signatureSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]+$/, "Invalid signature format");

export const authNonceRequestSchema = z.object({
  walletAddress: walletAddressSchema
});

export const authNonceResponseSchema = z.object({
  expiresAt: z.string().datetime(),
  message: z.string().min(1),
  nonce: nonceValueSchema,
  walletAddress: walletAddressSchema
});

export const authVerifyRequestSchema = z.object({
  avatarUrl: z.string().url().optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  nonce: nonceValueSchema,
  signature: signatureSchema,
  walletAddress: walletAddressSchema
});

export const authSessionCookieSameSite = "lax" as const;

export const authSessionResponseSchema = z.object({
  authenticated: z.boolean(),
  session: z
    .object({
      expiresAt: z.string().datetime(),
      user: z.object({
        avatarUrl: z.string().url().nullable(),
        displayName: z.string().nullable(),
        id: z.string().min(1),
        walletAddress: walletAddressSchema
      })
    })
    .nullable()
});

export const authErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1)
  })
});

export type AuthNonceRequest = z.infer<typeof authNonceRequestSchema>;
export type AuthNonceResponse = z.infer<typeof authNonceResponseSchema>;
export type AuthVerifyRequest = z.infer<typeof authVerifyRequestSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;
