"use client";

import type { FormEvent } from "react";

import {
  type CommerceCheckoutFulfillmentStatus,
  type StudioCommerceCheckoutSummary
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  ActionLink,
  FieldLabel,
  FieldStack,
  StatusBanner,
  TextAreaField
} from "@ai-nft-forge/ui";
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
  canOperate: boolean;
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

const toneCardClassMap: Record<
  StudioCommerceSessionEmphasisTone,
  {
    card: string;
  }
> = {
  critical: {
    card: "border-red-200 bg-red-50 text-red-700"
  },
  warning: {
    card: "border-amber-200 bg-amber-50 text-amber-700"
  },
  success: {
    card: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  neutral: {
    card: "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]"
  }
};

function resolveBadgeTone(tone: StudioCommerceSessionEmphasisTone) {
  if (tone === "critical") {
    return "border-red-200 text-red-700";
  }

  if (tone === "warning") {
    return "border-amber-200 text-amber-700";
  }

  if (tone === "success") {
    return "border-emerald-200 text-emerald-700";
  }

  return "border-[color:var(--color-line)] text-[color:var(--color-muted)]";
}

const selectClass =
  "w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30";

export function StudioCommerceSessionCard({
  canOperate,
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
      className={`rounded-3xl border p-4 md:p-5 xl:p-6 ${toneCardClassMap[emphasisTone].card}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
            {checkout.brandName} · {checkout.collectionSlug}
          </p>
          <h3 className="text-xl font-semibold">{checkout.title}</h3>
          <p className="text-sm text-[color:var(--color-muted)]">
            {formatBuyerIdentity(checkout)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${resolveBadgeTone(emphasisTone)}`}
        >
          {emphasisLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Buyer
          </p>
          <strong className="mt-1 block text-sm">
            {checkout.buyerDisplayName ?? "Unnamed buyer"}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {checkout.buyerEmail}
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            {checkout.buyerWalletAddress ?? "No wallet captured"}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Reservation
          </p>
          <strong className="mt-1 block text-sm">
            {formatReservationStatus(checkout.reservationStatus)}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Created {formatTimestamp(checkout.createdAt)}
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Expires {formatTimestamp(checkout.expiresAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Payment
          </p>
          <strong className="mt-1 block text-sm">
            {formatCheckoutStatus(checkout.status)}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {formatProviderKind(checkout.providerKind)}
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Paid {formatTimestamp(checkout.completedAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Fulfillment
          </p>
          <strong className="mt-1 block text-sm">
            {formatFulfillmentStatus(checkout.fulfillmentStatus)}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {checkout.fulfillmentProviderKind === "webhook"
              ? "Webhook automation"
              : "Manual fulfillment"}
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Fulfilled {formatTimestamp(checkout.fulfilledAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Automation
          </p>
          <strong className="mt-1 block text-sm">
            {formatAutomationStatus(checkout.fulfillmentAutomationStatus)}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {checkout.fulfillmentAutomationAttemptCount.toString()} attempts
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Last attempt{" "}
            {formatTimestamp(checkout.fulfillmentAutomationLastAttemptedAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg-strong)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            References
          </p>
          <strong className="mt-1 block text-sm">
            {checkout.providerSessionId
              ? shortenValue(checkout.providerSessionId)
              : "No provider session"}
          </strong>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {checkout.fulfillmentAutomationExternalReference
              ? shortenValue(checkout.fulfillmentAutomationExternalReference)
              : "No external fulfillment reference"}
          </p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Retry window{" "}
            {formatTimestamp(checkout.fulfillmentAutomationNextRetryAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ActionLink
          href={checkout.collectionPublicPath}
          tone="inline"
          target="_blank"
        >
          Public release
        </ActionLink>
        <ActionLink
          href={`/brands/${checkout.brandSlug}/collections/${checkout.collectionSlug}/checkout/${checkout.checkoutSessionId}`}
          tone="inline"
          target="_blank"
        >
          Hosted checkout
        </ActionLink>
        {checkout.providerKind === "stripe" ? (
          <ActionLink href={checkout.checkoutUrl} tone="inline" target="_blank">
            Stripe session
          </ActionLink>
        ) : null}
      </div>

      {checkout.fulfillmentAutomationErrorMessage ? (
        <StatusBanner className="mt-4" tone="error">
          <strong>
            {checkout.fulfillmentAutomationErrorCode ?? "Automation failure"}
          </strong>
          <span>{checkout.fulfillmentAutomationErrorMessage}</span>
        </StatusBanner>
      ) : null}

      {canCompleteManually || canCancel || canRetryAutomation ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {canCompleteManually ? (
            <ActionButton
              disabled={!canOperate || isBusy}
              onClick={() => {
                void onRunAction({
                  checkoutSessionId: checkout.checkoutSessionId,
                  message: "Recording manual payment…",
                  path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/complete`,
                  successMessage: "Manual checkout marked completed."
                });
              }}
              tone="accent"
              type="button"
            >
              {isBusy ? "Working…" : "Mark paid"}
            </ActionButton>
          ) : null}
          {canCancel ? (
            <ActionButton
              disabled={!canOperate || isBusy}
              onClick={() => {
                void onRunAction({
                  checkoutSessionId: checkout.checkoutSessionId,
                  message: "Releasing checkout session…",
                  path: `/api/studio/commerce/checkouts/${checkout.checkoutSessionId}/cancel`,
                  successMessage: "Checkout session released."
                });
              }}
              tone="primary"
              type="button"
            >
              {isBusy ? "Working…" : "Release session"}
            </ActionButton>
          ) : null}
          {canRetryAutomation ? (
            <ActionButton
              disabled={!canOperate || isBusy}
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
              tone="primary"
              type="button"
            >
              {isBusy ? "Working…" : "Retry automation"}
            </ActionButton>
          ) : null}
        </div>
      ) : null}

      {canEditFulfillment ? (
        <form
          className="mt-4 rounded-2xl border border-[color:var(--color-line)] p-4"
          onSubmit={(event) => {
            onSubmitFulfillment(event, checkout);
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FieldStack>
              <FieldLabel>Fulfillment status</FieldLabel>
              <select
                className={selectClass}
                disabled={!canOperate || isBusy}
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
            </FieldStack>
            <FieldStack>
              <FieldLabel>Fulfillment notes</FieldLabel>
              <TextAreaField
                className="w-full min-h-[8rem]"
                disabled={!canOperate || isBusy}
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
            </FieldStack>
          </div>
          <div className="mt-3 flex justify-end">
            <ActionButton
              disabled={!canOperate || isBusy}
              tone="primary"
              type="submit"
            >
              {isBusy ? "Saving…" : "Save fulfillment"}
            </ActionButton>
          </div>
        </form>
      ) : null}
    </article>
  );
}
