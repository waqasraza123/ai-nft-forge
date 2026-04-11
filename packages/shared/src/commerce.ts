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
const commerceFulfillmentNotesSchema = z.string().trim().max(1000);

export const commerceCheckoutProviderModeSchema = z.enum([
  "disabled",
  "manual",
  "stripe"
]);

export const commerceCheckoutProviderKindSchema = z.enum(["manual", "stripe"]);

export const commerceFulfillmentProviderKindSchema = z.enum([
  "manual",
  "webhook"
]);

export const commerceFulfillmentAutomationStatusSchema = z.enum([
  "idle",
  "queued",
  "processing",
  "submitted",
  "completed",
  "failed"
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

export const commerceCheckoutFulfillmentStatusSchema = z.enum([
  "unfulfilled",
  "fulfilled"
]);

export const commerceFulfillmentCallbackStatusSchema = z.enum([
  "fulfilled",
  "failed"
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

export const studioCommerceCheckoutSummarySchema = z.object({
  brandName: commerceBrandNameSchema,
  brandSlug: commerceBrandSlugSchema,
  buyerDisplayName: commerceBuyerDisplayNameSchema.nullable(),
  buyerEmail: commerceBuyerEmailSchema,
  buyerWalletAddress: commerceBuyerWalletAddressSchema.nullable(),
  checkoutSessionId: z.string().min(1),
  checkoutUrl: z.string().min(1),
  collectionPublicPath: z.string().min(1),
  collectionSlug: commerceCollectionSlugSchema,
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  editionNumber: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  fulfillmentAutomationAttemptCount: z.number().int().min(0),
  fulfillmentAutomationErrorCode: z.string().trim().min(1).nullable(),
  fulfillmentAutomationErrorMessage: z.string().trim().min(1).nullable(),
  fulfillmentAutomationExternalReference: z.string().trim().min(1).nullable(),
  fulfillmentAutomationLastAttemptedAt: z.string().datetime().nullable(),
  fulfillmentAutomationLastSucceededAt: z.string().datetime().nullable(),
  fulfillmentAutomationNextRetryAt: z.string().datetime().nullable(),
  fulfillmentAutomationQueuedAt: z.string().datetime().nullable(),
  fulfillmentAutomationStatus: commerceFulfillmentAutomationStatusSchema,
  fulfilledAt: z.string().datetime().nullable(),
  fulfillmentNotes: commerceFulfillmentNotesSchema.nullable(),
  fulfillmentProviderKind: commerceFulfillmentProviderKindSchema,
  fulfillmentStatus: commerceCheckoutFulfillmentStatusSchema,
  priceLabel: commercePriceLabelSchema.nullable(),
  providerKind: commerceCheckoutProviderKindSchema,
  providerSessionId: z.string().min(1).nullable(),
  reservationStatus: commerceReservationStatusSchema,
  status: commerceCheckoutSessionStatusSchema,
  storefrontStatus: z.enum(["upcoming", "live", "sold_out", "ended"]),
  title: commerceCollectionTitleSchema
});

export const studioCommerceCollectionSummarySchema = z.object({
  brandName: commerceBrandNameSchema,
  brandSlug: commerceBrandSlugSchema,
  collectionPublicPath: z.string().min(1),
  collectionSlug: commerceCollectionSlugSchema,
  completedCheckoutCount: z.number().int().min(0),
  fulfilledCheckoutCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  storefrontStatus: z.enum(["upcoming", "live", "sold_out", "ended"]),
  title: commerceCollectionTitleSchema,
  totalCheckoutCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0)
});

export const studioCommerceBrandSummarySchema = z.object({
  brandName: commerceBrandNameSchema,
  brandSlug: commerceBrandSlugSchema,
  completedCheckoutCount: z.number().int().min(0),
  fulfilledCheckoutCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  totalCheckoutCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0)
});

export const studioCommerceDashboardSummarySchema = z.object({
  automationFailedCheckoutCount: z.number().int().min(0),
  automationQueuedCheckoutCount: z.number().int().min(0),
  automationSubmittedCheckoutCount: z.number().int().min(0),
  canceledCheckoutCount: z.number().int().min(0),
  completedCheckoutCount: z.number().int().min(0),
  expiredCheckoutCount: z.number().int().min(0),
  fulfilledCheckoutCount: z.number().int().min(0),
  manualCheckoutCount: z.number().int().min(0),
  openCheckoutCount: z.number().int().min(0),
  stripeCheckoutCount: z.number().int().min(0),
  totalCheckoutCount: z.number().int().min(0),
  unfulfilledCheckoutCount: z.number().int().min(0)
});

export const studioCommerceDashboardQuerySchema = z.object({
  brandSlug: commerceBrandSlugSchema.nullish()
});

export const studioCommerceReportQuerySchema = z.object({
  brandSlug: commerceBrandSlugSchema.nullish()
});

export const studioCommerceDashboardResponseSchema = z.object({
  dashboard: z.object({
    activeBrandSlug: commerceBrandSlugSchema.nullable(),
    brands: z.array(studioCommerceBrandSummarySchema),
    checkouts: z.array(studioCommerceCheckoutSummarySchema),
    collections: z.array(studioCommerceCollectionSummarySchema),
    summary: studioCommerceDashboardSummarySchema
  })
});

export const studioCommerceReportMetricsSchema = z.object({
  checkoutCompletionRatePercent: z.number().min(0).max(100),
  fulfillmentCompletionRatePercent: z.number().min(0).max(100),
  latestCheckoutCompletedAt: z.string().datetime().nullable(),
  latestCheckoutCreatedAt: z.string().datetime().nullable(),
  latestCheckoutFulfilledAt: z.string().datetime().nullable()
});

export const studioCommerceReportResponseSchema = z.object({
  report: z.object({
    activeBrandSlug: commerceBrandSlugSchema.nullable(),
    brands: z.array(studioCommerceBrandSummarySchema),
    collections: z.array(studioCommerceCollectionSummarySchema),
    generatedAt: z.string().datetime(),
    metrics: studioCommerceReportMetricsSchema,
    scopeLabel: z.string().trim().min(1).max(160),
    summary: studioCommerceDashboardSummarySchema
  })
});

export const studioCommerceCheckoutActionResponseSchema = z.object({
  checkout: studioCommerceCheckoutSummarySchema
});

export const studioCommerceFulfillmentUpdateRequestSchema = z.object({
  fulfillmentNotes: commerceFulfillmentNotesSchema.nullish(),
  fulfillmentStatus: commerceCheckoutFulfillmentStatusSchema
});

export const studioCommerceFulfillmentRetryRequestSchema = z.object({
  reason: z.string().trim().max(240).nullish()
});

export const commerceFulfillmentCallbackRequestSchema = z.object({
  checkoutSessionId: z.string().min(1),
  externalReference: z.string().trim().min(1).max(240).nullish(),
  failureCode: z.string().trim().min(1).max(120).nullish(),
  failureMessage: z.string().trim().min(1).max(1000).nullish(),
  fulfillmentNotes: commerceFulfillmentNotesSchema.nullish(),
  status: commerceFulfillmentCallbackStatusSchema
});

export const collectionCommerceErrorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "CHECKOUT_CONFIGURATION_REQUIRED",
      "CHECKOUT_DISABLED",
      "CHECKOUT_SESSION_EXPIRED",
      "CHECKOUT_SESSION_NOT_FOUND",
      "CHECKOUT_SESSION_NOT_OPEN",
      "BRAND_NOT_FOUND",
      "COLLECTION_NOT_FOUND",
      "COLLECTION_NOT_LIVE",
      "FULFILLMENT_CALLBACK_UNAUTHORIZED",
      "FULFILLMENT_NOT_ALLOWED",
      "INVALID_REQUEST",
      "RESERVATION_NOT_AVAILABLE",
      "SESSION_REQUIRED",
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
export type CommerceCheckoutFulfillmentStatus = z.infer<
  typeof commerceCheckoutFulfillmentStatusSchema
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
export type CommerceFulfillmentProviderKind = z.infer<
  typeof commerceFulfillmentProviderKindSchema
>;
export type CommerceFulfillmentAutomationStatus = z.infer<
  typeof commerceFulfillmentAutomationStatusSchema
>;
export type CommerceCheckoutAvailabilityReason = z.infer<
  typeof commerceCheckoutAvailabilityReasonSchema
>;
export type StudioCommerceCheckoutSummary = z.infer<
  typeof studioCommerceCheckoutSummarySchema
>;
export type StudioCommerceCollectionSummary = z.infer<
  typeof studioCommerceCollectionSummarySchema
>;
export type StudioCommerceBrandSummary = z.infer<
  typeof studioCommerceBrandSummarySchema
>;
export type StudioCommerceDashboardSummary = z.infer<
  typeof studioCommerceDashboardSummarySchema
>;
export type StudioCommerceDashboardQuery = z.infer<
  typeof studioCommerceDashboardQuerySchema
>;
export type StudioCommerceReportQuery = z.infer<
  typeof studioCommerceReportQuerySchema
>;
export type StudioCommerceDashboardResponse = z.infer<
  typeof studioCommerceDashboardResponseSchema
>;
export type StudioCommerceReportMetrics = z.infer<
  typeof studioCommerceReportMetricsSchema
>;
export type StudioCommerceReportResponse = z.infer<
  typeof studioCommerceReportResponseSchema
>;
export type StudioCommerceCheckoutActionResponse = z.infer<
  typeof studioCommerceCheckoutActionResponseSchema
>;
export type StudioCommerceFulfillmentUpdateRequest = z.infer<
  typeof studioCommerceFulfillmentUpdateRequestSchema
>;
export type StudioCommerceFulfillmentRetryRequest = z.infer<
  typeof studioCommerceFulfillmentRetryRequestSchema
>;
export type CommerceFulfillmentCallbackRequest = z.infer<
  typeof commerceFulfillmentCallbackRequestSchema
>;
export type CommerceFulfillmentCallbackStatus = z.infer<
  typeof commerceFulfillmentCallbackStatusSchema
>;
export type CommerceReservationStatus = z.infer<
  typeof commerceReservationStatusSchema
>;
