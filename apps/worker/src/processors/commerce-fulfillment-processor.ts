import type { Job } from "bullmq";

import {
  commerceFulfillmentJobPayloadSchema,
  type CommerceFulfillmentAutomationStatus,
  type CommerceFulfillmentJobPayload
} from "@ai-nft-forge/shared";

import type {
  CheckoutFulfillmentWebhookBoundary,
  CheckoutFulfillmentWebhookSession
} from "../commerce/fulfillment-webhook.js";

type CommerceFulfillmentProcessorDependencies = {
  now: () => Date;
  webhook: CheckoutFulfillmentWebhookBoundary;
  repositories: {
    commerceCheckoutSessionRepository: {
      findByPublicId(publicId: string): Promise<
        | (CheckoutFulfillmentWebhookSession & {
            id: string;
            fulfillmentAutomationAttemptCount: number;
            fulfillmentAutomationExternalReference: string | null;
            fulfillmentAutomationStatus: CommerceFulfillmentAutomationStatus;
            fulfillmentStatus: "unfulfilled" | "fulfilled";
            status: "open" | "completed" | "expired" | "canceled";
          })
        | null
      >;
      updateFulfillmentAutomationById(input: {
        fulfillmentAutomationAttemptCount?: number;
        fulfillmentAutomationErrorCode?: string | null;
        fulfillmentAutomationErrorMessage?: string | null;
        fulfillmentAutomationExternalReference?: string | null;
        fulfillmentAutomationLastAttemptedAt?: Date | null;
        fulfillmentAutomationLastSucceededAt?: Date | null;
        fulfillmentAutomationNextRetryAt?: Date | null;
        fulfillmentAutomationQueuedAt?: Date | null;
        fulfillmentAutomationStatus?: CommerceFulfillmentAutomationStatus;
        fulfillmentProviderKind?: "manual" | "webhook";
        id: string;
      }): Promise<unknown>;
    };
  };
};

export type CommerceFulfillmentJobResult = {
  checkoutSessionId: string;
  queueName: string;
  status: "skipped" | "submitted";
};

type CommerceFulfillmentJob = Pick<
  Job<CommerceFulfillmentJobPayload>,
  "attemptsMade" | "data" | "id" | "name" | "opts" | "queueName"
>;

function resolveTotalAttempts(job: CommerceFulfillmentJob) {
  return typeof job.opts.attempts === "number" && job.opts.attempts > 0
    ? job.opts.attempts
    : 1;
}

function resolveNextRetryAt(job: CommerceFulfillmentJob, now: Date) {
  const backoff = job.opts.backoff;

  if (
    !backoff ||
    typeof backoff !== "object" ||
    typeof backoff.delay !== "number"
  ) {
    return null;
  }

  const delayMs = backoff.delay * 2 ** job.attemptsMade;

  return new Date(now.getTime() + delayMs);
}

export function createCommerceFulfillmentProcessor(
  dependencies: CommerceFulfillmentProcessorDependencies
) {
  return async (
    job: CommerceFulfillmentJob
  ): Promise<CommerceFulfillmentJobResult> => {
    const payload = commerceFulfillmentJobPayloadSchema.parse(job.data);
    const totalAttempts = resolveTotalAttempts(job);
    const isFinalAttempt = job.attemptsMade + 1 >= totalAttempts;
    const session =
      await dependencies.repositories.commerceCheckoutSessionRepository.findByPublicId(
        payload.checkoutSessionId
      );

    if (!session) {
      throw new Error(
        `Checkout session ${payload.checkoutSessionId} was not found.`
      );
    }

    if (
      session.status !== "completed" ||
      session.fulfillmentStatus === "fulfilled"
    ) {
      return {
        checkoutSessionId: payload.checkoutSessionId,
        queueName: job.queueName,
        status: "skipped"
      };
    }

    const attemptedAt = dependencies.now();

    await dependencies.repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
      {
        fulfillmentAutomationAttemptCount:
          session.fulfillmentAutomationAttemptCount + 1,
        fulfillmentAutomationErrorCode: null,
        fulfillmentAutomationErrorMessage: null,
        fulfillmentAutomationLastAttemptedAt: attemptedAt,
        fulfillmentAutomationNextRetryAt: null,
        fulfillmentAutomationStatus: "processing",
        fulfillmentProviderKind: "webhook",
        id: session.id
      }
    );

    try {
      const delivery = await dependencies.webhook.dispatch({
        session
      });
      const completedAt = dependencies.now();

      await dependencies.repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
        {
          fulfillmentAutomationErrorCode: null,
          fulfillmentAutomationErrorMessage: null,
          fulfillmentAutomationExternalReference:
            delivery.externalReference ??
            session.fulfillmentAutomationExternalReference,
          fulfillmentAutomationLastSucceededAt: completedAt,
          fulfillmentAutomationNextRetryAt: null,
          fulfillmentAutomationQueuedAt: null,
          fulfillmentAutomationStatus: "submitted",
          id: session.id
        }
      );

      return {
        checkoutSessionId: payload.checkoutSessionId,
        queueName: job.queueName,
        status: "submitted"
      };
    } catch (error) {
      const failureMessage =
        error instanceof Error
          ? error.message
          : "Unknown fulfillment webhook failure.";

      await dependencies.repositories.commerceCheckoutSessionRepository.updateFulfillmentAutomationById(
        {
          fulfillmentAutomationErrorCode: "WEBHOOK_DELIVERY_FAILED",
          fulfillmentAutomationErrorMessage: failureMessage,
          fulfillmentAutomationNextRetryAt: isFinalAttempt
            ? null
            : resolveNextRetryAt(job, dependencies.now()),
          fulfillmentAutomationQueuedAt: isFinalAttempt
            ? null
            : dependencies.now(),
          fulfillmentAutomationStatus: isFinalAttempt ? "failed" : "queued",
          id: session.id
        }
      );

      throw error;
    }
  };
}
