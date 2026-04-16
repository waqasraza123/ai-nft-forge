import Link from "next/link";

import { ActionLink } from "@ai-nft-forge/ui";

import { primaryNavigation } from "../lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-3 z-40">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-3 shadow-[var(--shadow-surface)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--color-accent)] text-lg font-semibold text-white shadow-sm">
              ✦
            </span>
            <span className="grid gap-0.5">
              <span className="text-base font-bold tracking-tight">
                AI NFT Forge
              </span>
              <span className="text-xs text-[color:var(--color-muted)]">
                Launch-ready collectibles platform
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav
              aria-label="Primary navigation"
              className="hidden items-center gap-2 sm:flex"
            >
              {primaryNavigation.map((item) => (
                <ActionLink href={item.href} key={item.href} tone="muted">
                  {item.label}
                </ActionLink>
              ))}
            </nav>
            <ActionLink href="/studio">Open Studio</ActionLink>
          </div>
        </div>
        <nav className="mt-2 flex flex-wrap gap-2 sm:hidden">
          {primaryNavigation.map((item) => (
            <ActionLink href={item.href} key={item.href} tone="muted">
              {item.label}
            </ActionLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
