import { z } from "zod";

export const foundationQueueNames = {
  foundation: "foundation-system"
} as const;

export const generationQueueNames = {
  generationDispatch: "generation-dispatch"
} as const;

export const commerceQueueNames = {
  fulfillmentDispatch: "commerce-fulfillment-dispatch"
} as const;

export const foundationJobNames = {
  noop: "noop"
} as const;

export const generationJobNames = {
  processSourceAssetGeneration: "process-source-asset-generation"
} as const;

export const commerceJobNames = {
  processCheckoutFulfillment: "process-checkout-fulfillment"
} as const;

export const noopJobPayloadSchema = z.object({
  requestedAt: z.string().datetime(),
  source: z.enum(["manual", "health", "test"])
});

export const generationJobPayloadSchema = z.object({
  generationRequestId: z.string().min(1),
  ownerUserId: z.string().min(1),
  requestedAt: z.string().datetime(),
  sourceAssetId: z.string().min(1)
});

export const commerceFulfillmentJobPayloadSchema = z.object({
  checkoutSessionId: z.string().min(1),
  requestedAt: z.string().datetime(),
  source: z.enum(["automatic", "manual_retry"])
});

export type NoopJobPayload = z.infer<typeof noopJobPayloadSchema>;
export type GenerationJobPayload = z.infer<typeof generationJobPayloadSchema>;
export type CommerceFulfillmentJobPayload = z.infer<
  typeof commerceFulfillmentJobPayloadSchema
>;

export const queueCatalog = [
  {
    jobName: foundationJobNames.noop,
    queueName: foundationQueueNames.foundation
  },
  {
    jobName: generationJobNames.processSourceAssetGeneration,
    queueName: generationQueueNames.generationDispatch
  },
  {
    jobName: commerceJobNames.processCheckoutFulfillment,
    queueName: commerceQueueNames.fulfillmentDispatch
  }
] as const;
