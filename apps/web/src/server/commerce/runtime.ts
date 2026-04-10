import {
  createCommerceCheckoutSessionRepository,
  createPublishedCollectionRepository,
  createPublishedCollectionReservationRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import { parseCommerceEnv } from "@ai-nft-forge/shared";

import { createCollectionCommerceService } from "./service";

function createCommerceRepositories(database: DatabaseExecutor) {
  return {
    commerceCheckoutSessionRepository:
      createCommerceCheckoutSessionRepository(database),
    publishedCollectionRepository: createPublishedCollectionRepository(database),
    publishedCollectionReservationRepository:
      createPublishedCollectionReservationRepository(database)
  };
}

export function createRuntimeCollectionCommerceService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const databaseClient = getDatabaseClient(rawEnvironment);
  const commerceEnv = parseCommerceEnv(rawEnvironment);

  return createCollectionCommerceService({
    now: () => new Date(),
    payment: {
      createCheckoutSession(input) {
        return {
          checkoutUrl: `/brands/${input.brandSlug}/collections/${input.collectionSlug}/checkout/${input.checkoutSessionId}`,
          providerKind: "manual"
        };
      },
      providerMode: commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE
    },
    repositories: createCommerceRepositories(databaseClient),
    reservationTtlSeconds: commerceEnv.COMMERCE_RESERVATION_TTL_SECONDS,
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, (transaction) =>
        operation(createCommerceRepositories(transaction))
      )
  });
}
