import {
  createGenerationRequestRepository,
  createSourceAssetRepository,
  getDatabaseClient
} from "@ai-nft-forge/database";

import { createGenerationService } from "./service";
import { enqueueGenerationRequest } from "./queue";

export function createRuntimeGenerationService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);

  return createGenerationService({
    now: () => new Date(),
    queue: {
      enqueue: (input) => enqueueGenerationRequest(input, rawEnvironment)
    },
    repositories: {
      generationRequestRepository:
        createGenerationRequestRepository(databaseClient),
      sourceAssetRepository: createSourceAssetRepository(databaseClient)
    }
  });
}
