import type { CSSProperties } from "react";

import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

export type StorefrontThemeStyle = CSSProperties;

const storefrontThemeClassMap: Record<
  CollectionPublicBrandTheme["themePreset"],
  string
> = {
  editorial_warm: [
    "[--storefront-bg:radial-gradient(circle_at_14%_12%,rgba(244,161,136,0.18),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(165,143,255,0.14),transparent_22%),linear-gradient(180deg,#fffaf1_0%,#fcf5ff_42%,#f7fbff_100%)]",
    "[--storefront-panel:rgba(255,255,255,0.9)]",
    "[--storefront-panel-strong:rgba(255,249,244,0.96)]",
    "[--storefront-text:#222845]",
    "[--storefront-muted:#757d95]",
    "[--storefront-border:rgba(214,216,228,0.78)]"
  ].join(" "),
  gallery_mono: [
    "[--storefront-bg:radial-gradient(circle_at_18%_8%,rgba(193,199,216,0.16),transparent_22%),radial-gradient(circle_at_82%_12%,rgba(145,221,251,0.12),transparent_20%),linear-gradient(180deg,#fbfbfd_0%,#f6f7fb_42%,#f4f9ff_100%)]",
    "[--storefront-panel:rgba(255,255,255,0.92)]",
    "[--storefront-panel-strong:rgba(248,249,252,0.98)]",
    "[--storefront-text:#232a43]",
    "[--storefront-muted:#747e94]",
    "[--storefront-border:rgba(210,216,230,0.78)]"
  ].join(" "),
  midnight_launch: [
    "[--storefront-bg:radial-gradient(circle_at_15%_8%,rgba(165,143,255,0.2),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(124,204,247,0.14),transparent_22%),linear-gradient(180deg,#fbf7ff_0%,#f6f7ff_36%,#f3faff_100%)]",
    "[--storefront-panel:rgba(255,255,255,0.9)]",
    "[--storefront-panel-strong:rgba(248,246,255,0.97)]",
    "[--storefront-text:#202744]",
    "[--storefront-muted:#727b95]",
    "[--storefront-border:rgba(209,214,232,0.82)]"
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
