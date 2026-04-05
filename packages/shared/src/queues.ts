import { z } from "zod";

export const foundationQueueNames = {
  foundation: "foundation-system"
} as const;

export const foundationJobNames = {
  noop: "noop"
} as const;

export const noopJobPayloadSchema = z.object({
  requestedAt: z.string().datetime(),
  source: z.enum(["manual", "health", "test"])
});

export type NoopJobPayload = z.infer<typeof noopJobPayloadSchema>;

export const queueCatalog = [
  {
    jobName: foundationJobNames.noop,
    queueName: foundationQueueNames.foundation
  }
] as const;
