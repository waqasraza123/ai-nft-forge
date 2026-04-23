import Link from "next/link";

import { ActionLink } from "@ai-nft-forge/ui";

import { primaryNavigation } from "../lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-3 z-40">
      <div className="mx-auto w-full max-w-cinematic rounded-cinematic border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,246,255,0.88))] p-3 shadow-chrome backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-[linear-gradient(145deg,#fff7ea,#cfbefd_48%,#a8e0f7)] text-lg font-semibold text-[color:var(--color-text)] shadow-launch">
              ◌
            </span>
            <span className="grid gap-0.5">
              <span className="text-base font-bold tracking-tight text-[color:var(--color-text)]">
                AI NFT Forge
              </span>
              <span className="text-xs text-[color:var(--color-muted)]">
                Light editorial launch gallery
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
