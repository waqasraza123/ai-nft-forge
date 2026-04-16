"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@ai-nft-forge/ui";
import { isAppRoute } from "../lib/navigation";
import { SidebarThemeProvider } from "./sidebar-theme-context";

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

function getModeTheme(mode: SiteShellMode): CSSProperties {
  if (mode === "app") {
    return {
      "--color-bg": "#0b1120",
      "--color-bg-strong": "#0c1425",
      "--color-surface": "rgba(17, 24, 39, 0.72)",
      "--color-surface-strong": "rgba(30, 41, 59, 0.86)",
      "--color-line": "rgba(148, 163, 184, 0.2)",
      "--color-text": "#f8fafc",
      "--color-muted": "#94a3b8",
      "--color-accent": "#38bdf8",
      "--color-accent-soft": "rgba(56, 189, 248, 0.16)",
      "--shadow-surface":
        "0 24px 70px rgba(2, 6, 23, 0.35)"
    } as CSSProperties;
  }

  return {
    "--color-bg":
      "radial-gradient(circle at 5% 10%, rgba(139, 92, 246, 0.08), transparent 34%), radial-gradient(circle at 95% 0%, rgba(45, 212, 191, 0.1), transparent 36%), linear-gradient(180deg, #faf8f2 0%, #f1ede1 100%)",
    "--color-bg-strong": "#efe8d9",
    "--color-surface": "rgba(255, 255, 255, 0.72)",
    "--color-surface-strong": "rgba(255, 255, 255, 0.9)",
    "--color-line": "rgba(19, 28, 33, 0.14)",
    "--color-text": "#152026",
    "--color-muted": "#5d6d74",
    "--color-accent": "#8b5e34",
    "--color-accent-soft": "rgba(139, 94, 52, 0.12)",
    "--shadow-surface":
      "0 24px 80px rgba(22, 31, 35, 0.08)"
  } as CSSProperties;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const shellMode = getShellMode(pathname);
  const shellStyle = useMemo(() => getModeTheme(shellMode), [shellMode]);

  const shell = (
    <div
      className={cn(
        "min-h-screen px-3 pb-8 pt-6 text-[color:var(--color-text)]",
        shellMode === "app" ? "bg-[color:var(--color-bg-strong)]" : "bg-[color:var(--color-bg)]"
      )}
      data-shell-mode={shellMode}
      style={shellStyle}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
    </div>
  );

  if (shellMode === "app") {
    return <SidebarThemeProvider>{shell}</SidebarThemeProvider>;
  }

  return shell;
}
