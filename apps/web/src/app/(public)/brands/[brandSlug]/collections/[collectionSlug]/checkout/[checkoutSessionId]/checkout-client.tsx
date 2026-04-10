"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CheckoutClientProps = {
  brandSlug: string;
  canCancel: boolean;
  canComplete: boolean;
  checkoutSessionId: string;
  collectionSlug: string;
};

type ApiError = {
  error?: {
    message?: string;
  };
};

export function CheckoutClient(props: CheckoutClientProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"cancel" | "complete" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "cancel" | "complete") {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(
        `/api/brands/${props.brandSlug}/collections/${props.collectionSlug}/checkout/${props.checkoutSessionId}/${action}`,
        {
          method: "POST"
        }
      );
      const payload = (await response.json()) as ApiError;

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Checkout update failed.");
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Checkout update failed."
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="storefront-checkout-actions">
      {error ? <div className="storefront-commerce-error">{error}</div> : null}
      {props.canComplete ? (
        <button
          className="storefront-button storefront-button--primary"
          disabled={busyAction !== null}
          onClick={() => void runAction("complete")}
          type="button"
        >
          {busyAction === "complete"
            ? "Completing checkout..."
            : "Complete manual checkout"}
        </button>
      ) : null}
      {props.canCancel ? (
        <button
          className="storefront-button storefront-button--ghost"
          disabled={busyAction !== null}
          onClick={() => void runAction("cancel")}
          type="button"
        >
          {busyAction === "cancel" ? "Canceling..." : "Release reservation"}
        </button>
      ) : null}
    </div>
  );
}
