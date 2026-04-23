"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ActionRow,
  StorefrontActionButton,
  StorefrontTile
} from "@ai-nft-forge/ui";

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
    <ActionRow compact className="mt-4">
      {error ? (
        <StorefrontTile className="w-full border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {error}
        </StorefrontTile>
      ) : null}
      {props.canComplete ? (
        <StorefrontActionButton
          disabled={busyAction !== null}
          onClick={() => void runAction("complete")}
          type="button"
        >
          {busyAction === "complete" ? "Confirming claim..." : "Confirm claim"}
        </StorefrontActionButton>
      ) : null}
      {props.canCancel ? (
        <StorefrontActionButton
          tone="ghost"
          disabled={busyAction !== null}
          onClick={() => void runAction("cancel")}
          type="button"
        >
          {busyAction === "cancel"
            ? "Releasing reservation..."
            : "Release reservation"}
        </StorefrontActionButton>
      ) : null}
    </ActionRow>
  );
}
