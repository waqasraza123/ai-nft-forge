"use client";

import { useState, type FormEvent } from "react";

type PurchasePanelProps = {
  activeReservationCount: number;
  availableEditionCount: number;
  brandSlug: string;
  checkoutAvailabilityReason:
    | "collection_not_live"
    | "no_available_editions"
    | "pricing_incomplete"
    | "provider_disabled"
    | null;
  checkoutEnabled: boolean;
  collectionSlug: string;
  nextAvailableEditionNumber: number | null;
  priceLabel: string | null;
  providerMode: "disabled" | "manual" | "stripe";
};

type ApiError = {
  error?: {
    message?: string;
  };
};

function hasCheckoutUrl(
  value: ApiError | { checkout?: { checkoutUrl: string } }
): value is { checkout: { checkoutUrl: string } } {
  return typeof value === "object" && value !== null && "checkout" in value;
}

function hasApiError(
  value: ApiError | { checkout?: { checkoutUrl: string } }
): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value;
}

export function PurchasePanel(props: PurchasePanelProps) {
  const [buyerDisplayName, setBuyerDisplayName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerWalletAddress, setBuyerWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/brands/${props.brandSlug}/collections/${props.collectionSlug}/checkout`,
        {
          body: JSON.stringify({
            buyerDisplayName: buyerDisplayName || undefined,
            buyerEmail,
            buyerWalletAddress: buyerWalletAddress || undefined
          }),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        }
      );
      const payload = (await response.json()) as
        | {
            checkout?: {
              checkoutUrl: string;
            };
          }
        | ApiError;

      if (!response.ok || !hasCheckoutUrl(payload) || !payload.checkout) {
        throw new Error(
          hasApiError(payload)
            ? (payload.error?.message ?? "Checkout could not be started.")
            : "Checkout could not be started."
        );
      }

      window.location.assign(payload.checkout.checkoutUrl);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Checkout could not be started."
      );
      setBusy(false);
    }
  }

  const disabledMessage =
    props.checkoutAvailabilityReason === "provider_disabled"
      ? "Checkout is disabled on this deployment."
      : props.checkoutAvailabilityReason === "pricing_incomplete"
        ? "Checkout pricing is not configured for this release yet."
        : props.checkoutAvailabilityReason === "no_available_editions"
          ? "No reserveable editions remain in this drop."
          : "Checkout opens once this release is live.";

  return (
    <article className="storefront-panel storefront-commerce-panel">
      <span className="storefront-section-kicker">Reserve and checkout</span>
      <h2>
        {props.priceLabel
          ? `Reserve the next available edition for ${props.priceLabel}`
          : "Reserve the next available edition"}
      </h2>
      <div className="storefront-commerce-meta">
        <span className="storefront-chip">
          {props.availableEditionCount} editions open
        </span>
        {props.nextAvailableEditionNumber ? (
          <span className="storefront-chip">
            Next edition #{props.nextAvailableEditionNumber}
          </span>
        ) : null}
        {props.activeReservationCount > 0 ? (
          <span className="storefront-chip">
            {props.activeReservationCount} held right now
          </span>
        ) : null}
      </div>
      {props.checkoutEnabled ? (
        <form className="storefront-commerce-form" onSubmit={handleSubmit}>
          <label className="storefront-commerce-field">
            <span>Name</span>
            <input
              autoComplete="name"
              className="storefront-commerce-input"
              onChange={(event) => setBuyerDisplayName(event.target.value)}
              placeholder="Collector name"
              value={buyerDisplayName}
            />
          </label>
          <label className="storefront-commerce-field">
            <span>Email</span>
            <input
              autoComplete="email"
              className="storefront-commerce-input"
              onChange={(event) => setBuyerEmail(event.target.value)}
              placeholder="collector@example.com"
              required
              type="email"
              value={buyerEmail}
            />
          </label>
          <label className="storefront-commerce-field">
            <span>Wallet address</span>
            <input
              autoComplete="off"
              className="storefront-commerce-input"
              onChange={(event) => setBuyerWalletAddress(event.target.value)}
              placeholder="Optional delivery wallet"
              value={buyerWalletAddress}
            />
          </label>
          {error ? (
            <div className="storefront-commerce-error">{error}</div>
          ) : null}
          <button
            className="storefront-button storefront-button--primary"
            disabled={busy}
            type="submit"
          >
            {busy
              ? "Starting checkout..."
              : props.providerMode === "stripe"
                ? "Reserve and continue to payment"
                : "Reserve and continue"}
          </button>
        </form>
      ) : (
        <div className="storefront-commerce-empty">{disabledMessage}</div>
      )}
    </article>
  );
}
