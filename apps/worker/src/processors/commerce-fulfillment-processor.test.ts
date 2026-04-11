import { describe, expect, it, vi } from "vitest";

import { createCommerceFulfillmentProcessor } from "./commerce-fulfillment-processor.js";

describe("createCommerceFulfillmentProcessor", () => {
  it("submits a completed checkout to the webhook boundary", async () => {
    const updateFulfillmentAutomationById = vi.fn().mockResolvedValue(undefined);
    const processor = createCommerceFulfillmentProcessor({
      now: () => new Date("2026-04-11T06:00:00.000Z"),
      repositories: {
        commerceCheckoutSessionRepository: {
          findByPublicId: vi.fn().mockResolvedValue({
            brandName: "Demo Studio",
            brandSlug: "demo-studio",
            buyerDisplayName: "Collector",
            buyerEmail: "collector@example.com",
            buyerWalletAddress: null,
            checkoutSessionId: "chk_1",
            collectionSlug: "genesis",
            completedAt: "2026-04-11T05:58:00.000Z",
            editionNumber: 1,
            fulfillmentAutomationAttemptCount: 0,
            fulfillmentAutomationExternalReference: null,
            fulfillmentAutomationStatus: "queued" as const,
            fulfillmentStatus: "unfulfilled" as const,
            id: "checkout_record_1",
            priceLabel: "0.18 ETH",
            providerKind: "manual" as const,
            status: "completed" as const,
            title: "Genesis Portrait Set"
          }),
          updateFulfillmentAutomationById
        }
      },
      webhook: {
        dispatch: vi.fn().mockResolvedValue({
          externalReference: "ship_123"
        })
      }
    });

    const result = await processor({
      attemptsMade: 0,
      data: {
        checkoutSessionId: "chk_1",
        requestedAt: "2026-04-11T06:00:00.000Z",
        source: "automatic"
      },
      id: "job_1",
      name: "process-checkout-fulfillment",
      opts: {
        attempts: 5,
        backoff: {
          delay: 30000,
          type: "exponential"
        }
      },
      queueName: "commerce-fulfillment-dispatch"
    });

    expect(updateFulfillmentAutomationById).toHaveBeenNthCalledWith(1, {
      fulfillmentAutomationAttemptCount: 1,
      fulfillmentAutomationErrorCode: null,
      fulfillmentAutomationErrorMessage: null,
      fulfillmentAutomationLastAttemptedAt: new Date("2026-04-11T06:00:00.000Z"),
      fulfillmentAutomationNextRetryAt: null,
      fulfillmentAutomationStatus: "processing",
      fulfillmentProviderKind: "webhook",
      id: "checkout_record_1"
    });
    expect(updateFulfillmentAutomationById).toHaveBeenNthCalledWith(2, {
      fulfillmentAutomationErrorCode: null,
      fulfillmentAutomationErrorMessage: null,
      fulfillmentAutomationExternalReference: "ship_123",
      fulfillmentAutomationLastSucceededAt: new Date("2026-04-11T06:00:00.000Z"),
      fulfillmentAutomationNextRetryAt: null,
      fulfillmentAutomationQueuedAt: null,
      fulfillmentAutomationStatus: "submitted",
      id: "checkout_record_1"
    });
    expect(result).toEqual({
      checkoutSessionId: "chk_1",
      queueName: "commerce-fulfillment-dispatch",
      status: "submitted"
    });
  });

  it("requeues the session when a non-final webhook delivery attempt fails", async () => {
    const updateFulfillmentAutomationById = vi.fn().mockResolvedValue(undefined);
    const processor = createCommerceFulfillmentProcessor({
      now: () => new Date("2026-04-11T06:00:00.000Z"),
      repositories: {
        commerceCheckoutSessionRepository: {
          findByPublicId: vi.fn().mockResolvedValue({
            brandName: "Demo Studio",
            brandSlug: "demo-studio",
            buyerDisplayName: "Collector",
            buyerEmail: "collector@example.com",
            buyerWalletAddress: null,
            checkoutSessionId: "chk_1",
            collectionSlug: "genesis",
            completedAt: "2026-04-11T05:58:00.000Z",
            editionNumber: 1,
            fulfillmentAutomationAttemptCount: 1,
            fulfillmentAutomationExternalReference: null,
            fulfillmentAutomationStatus: "queued" as const,
            fulfillmentStatus: "unfulfilled" as const,
            id: "checkout_record_1",
            priceLabel: "0.18 ETH",
            providerKind: "manual" as const,
            status: "completed" as const,
            title: "Genesis Portrait Set"
          }),
          updateFulfillmentAutomationById
        }
      },
      webhook: {
        dispatch: vi.fn().mockRejectedValue(new Error("Webhook timeout"))
      }
    });

    await expect(
      processor({
        attemptsMade: 1,
        data: {
          checkoutSessionId: "chk_1",
          requestedAt: "2026-04-11T06:00:00.000Z",
          source: "automatic"
        },
        id: "job_2",
        name: "process-checkout-fulfillment",
        opts: {
          attempts: 5,
          backoff: {
            delay: 30000,
            type: "exponential"
          }
        },
        queueName: "commerce-fulfillment-dispatch"
      })
    ).rejects.toThrow("Webhook timeout");

    expect(updateFulfillmentAutomationById).toHaveBeenNthCalledWith(2, {
      fulfillmentAutomationErrorCode: "WEBHOOK_DELIVERY_FAILED",
      fulfillmentAutomationErrorMessage: "Webhook timeout",
      fulfillmentAutomationNextRetryAt: new Date("2026-04-11T06:01:00.000Z"),
      fulfillmentAutomationQueuedAt: new Date("2026-04-11T06:00:00.000Z"),
      fulfillmentAutomationStatus: "queued",
      id: "checkout_record_1"
    });
  });
});
