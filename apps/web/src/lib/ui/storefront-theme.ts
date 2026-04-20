import type { CSSProperties } from "react";

import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

export type StorefrontThemeStyle = CSSProperties;

const storefrontThemeClassMap: Record<
  CollectionPublicBrandTheme["themePreset"],
  string
> = {
  editorial_warm: [
    "[--storefront-bg:radial-gradient(circle_at_16%_12%,rgba(249,115,22,0.16),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.12),transparent_22%),linear-gradient(180deg,#070811_0%,#0c101c_44%,#121827_100%)]",
    "[--storefront-panel:rgba(11,15,26,0.8)]",
    "[--storefront-panel-strong:rgba(17,22,36,0.92)]",
    "[--storefront-text:#f8fbff]",
    "[--storefront-muted:#b8c0d4]",
    "[--storefront-border:rgba(154,169,196,0.18)]"
  ].join(" "),
  gallery_mono: [
    "[--storefront-bg:radial-gradient(circle_at_18%_8%,rgba(148,163,184,0.12),transparent_22%),radial-gradient(circle_at_82%_12%,rgba(103,232,249,0.1),transparent_20%),linear-gradient(180deg,#060812_0%,#0a0f1b_42%,#121926_100%)]",
    "[--storefront-panel:rgba(10,15,26,0.78)]",
    "[--storefront-panel-strong:rgba(16,22,35,0.9)]",
    "[--storefront-text:#f8fbff]",
    "[--storefront-muted:#b2bdcf]",
    "[--storefront-border:rgba(167,179,201,0.18)]"
  ].join(" "),
  midnight_launch: [
    "[--storefront-bg:radial-gradient(circle_at_15%_8%,rgba(139,92,246,0.18),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,#050713_0%,#090e1b_36%,#0d1424_100%)]",
    "[--storefront-panel:rgba(10,16,29,0.8)]",
    "[--storefront-panel-strong:rgba(16,23,39,0.92)]",
    "[--storefront-text:#f8fbff]",
    "[--storefront-muted:#aebbd3]",
    "[--storefront-border:rgba(148,163,184,0.18)]"
  ].join(" ")
};

export function resolveStorefrontThemeClasses(
  theme: CollectionPublicBrandTheme
) {
  return storefrontThemeClassMap[theme.themePreset];
}

export function createStorefrontThemeStyle(
  theme: CollectionPublicBrandTheme
): StorefrontThemeStyle {
  return {
    // Presets resolve through Tailwind classes. The inline style bridge is
    // reserved for persisted arbitrary brand accents that cannot be known at
    // build time.
    "--storefront-accent": theme.accentColor
  } as StorefrontThemeStyle;
}
