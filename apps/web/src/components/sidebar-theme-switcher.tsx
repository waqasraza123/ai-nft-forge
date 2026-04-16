"use client";

import { useTransition } from "react";

import { ActionButton, type ActionButtonProps } from "@ai-nft-forge/ui";

import { useSidebarThemeContext } from "./sidebar-theme-context";
import type { SidebarThemeId } from "../lib/ui/sidebar-theme";

const themeMeta: Record<
  SidebarThemeId,
  {
    label: string;
    subtitle: string;
  }
> = {
  "obsidian-amber": {
    label: "Obsidian Amber",
    subtitle: "Gold accents with dark precision"
  },
  "graphite-cyan": {
    label: "Graphite Cyan",
    subtitle: "Electric cyan with restrained contrast"
  },
  "midnight-violet": {
    label: "Midnight Violet",
    subtitle: "Deep interface with premium magenta edge"
  },
  "forest-mint": {
    label: "Forest Mint",
    subtitle: "Calm high-readability command chrome"
  },
  "ember-rose": {
    label: "Ember Rose",
    subtitle: "Warm operational energy with subtle drama"
  }
};

type SidebarThemeSwitcherProps = {
  className?: string;
};

function ThemeButton({
  isActive,
  label,
  onClick,
  tone,
  value
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  tone: NonNullable<ActionButtonProps["tone"]>;
  value: string;
}) {
  return (
    <ActionButton
      className="min-w-24 justify-center px-3 py-2 text-[10px] uppercase tracking-[0.1em]"
      disabled={isActive}
      onClick={onClick}
      tone={tone}
      type="button"
    >
      {isActive ? "Active" : label}
      <span className="sr-only">{`Use ${value} sidebar theme`}</span>
    </ActionButton>
  );
}

export function SidebarThemeSwitcher({ className }: SidebarThemeSwitcherProps) {
  const { setTheme, theme, themes } = useSidebarThemeContext();
  const [, startTransition] = useTransition();

  return (
    <div
      className={className}
      role="group"
      aria-label="Internal sidebar theme chooser"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-sidebar-muted)]">
        Internal chrome
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {themes.map((entry) => (
          <button
            className="rounded-2xl border border-[color:var(--app-sidebar-border)] bg-[color:var(--app-sidebar-bg)] p-3 text-left transition hover:border-[color:var(--app-accent)]"
            key={entry}
            onClick={() => {
              startTransition(() => {
                setTheme(entry);
              });
            }}
            type="button"
          >
            <p className="mb-1 text-sm font-semibold text-[color:var(--app-sidebar-ink)]">
              {themeMeta[entry].label}
            </p>
            <p className="text-xs text-[color:var(--app-sidebar-muted)]">
              {themeMeta[entry].subtitle}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {themes.map((entry) => (
          <ThemeButton
            isActive={theme === entry}
            key={`${entry}-action`}
            label="Apply"
            onClick={() => {
              startTransition(() => {
                setTheme(entry);
              });
            }}
            tone={theme === entry ? "secondary" : "ghost"}
            value={themeMeta[entry].label}
          />
        ))}
      </div>
    </div>
  );
}
