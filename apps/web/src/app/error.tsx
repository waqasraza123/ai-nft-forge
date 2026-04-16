"use client";

import { ActionButton } from "@ai-nft-forge/ui";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-[40vh] bg-[color:var(--color-surface)]">
      <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-20">
        <h1 className="text-3xl font-semibold">Shell error</h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
          {error.message ||
            "An unexpected error interrupted the current route."}
        </p>
        <ActionButton className="w-fit" onClick={reset} tone="secondary" type="button">
          Retry route
        </ActionButton>
      </div>
    </div>
  );
}
