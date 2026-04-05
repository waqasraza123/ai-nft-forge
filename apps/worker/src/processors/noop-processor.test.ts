import { describe, expect, it, vi } from "vitest";

import {
  foundationJobNames,
  foundationQueueNames,
  type NoopJobPayload
} from "@ai-nft-forge/shared";

import { createNoopProcessor } from "./noop-processor.js";

describe("createNoopProcessor", () => {
  it("returns a stable noop job result", async () => {
    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    };
    const processNoopJob = createNoopProcessor({
      logger
    });
    const jobPayload: NoopJobPayload = {
      requestedAt: "2026-04-05T00:00:00.000Z",
      source: "test"
    };

    const result = await processNoopJob({
      data: jobPayload,
      id: "noop-job-1",
      name: foundationJobNames.noop,
      queueName: foundationQueueNames.foundation
    });

    expect(result.queueName).toBe(foundationQueueNames.foundation);
    expect(result.source).toBe("test");
    expect(Number.isNaN(Date.parse(result.handledAt))).toBe(false);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});
