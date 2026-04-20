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
    // The private shell uses one operator-grade palette across Studio and Ops.
    return [
      "[--color-bg:#060816]",
      "[--color-bg-strong:#090d19]",
      "[--color-surface:rgba(8,14,28,0.82)]",
      "[--color-surface-strong:rgba(17,24,42,0.96)]",
      "[--color-background:#080d18]",
      "[--color-line:rgba(154,168,197,0.16)]",
      "[--color-text:#f8fbff]",
      "[--color-muted:#8fa2c4]",
      "[--color-accent:#67e8f9]",
      "[--color-accent-soft:rgba(103,232,249,0.14)]",
      "[--shadow-surface:0_30px_90px_rgba(2,6,23,0.48)]",
      "[--storefront-accent:#67e8f9]"
    ].join(" ");
  }

  // Public marketing and launch surfaces keep a more cinematic accent profile
  // while still flowing through the same Tailwind-driven variable contract.
  return [
    "[--color-bg:radial-gradient(circle_at_12%_10%,rgba(139,92,246,0.16),transparent_24%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,0.14),transparent_22%),linear-gradient(180deg,#050713_0%,#0a0f1e_38%,#0d1424_100%)]",
    "[--color-bg-strong:#0b1020]",
    "[--color-surface:rgba(10,16,30,0.74)]",
    "[--color-surface-strong:rgba(17,24,42,0.92)]",
    "[--color-background:#080c18]",
    "[--color-line:rgba(160,174,205,0.14)]",
    "[--color-text:#f8fbff]",
    "[--color-muted:#a9b6d0]",
    "[--color-accent:#8b5cf6]",
    "[--color-accent-soft:rgba(139,92,246,0.16)]",
    "[--shadow-surface:0_34px_110px_rgba(2,6,23,0.52)]",
    "[--storefront-accent:#8b5cf6]"
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
      <div className="mx-auto w-full max-w-cinematic space-y-6">{children}</div>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_55%)]" />
    </div>
  );
}
