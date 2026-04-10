import { z } from "zod";

import { evmAddressSchema } from "./onchain.js";

const commerceBrandNameSchema = z.string().trim().min(1).max(120);
const commerceBrandSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const commerceCollectionSlugSchema = commerceBrandSlugSchema;
const commerceCollectionTitleSchema = z.string().trim().min(1).max(120);
const commercePriceLabelSchema = z.string().trim().max(60);

export const commerceCheckoutProviderModeSchema = z.enum([
  "disabled",
  "manual",
  "stripe"
]);

export const commerceCheckoutProviderKindSchema = z.enum([
  "manual",
  "stripe"
]);

export const commerceCheckoutAvailabilityReasonSchema = z.enum([
  "provider_disabled",
  "collection_not_live",
  "no_available_editions",
  "pricing_incomplete"
]);

export const commerceBuyerDisplayNameSchema = z.string().trim().min(1).max(120);
export const commerceBuyerEmailSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .email();
export const commerceBuyerWalletAddressSchema = evmAddressSchema;

export const commerceReservationStatusSchema = z.enum([
  "pending",
  "completed",
  "expired",
  "canceled"
]);

export const commerceCheckoutSessionStatusSchema = z.enum([
  "open",
  "completed",
  "expired",
  "canceled"
]);

export const collectionCommerceAvailabilitySchema = z.object({
  activeReservationCount: z.number().int().min(0),
  availableEditionCount: z.number().int().min(0),
  checkoutEnabled: z.boolean(),
  checkoutAvailabilityReason:
    commerceCheckoutAvailabilityReasonSchema.nullable(),
  nextAvailableEditionNumber: z.number().int().positive().nullable(),
  providerMode: commerceCheckoutProviderModeSchema,
  reservationTtlSeconds: z.number().int().positive()
});

export const collectionCheckoutCreateRequestSchema = z.object({
  buyerDisplayName: commerceBuyerDisplayNameSchema.nullish(),
  buyerEmail: commerceBuyerEmailSchema,
  buyerWalletAddress: commerceBuyerWalletAddressSchema.nullish()
});

export const collectionCheckoutReservationSummarySchema = z.object({
  buyerDisplayName: commerceBuyerDisplayNameSchema.nullable(),
  buyerEmail: commerceBuyerEmailSchema,
  buyerWalletAddress: commerceBuyerWalletAddressSchema.nullable(),
  completedAt: z.string().datetime().nullable(),
  editionNumber: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  reservationId: z.string().min(1),
  status: commerceReservationStatusSchema
});

export const collectionCheckoutSessionSummarySchema = z.object({
  brandName: commerceBrandNameSchema,
  brandSlug: commerceBrandSlugSchema,
  checkoutSessionId: z.string().min(1),
  checkoutUrl: z.string().min(1),
  collectionSlug: commerceCollectionSlugSchema,
  completedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
  providerSessionId: z.string().min(1).nullable(),
  priceLabel: commercePriceLabelSchema.nullable(),
  providerKind: commerceCheckoutProviderKindSchema,
  reservation: collectionCheckoutReservationSummarySchema,
  status: commerceCheckoutSessionStatusSchema,
  title: commerceCollectionTitleSchema
});

export const collectionCheckoutSessionResponseSchema = z.object({
  checkout: collectionCheckoutSessionSummarySchema
});

export const collectionCommerceErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "CHECKOUT_CONFIGURATION_REQUIRED",
      "CHECKOUT_DISABLED",
      "CHECKOUT_SESSION_EXPIRED",
      "CHECKOUT_SESSION_NOT_FOUND",
      "CHECKOUT_SESSION_NOT_OPEN",
      "COLLECTION_NOT_FOUND",
      "COLLECTION_NOT_LIVE",
      "INVALID_REQUEST",
      "RESERVATION_NOT_AVAILABLE",
      "UNSUPPORTED_CHECKOUT_PROVIDER",
      "INTERNAL_SERVER_ERROR"
    ]),
    message: z.string().min(1)
  })
});

export type CollectionCommerceAvailability = z.infer<
  typeof collectionCommerceAvailabilitySchema
>;
export type CollectionCheckoutCreateRequest = z.infer<
  typeof collectionCheckoutCreateRequestSchema
>;
export type CollectionCheckoutReservationSummary = z.infer<
  typeof collectionCheckoutReservationSummarySchema
>;
export type CollectionCheckoutSessionStatus = z.infer<
  typeof commerceCheckoutSessionStatusSchema
>;
export type CollectionCheckoutSessionSummary = z.infer<
  typeof collectionCheckoutSessionSummarySchema
>;
export type CollectionCheckoutSessionResponse = z.infer<
  typeof collectionCheckoutSessionResponseSchema
>;
export type CollectionCommerceErrorResponse = z.infer<
  typeof collectionCommerceErrorResponseSchema
>;
export type CommerceCheckoutProviderMode = z.infer<
  typeof commerceCheckoutProviderModeSchema
>;
export type CommerceCheckoutProviderKind = z.infer<
  typeof commerceCheckoutProviderKindSchema
>;
export type CommerceCheckoutAvailabilityReason = z.infer<
  typeof commerceCheckoutAvailabilityReasonSchema
>;
export type CommerceReservationStatus = z.infer<
  typeof commerceReservationStatusSchema
>;
