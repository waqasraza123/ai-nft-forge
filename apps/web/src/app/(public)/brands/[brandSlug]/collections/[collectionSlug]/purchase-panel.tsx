"use client";

import { useState, type FormEvent } from "react";
import { ActionButton, FieldLabel, InputField } from "@ai-nft-forge/ui";

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
    <article className="relative overflow-hidden rounded-[1.75rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-6 shadow-[var(--shadow-surface)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.17),transparent_25%),radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.09),transparent_20%)]" />
      <div className="relative grid gap-4 md:grid-cols-[1.05fr_0.95fr] md:items-stretch">
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--storefront-accent)]">
              Reserve and checkout
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[color:var(--storefront-text)]">
              {props.priceLabel
                ? `Reserve the next available edition for ${props.priceLabel}`
                : "Reserve the next available edition"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--storefront-text)]">
              {props.availableEditionCount} editions open
            </span>
            {props.nextAvailableEditionNumber ? (
              <span className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--storefront-text)]">
                Next edition #{props.nextAvailableEditionNumber}
              </span>
            ) : null}
            {props.activeReservationCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--storefront-text)]">
                {props.activeReservationCount} held right now
              </span>
            ) : null}
          </div>
          {props.checkoutEnabled ? (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="grid gap-1.5">
                <FieldLabel>Name</FieldLabel>
                <InputField
                  autoComplete="name"
                  className="rounded-xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-2 text-sm text-[color:var(--storefront-text)] placeholder:text-[color:var(--storefront-muted)]"
                  onChange={(event) => setBuyerDisplayName(event.target.value)}
                  placeholder="Collector name"
                  value={buyerDisplayName}
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Email</FieldLabel>
                <InputField
                  autoComplete="email"
                  className="rounded-xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-2 text-sm text-[color:var(--storefront-text)] placeholder:text-[color:var(--storefront-muted)]"
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder="collector@example.com"
                  required
                  type="email"
                  value={buyerEmail}
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Wallet address</FieldLabel>
                <InputField
                  autoComplete="off"
                  className="rounded-xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] px-3 py-2 text-sm text-[color:var(--storefront-text)] placeholder:text-[color:var(--storefront-muted)]"
                  onChange={(event) =>
                    setBuyerWalletAddress(event.target.value)
                  }
                  placeholder="Optional delivery wallet"
                  value={buyerWalletAddress}
                />
              </label>
              {error ? (
                <p className="rounded-xl border border-red-400/45 bg-red-500/12 p-2.5 text-sm text-red-100">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <ActionButton disabled={busy} tone="primary" type="submit">
                  {busy
                    ? "Starting checkout..."
                    : props.providerMode === "stripe"
                      ? "Reserve and continue to payment"
                      : "Reserve and continue"}
                </ActionButton>
              </div>
            </form>
          ) : (
            <p className="rounded-xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-3 text-sm text-[color:var(--storefront-text)]">
              {disabledMessage}
            </p>
          )}
        </section>

        <aside className="rounded-[1.5rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--storefront-accent)]">
            Reservation state
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[color:var(--storefront-text)]">
            Collector-ready interface
          </h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--storefront-muted)]">
            This panel anchors the reserve action with collectible-first visuals
            and explicit snapshot-backed availability.
          </p>
          <p className="mt-3 text-xs text-[color:var(--storefront-accent)]">
            Price mode: {props.priceLabel ?? "Open-edition pricing"}
          </p>
          <div className="mt-4 border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--storefront-accent)]">
              Live metrics
            </p>
            <p className="mt-2 text-sm text-[color:var(--storefront-text)]">
              {props.availableEditionCount} editions remain,{" "}
              {props.activeReservationCount} held right now, and checkout is
              currently
              <span className="ml-1 font-semibold">
                {props.checkoutEnabled ? "live" : "disabled"}
              </span>
              .
            </p>
          </div>
          <p className="mt-3 rounded-xl border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] px-3 py-2 text-xs text-[color:var(--storefront-muted)]">
            If checkout is unavailable, enable provider mode in studio and
            retry.
          </p>
        </aside>
      </div>
    </article>
  );
}
