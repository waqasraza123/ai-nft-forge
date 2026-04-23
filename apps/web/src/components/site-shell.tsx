"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@ai-nft-forge/ui";
import { isAppRoute } from "../lib/navigation";

type SiteShellMode = "public" | "app";

type SiteShellProps = {
  children: ReactNode;
};

function getShellMode(pathname: string | null): SiteShellMode {
  if (pathname === null) {
    return "public";
  }

  return isAppRoute(pathname) ? "app" : "public";
}

function getModeThemeClassName(mode: SiteShellMode) {
  if (mode === "app") {
    // Private routes stay calm and precise inside the same light product family.
    return [
      "[--color-bg:radial-gradient(circle_at_12%_0%,rgba(165,143,255,0.11),transparent_28%),radial-gradient(circle_at_100%_8%,rgba(124,204,247,0.12),transparent_24%),linear-gradient(180deg,#f5f7fc_0%,#fcfcff_46%,#f4f9ff_100%)]",
      "[--color-bg-strong:#f7f8fc]",
      "[--color-surface:rgba(255,255,255,0.94)]",
      "[--color-surface-strong:rgba(250,248,255,0.98)]",
      "[--color-background:#f7f8fc]",
      "[--color-line:rgba(196,202,224,0.74)]",
      "[--color-text:#202745]",
      "[--color-muted:#6d7590]",
      "[--color-accent:#7ec8ef]",
      "[--color-accent-soft:rgba(126,200,239,0.16)]",
      "[--shadow-surface:0_22px_54px_rgba(186,193,221,0.18)]",
      "[--storefront-accent:#7ec8ef]"
    ].join(" ");
  }

  // Public routes carry the more editorial collectible-launch expression.
  return [
    "[--color-bg:radial-gradient(circle_at_10%_10%,rgba(165,143,255,0.18),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(124,204,247,0.16),transparent_24%),radial-gradient(circle_at_46%_100%,rgba(143,218,198,0.14),transparent_28%),linear-gradient(180deg,#fffdf9_0%,#fbf6ff_36%,#f6fbff_100%)]",
    "[--color-bg-strong:#ffffff]",
    "[--color-surface:rgba(255,255,255,0.92)]",
    "[--color-surface-strong:rgba(255,251,255,0.97)]",
    "[--color-background:#fcf8ff]",
    "[--color-line:rgba(214,219,236,0.78)]",
    "[--color-text:#1f2540]",
    "[--color-muted:#737a93]",
    "[--color-accent:#a58fff]",
    "[--color-accent-soft:rgba(165,143,255,0.14)]",
    "[--shadow-surface:0_28px_76px_rgba(194,200,228,0.2)]",
    "[--storefront-accent:#a58fff]"
  ].join(" ");
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const shellMode = getShellMode(pathname);

  return (
    <div
      className={cn(
        "min-h-screen px-3 pb-8 pt-5 text-[color:var(--color-text)] md:px-4 md:pt-6",
        getModeThemeClassName(shellMode),
        shellMode === "app"
          ? "bg-[color:var(--color-bg-strong)]"
          : "bg-[color:var(--color-bg)]"
      )}
      data-shell-mode={shellMode}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(165,143,255,0.14),transparent_58%)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-64 bg-[radial-gradient(circle_at_bottom,rgba(124,204,247,0.1),transparent_60%)]" />
      <div className="mx-auto w-full max-w-cinematic space-y-6">
        <div className="rounded-[2.4rem] border border-white/60 bg-white/36 px-1.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          {children}
        </div>
      </div>
    </div>
  );
}
