import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx,js,jsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          night: "#fcfafc",
          midnight: "#ffffff",
          pearl: "#fffdf8",
          mist: "#f2f5fb",
          panel: "#fffefe",
          panelStrong: "#f7f3ff",
          line: "#d7deef",
          ink: "#202745",
          muted: "#6f7894",
          accent: "#a58fff",
          lilac: "#cdbfff",
          sky: "#7cccf7",
          cyan: "#91ddfb",
          silver: "#eef2f8",
          rose: "#ff9a96",
          mint: "#8fdac6",
          coral: "#f4a188",
          gold: "#e4c57b"
        }
      },
      fontFamily: {
        ui: ["var(--font-ui)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"]
      },
      maxWidth: {
        cinematic: "90rem"
      },
      borderRadius: {
        cinematic: "2rem",
        launch: "1.75rem"
      },
      boxShadow: {
        glass: "0 20px 50px rgba(187, 194, 224, 0.16)",
        panel: "0 20px 52px rgba(184, 191, 221, 0.18)",
        launch:
          "0 28px 72px rgba(184, 191, 224, 0.2), inset 0 1px 0 rgba(255,255,255,0.76)",
        chrome:
          "0 34px 96px rgba(191, 198, 228, 0.24), inset 0 1px 0 rgba(255,255,255,0.84)"
      },
      blur: {
        halo: "72px"
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms"
      }
    }
  },
  plugins: []
};

export default config;
