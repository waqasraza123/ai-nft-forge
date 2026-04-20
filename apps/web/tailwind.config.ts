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
          night: "#060816",
          midnight: "#0b1020",
          panel: "#10182b",
          panelStrong: "#141f36",
          line: "#27324d",
          ink: "#f7f9ff",
          muted: "#9cabc7",
          accent: "#8b5cf6",
          cyan: "#67e8f9",
          silver: "#dbe7ff",
          rose: "#f472b6"
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
        glass: "0 28px 90px rgba(6, 10, 24, 0.34)",
        panel: "0 24px 72px rgba(4, 8, 20, 0.42)",
        launch:
          "0 18px 48px rgba(15, 23, 42, 0.36), inset 0 1px 0 rgba(255,255,255,0.08)",
        chrome:
          "0 34px 120px rgba(2, 6, 23, 0.52), inset 0 1px 0 rgba(255,255,255,0.08)"
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
