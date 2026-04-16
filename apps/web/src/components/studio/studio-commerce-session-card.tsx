"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import {
  type CommerceCheckoutFulfillmentStatus,
  type StudioCommerceCheckoutSummary
} from "@ai-nft-forge/shared";
import { Pill } from "@ai-nft-forge/ui";

export type StudioCommerceSessionEditor = {
  fulfillmentNotes: string;
  fulfillmentStatus: CommerceCheckoutFulfillmentStatus;
};

export type StudioCommerceSessionEmphasisTone =
  | "critical"
  | "warning"
  | "success"
  | "neutral";

export type StudioCommerceSessionActionRequest = {
  checkoutSessionId: string;
  message: string;
  method?: "PATCH" | "POST";
  path: string;
  payload?: unknown;
  successMessage: string;
};

type StudioCommerceSessionCardProps = {
  checkout: StudioCommerceCheckoutSummary;
  editor: StudioCommerceSessionEditor;
  emphasisLabel: string;
  emphasisTone: StudioCommerceSessionEmphasisTone;
  isBusy: boolean;
  onEditorChange(input: {
    checkoutSessionId: string;
    fulfillmentNotes?: string;
    fulfillmentStatus?: CommerceCheckoutFulfillmentStatus;
  }): void;
  onRunAction(input: StudioCommerceSessionActionRequest): Promise<void>;
  onSubmitFulfillment(
    event: FormEvent<HTMLFormElement>,
    checkout: StudioCommerceCheckoutSummary
  ): Promise<void> | void;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCheckoutStatus(status: StudioCommerceCheckoutSummary["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    case "canceled":
      return "Canceled";
    case "open":
    default:
      return "Open";
  }
}

function formatReservationStatus(
  status: StudioCommerceCheckoutSummary["reservationStatus"]
) {
  switch (status) {
    case "completed":
      return "Reservation completed";
    case "expired":
      return "Reservation expired";
    case "canceled":
      return "Reservation canceled";
    case "pending":
    default:
      return "Reservation pending";
  }
}

function formatFulfillmentStatus(
  status: StudioCommerceCheckoutSummary["fulfillmentStatus"]
) {
  return status === "fulfilled" ? "Fulfilled" : "Unfulfilled";
}

function formatAutomationStatus(
  status: StudioCommerceCheckoutSummary["fulfillmentAutomationStatus"]
) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Dispatching";
    case "submitted":
      return "Submitted";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "idle":
    default:
      return "Idle";
  }
}

function formatProviderKind(
  providerKind: StudioCommerceCheckoutSummary["providerKind"]
) {
  return providerKind === "stripe" ? "Stripe" : "Manual";
}

function formatBuyerIdentity(checkout: StudioCommerceCheckoutSummary) {
  if (checkout.buyerDisplayName) {
    return `${checkout.buyerDisplayName} · ${checkout.buyerEmail}`;
  }

  return checkout.buyerEmail;
}

function shortenValue(value: string) {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function StudioCommerceSessionCard({
  checkout,
  editor,
  emphasisLabel,
  emphasisTone,
  isBusy,
  onEditorChange,
  onRunAction,
  onSubmitFulfillment
}: StudioCommerceSessionCardProps) {
  const canCompleteManually =
    checkout.providerKind === "manual" && checkout.status === "open";
  const canCancel = checkout.status === "open" || checkout.status === "expired";
  const canEditFulfillment = checkout.status === "completed";
  const canRetryAutomation =
    checkout.fulfillmentProviderKind === "webhook" &&
    checkout.status === "completed" &&
    checkout.fulfillmentStatus === "unfulfilled" &&
    (checkout.fulfillmentAutomationStatus === "failed" ||
      checkout.fulfillmentAutomationStatus === "idle");

  return (
    <article
      className={`studio-commerce-session-card studio-commerce-session-card--${emphasisTone}`}
    >
      <div className="studio-commerce-session-card__top">
        <div className="studio-commerce-session-card__title-block">
          <p className="studio-commerce-session-card__eyebrow">
            {checkout.brandName} · {checkout.collectionSlug}
          </p>
          <h3 className="studio-commerce-session-card__title">
            {checkout.title}
          </h3>
          <p className="studio-commerce-session-card__summary">
            {formatBuyerIdentity(checkout)}
          </p>
        </div>
        <span
          className={`studio-commerce-session-card__badge studio-commerce-session-card__badge--${emphasisTone}`}
        >
          {emphasisLabel}
        </span>
      </div>

      <div className="pill-row">
        <Pill>{formatCheckoutStatus(checkout.status)}</Pill>
        <Pill>{formatProviderKind(checkout.providerKind)}</Pill>
        <Pill>{formatFulfillmentStatus(checkout.fulfillmentStatus)}</Pill>
        <Pill>
          {formatAutomationStatus(checkout.fulfillmentAutomationStatus)}
        </Pill>
        <Pill>{checkout.storefrontStatus}</Pill>
        <Pill>Edition #{checkout.editionNumber.toString()}</Pill>
        {checkout.priceLabel ? <Pill>{checkout.priceLabel}</Pill> : null}
      </div>

      <div className="studio-commerce-session-card__grid">
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            Buyer
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {checkout.buyerDisplayName ?? "Unnamed buyer"}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            {checkout.buyerEmail}
          </span>
          <span className="studio-commerce-session-card__field-detail">
            {checkout.buyerWalletAddress ?? "No wallet captured"}
          </span>
        </div>
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            Reservation
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {formatReservationStatus(checkout.reservationStatus)}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            Created {formatTimestamp(checkout.createdAt)}
          </span>
          <span className="studio-commerce-session-card__field-detail">
            Expires {formatTimestamp(checkout.expiresAt)}
          </span>
        </div>
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            Payment
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {formatCheckoutStatus(checkout.status)}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            {formatProviderKind(checkout.providerKind)}
          </span>
          <span className="studio-commerce-session-card__field-detail">
            Paid {formatTimestamp(checkout.completedAt)}
          </span>
        </div>
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            Fulfillment
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {formatFulfillmentStatus(checkout.fulfillmentStatus)}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            {checkout.fulfillmentProviderKind === "webhook"
              ? "Webhook automation"
              : "Manual fulfillment"}
          </span>
          <span className="studio-commerce-session-card__field-detail">
            Fulfilled {formatTimestamp(checkout.fulfilledAt)}
          </span>
        </div>
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            Automation
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {formatAutomationStatus(checkout.fulfillmentAutomationStatus)}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            {checkout.fulfillmentAutomationAttemptCount.toString()} attempts
          </span>
          <span className="studio-commerce-session-card__field-detail">
            Last attempt{" "}
            {formatTimestamp(checkout.fulfillmentAutomationLastAttemptedAt)}
          </span>
        </div>
        <div className="studio-commerce-session-card__field">
          <span className="studio-commerce-session-card__field-label">
            References
          </span>
          <strong className="studio-commerce-session-card__field-value">
            {checkout.providerSessionId
              ? shortenValue(checkout.providerSessionId)
              : "No provider session"}
          </strong>
          <span className="studio-commerce-session-card__field-detail">
            {checkout.fulfillmentAutomationExternalReference
              ? shortenValue(checkout.fulfillmentAutomationExternalReference)
              : "No external fulfillment reference"}
          </span>
          <span className="studio-commerce-session-card__field-detail">
            Retry window{" "}
            {formatTimestamp(checkout.fulfillmentAutomationNextRetryAt)}
          </span>
        </div>
      </div>

      <div className="studio-commerce-session-card__links">
        <Link
          className="inline-link"
          href={checkout.collectionPublicPath}
          rel="noreferrer"
          target="_blank"
        >
          Public release
        </Link>
        <Link
          className="inline-link"
          href={`/brands/${checkout.brandSlug}/collections/${checkout.collectionSlug}/checkout/${checkout.checkoutSessionId}`}
          rel="noreferrer"
          target="_blank"
        >
          Hosted checkout
        </Link>
        {checkout.providerKind === "stripe" ? (
          <Link
            className="inline-link"
            href={checkout.checkoutUrl}
            rel="noreferrer"
            target="_blank"
          >
            Stripe session
          </Link>
        ) : null}
      </div>

      {checkout.fulfillmentAutomationErrorMessage ? (
        <div className="studio-commerce-session-card__alert status-banner status-banner--error">
          <strong>
            {checkout.fulfillmentAutomationErrorCode ?? "Automation failure"}
          </strong>
          <span>{checkout.fulfillmentAutomationErrorMessage}</span>
        </div>
      ) : null}

      {canCompleteManually || canCancel || canRetryAutomation ? (
        <div className="studio-commerce-session-card__actions">
          {canCompleteManually ? (
            <button
              className="button-action button-action--accent"
              disabled={isBusy}
              onClick={() => {
                void onRunAction({
                  checkoutSessionId: checkout.checkoutSessionId,
                  message: "Recording manual payment…",
                  path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/complete`,
                  successMessage: "Manual checkout marked completed."
                });
              }}
              type="button"
            >
              {isBusy ? "Working…" : "Mark paid"}
            </button>
          ) : null}
          {canCancel ? (
            <button
              className="button-action"
              disabled={isBusy}
              onClick={() => {
                void onRunAction({
                  checkoutSessionId: checkout.checkoutSessionId,
                  message: "Releasing checkout session…",
                  path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/cancel`,
                  successMessage: "Checkout session released."
                });
              }}
              type="button"
            >
              {isBusy ? "Working…" : "Release session"}
            </button>
          ) : null}
          {canRetryAutomation ? (
            <button
              className="button-action"
              disabled={isBusy}
              onClick={() => {
                void onRunAction({
                  checkoutSessionId: checkout.checkoutSessionId,
                  message: "Requeueing fulfillment automation…",
                  path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/fulfillment/retry`,
                  payload: {
                    reason: null
                  },
                  successMessage: "Fulfillment automation requeued."
                });
              }}
              type="button"
            >
              {isBusy ? "Working…" : "Retry automation"}
            </button>
          ) : null}
        </div>
      ) : null}

      {canEditFulfillment ? (
        <form
          className="studio-form studio-commerce-session-card__form"
          onSubmit={(event) => {
            onSubmitFulfillment(event, checkout);
          }}
        >
          <div className="studio-commerce-session-card__form-grid">
            <label className="field-stack">
              <span className="field-label">Fulfillment status</span>
              <select
                className="input-field"
                onChange={(event) => {
                  onEditorChange({
                    checkoutSessionId: checkout.checkoutSessionId,
                    fulfillmentStatus: event.target
                      .value as CommerceCheckoutFulfillmentStatus
                  });
                }}
                value={editor.fulfillmentStatus}
              >
                <option value="unfulfilled">Unfulfilled</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="field-label">Fulfillment notes</span>
              <textarea
                className="input-field"
                onChange={(event) => {
                  onEditorChange({
                    checkoutSessionId: checkout.checkoutSessionId,
                    fulfillmentNotes: event.target.value
                  });
                }}
                placeholder="Delivery, wallet handoff, tracking, or internal notes"
                rows={3}
                value={editor.fulfillmentNotes}
              />
            </label>
          </div>
          <div className="studio-commerce-session-card__actions">
            <button className="button-action" disabled={isBusy} type="submit">
              {isBusy ? "Saving…" : "Save fulfillment"}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
