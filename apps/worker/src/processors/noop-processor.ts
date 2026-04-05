import type { Job } from "bullmq";

import {
  noopJobPayloadSchema,
  type NoopJobPayload
} from "@ai-nft-forge/shared";

import type { Logger } from "../lib/logger.js";

export type NoopJobResult = {
  handledAt: string;
  queueName: string;
  source: NoopJobPayload["source"];
};

type NoopJob = Pick<Job<NoopJobPayload>, "data" | "id" | "name" | "queueName">;

type NoopProcessorOptions = {
  logger: Logger;
};

export function createNoopProcessor({ logger }: NoopProcessorOptions) {
  return async (job: NoopJob): Promise<NoopJobResult> => {
    const payload = noopJobPayloadSchema.parse(job.data);
    const result = {
      handledAt: new Date().toISOString(),
      queueName: job.queueName,
      source: payload.source
    };

    logger.info("Processed noop worker job", {
      jobId: job.id,
      jobName: job.name,
      ...result
    });

    return result;
  };
}
