import type { CSSProperties } from "react";
import type { CollectionPublicBrandTheme } from "@ai-nft-forge/shared";

export type StorefrontThemeStyle = CSSProperties;

const presetTokens: Record<
  CollectionPublicBrandTheme["themePreset"],
  Record<string, string>
> = {
  editorial_warm: {
    "--storefront-bg":
      "linear-gradient(180deg, rgba(255, 249, 240, 0.98) 0%, rgba(245, 236, 219, 0.96) 100%)",
    "--storefront-panel": "rgba(255, 252, 247, 0.74)",
    "--storefront-panel-strong": "rgba(255, 249, 241, 0.9)",
    "--storefront-text": "#201711",
    "--storefront-muted": "#6f5e51",
    "--storefront-border": "rgba(80, 48, 26, 0.12)"
  },
  gallery_mono: {
    "--storefront-bg":
      "linear-gradient(180deg, rgba(244, 244, 241, 0.98) 0%, rgba(228, 229, 225, 0.94) 100%)",
    "--storefront-panel": "rgba(255, 255, 255, 0.7)",
    "--storefront-panel-strong": "rgba(255, 255, 255, 0.88)",
    "--storefront-text": "#111315",
    "--storefront-muted": "#565d63",
    "--storefront-border": "rgba(17, 19, 21, 0.1)"
  },
  midnight_launch: {
    "--storefront-bg":
      "radial-gradient(circle at top left, rgba(255, 143, 78, 0.16), transparent 34%), linear-gradient(180deg, rgba(13, 18, 28, 0.98) 0%, rgba(23, 31, 48, 0.95) 100%)",
    "--storefront-panel": "rgba(14, 20, 34, 0.7)",
    "--storefront-panel-strong": "rgba(22, 29, 47, 0.84)",
    "--storefront-text": "#f3f2ed",
    "--storefront-muted": "#b5bac7",
    "--storefront-border": "rgba(243, 242, 237, 0.12)"
  }
};

export function createStorefrontThemeStyle(
  theme: CollectionPublicBrandTheme
): StorefrontThemeStyle {
  return {
    ...presetTokens[theme.themePreset],
    "--storefront-accent": theme.accentColor
  } as StorefrontThemeStyle;
}
