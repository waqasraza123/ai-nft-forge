import { ActionLink } from "@ai-nft-forge/ui";

export default function NotFound() {
  return (
    <div className="min-h-[40vh] bg-[color:var(--color-surface)]">
      <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-20">
        <h1 className="text-3xl font-semibold">Route not found</h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
          This shell currently exposes marketing, studio, ops, and brand
          collection surfaces. Use the action below to return to the primary
          entry point.
        </p>
        <ActionLink className="w-fit" href="/" tone="action">
          Return to marketing
        </ActionLink>
      </div>
    </div>
  );
}
