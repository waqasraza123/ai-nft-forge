import { ActionLink, SurfacePanel } from "@ai-nft-forge/ui";

export default function NotFound() {
  return (
    <div className="min-h-[40vh]">
      <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-20">
        <SurfacePanel className="grid gap-4 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            Route lookup
          </p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            That page is not part of the launch gallery
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
            This product exposes marketing, storefront, studio, and ops routes.
            Return to the primary shell and continue from an active workspace or
            public release page.
          </p>
          <ActionLink className="w-fit" href="/" tone="action">
            Return to marketing
          </ActionLink>
        </SurfacePanel>
      </div>
    </div>
  );
}
