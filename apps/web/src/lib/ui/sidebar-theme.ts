import type { CSSProperties } from "react";

export const sidebarThemeStorageKey = "ai-nft-forge-internal-sidebar-theme";

export const internalSidebarThemes = [
  "obsidian-amber",
  "graphite-cyan",
  "midnight-violet",
  "forest-mint",
  "ember-rose"
] as const;

export type SidebarThemeId = (typeof internalSidebarThemes)[number];

export const defaultSidebarTheme: SidebarThemeId = "obsidian-amber";

export type SidebarThemePalette = {
  accent: string;
  accentInk: string;
  bg: string;
  border: string;
  focus: string;
  muted: string;
  surface: string;
  surface2: string;
};

const themeMap: Record<SidebarThemeId, SidebarThemePalette> = {
  "obsidian-amber": {
    bg: "#111827",
    accent: "#f59e0b",
    accentInk: "#111827",
    border: "rgba(245, 158, 11, 0.35)",
    focus: "rgba(245, 158, 11, 0.55)",
    muted: "#9ca3af",
    surface: "#111827",
    surface2: "#1f2937"
  },
  "graphite-cyan": {
    bg: "#0f172a",
    accent: "#22d3ee",
    accentInk: "#0f172a",
    border: "rgba(34, 211, 238, 0.32)",
    focus: "rgba(34, 211, 238, 0.55)",
    muted: "#94a3b8",
    surface: "#0b1222",
    surface2: "#111f37"
  },
  "midnight-violet": {
    bg: "#111827",
    accent: "#8b5cf6",
    accentInk: "#f8fafc",
    border: "rgba(139, 92, 246, 0.35)",
    focus: "rgba(139, 92, 246, 0.55)",
    muted: "#a78bfa",
    surface: "#0e1529",
    surface2: "#171f38"
  },
  "forest-mint": {
    bg: "#0b1f1a",
    accent: "#2dd4bf",
    accentInk: "#f5fffb",
    border: "rgba(45, 212, 191, 0.32)",
    focus: "rgba(45, 212, 191, 0.5)",
    muted: "#7ddfc7",
    surface: "#092720",
    surface2: "#0f342e"
  },
  "ember-rose": {
    bg: "#1b1117",
    accent: "#fb7185",
    accentInk: "#1b1117",
    border: "rgba(251, 113, 133, 0.34)",
    focus: "rgba(251, 113, 133, 0.55)",
    muted: "#fda4af",
    surface: "#25111b",
    surface2: "#331827"
  }
};

export function isSidebarTheme(value: string | null): value is SidebarThemeId {
  return (internalSidebarThemes as readonly string[]).includes(value ?? "");
}

export function parseSidebarTheme(value: string | null): SidebarThemeId {
  return isSidebarTheme(value) ? value : defaultSidebarTheme;
}

export function buildSidebarThemeVars(theme: SidebarThemeId): CSSProperties {
  const palette = themeMap[theme];

  return {
    "--app-sidebar-bg": palette.bg,
    "--app-sidebar-ink": "#f8fafc",
    "--app-sidebar-muted": palette.muted,
    "--app-sidebar-border": palette.border,
    "--app-accent": palette.accent,
    "--app-accent-ink": palette.accentInk,
    "--app-surface": palette.surface,
    "--app-surface-2": palette.surface2,
    "--app-focus": palette.focus
  } as CSSProperties;
}
