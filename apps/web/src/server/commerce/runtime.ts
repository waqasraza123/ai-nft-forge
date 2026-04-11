import {
  createCommerceCheckoutSessionRepository,
  createPublishedCollectionRepository,
  createPublishedCollectionReservationRepository,
  getDatabaseClient,
  runDatabaseTransaction,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import { parseCommerceEnv } from "@ai-nft-forge/shared";

import {
  constructStripeWebhookEvent,
  createManualPaymentBoundary,
  createStripeClient,
  createStripePaymentBoundary,
  resolveCommerceReservationTtlSeconds
} from "./provider";
import { enqueueCommerceFulfillmentJob } from "./queue";
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
  const stripe =
    commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE === "stripe"
      ? createStripeClient(commerceEnv.COMMERCE_STRIPE_SECRET_KEY!)
      : null;
  const reservationTtlSeconds = resolveCommerceReservationTtlSeconds({
    configuredReservationTtlSeconds:
      commerceEnv.COMMERCE_RESERVATION_TTL_SECONDS,
    providerMode: commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE
  });
  const payment =
    commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE === "stripe" && stripe
      ? createStripePaymentBoundary({ stripe })
      : createManualPaymentBoundary({
          providerMode:
            commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE === "disabled"
              ? "disabled"
              : "manual"
        });
  const service = createCollectionCommerceService({
    fulfillmentAutomation: {
      enqueue: (input) =>
        enqueueCommerceFulfillmentJob(
          {
            checkoutSessionId: input.checkoutSessionId,
            requestedAt: new Date().toISOString(),
            source: input.source
          },
          rawEnvironment
        ).then(() => undefined),
      providerMode: commerceEnv.COMMERCE_FULFILLMENT_PROVIDER_MODE
    },
    now: () => new Date(),
    payment,
    repositories: createCommerceRepositories(databaseClient),
    reservationTtlSeconds,
    runTransaction: (operation) =>
      runDatabaseTransaction(databaseClient, (transaction) =>
        operation(createCommerceRepositories(transaction))
      )
  });

  return {
    ...service,
    async handleStripeWebhook(input: { payload: string; signature: string }) {
      if (
        commerceEnv.COMMERCE_CHECKOUT_PROVIDER_MODE !== "stripe" ||
        !stripe
      ) {
        throw new Error("Stripe checkout mode is not enabled.");
      }

      const event = await constructStripeWebhookEvent({
        payload: input.payload,
        signature: input.signature,
        stripe,
        webhookSecret: commerceEnv.COMMERCE_STRIPE_WEBHOOK_SECRET!
      });
      const checkoutSession = event.data.object;

      if (
        typeof checkoutSession !== "object" ||
        checkoutSession === null ||
        !("client_reference_id" in checkoutSession)
      ) {
        return;
      }

      const checkoutSessionId = checkoutSession.client_reference_id;

      if (!checkoutSessionId) {
        return;
      }

      switch (event.type) {
        case "checkout.session.completed":
          if (
            "payment_status" in checkoutSession &&
            checkoutSession.payment_status === "paid"
          ) {
            await service.completeProviderCheckoutSession({
              checkoutSessionId,
              providerKind: "stripe"
            });
          }
          break;
        case "checkout.session.async_payment_succeeded":
          await service.completeProviderCheckoutSession({
            checkoutSessionId,
            providerKind: "stripe"
          });
          break;
        case "checkout.session.async_payment_failed":
          await service.cancelProviderCheckoutSession({
            checkoutSessionId,
            providerKind: "stripe"
          });
          break;
        case "checkout.session.expired":
          await service.expireProviderCheckoutSession({
            checkoutSessionId,
            providerKind: "stripe"
          });
          break;
        default:
          break;
      }
    }
  };
}
