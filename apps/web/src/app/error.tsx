"use client";

import { ActionButton, SurfacePanel } from "@ai-nft-forge/ui";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-[40vh]">
      <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-20">
        <SurfacePanel className="grid gap-4 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            Route state
          </p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            The current surface hit an unexpected interruption
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
            {error.message ||
              "An unexpected error interrupted the current route."}
          </p>
          <ActionButton
            className="w-fit"
            onClick={reset}
            tone="secondary"
            type="button"
          >
            Retry route
          </ActionButton>
        </SurfacePanel>
      </div>
    </div>
  );
}
