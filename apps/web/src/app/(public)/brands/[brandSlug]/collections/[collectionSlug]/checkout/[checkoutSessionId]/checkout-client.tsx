"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionButton } from "@ai-nft-forge/ui";

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
    <div
      className="mt-4 flex flex-wrap gap-2"
      role="group"
    >
      {error ? (
        <p className="w-full rounded-xl border border-red-400/45 bg-red-500/12 p-2.5 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {props.canComplete ? (
        <ActionButton
          tone="primary"
          disabled={busyAction !== null}
          onClick={() => void runAction("complete")}
          type="button"
        >
          {busyAction === "complete" ? "Confirming claim..." : "Confirm claim"}
        </ActionButton>
      ) : null}
      {props.canCancel ? (
        <ActionButton
          tone="ghost"
          disabled={busyAction !== null}
          onClick={() => void runAction("cancel")}
          type="button"
        >
          {busyAction === "cancel"
            ? "Releasing reservation..."
            : "Release reservation"}
        </ActionButton>
      ) : null}
    </div>
  );
}
