import { describe, expect, it } from "vitest";

import {
  generationJobNames,
  generationQueueNames,
  foundationJobNames,
  foundationQueueNames,
  queueCatalog
} from "@ai-nft-forge/shared";

describe("queueCatalog", () => {
  it("keeps queue and job names centralized", () => {
    expect(queueCatalog).toEqual([
      {
        jobName: foundationJobNames.noop,
        queueName: foundationQueueNames.foundation
      },
      {
        jobName: generationJobNames.processSourceAssetGeneration,
        queueName: generationQueueNames.generationDispatch
      }
    ]);
  });
});
