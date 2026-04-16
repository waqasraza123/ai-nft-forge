"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const shellMode = getShellMode(pathname);

  return (
    <div
      className={`site-root site-root--${shellMode}`}
      data-shell-mode={shellMode}
    >
      {children}
    </div>
  );
}
