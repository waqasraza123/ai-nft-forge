import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx,js,jsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ui: "#f3efe4",
          ink: "#152026",
          muted: "#55656b",
          accent: "#8b5e34",
          accentSoft: "rgba(139, 94, 52, 0.12)",
          surface: "rgba(255, 255, 255, 0.72)",
          surfaceStrong: "rgba(255, 255, 255, 0.88)",
          line: "rgba(19, 28, 33, 0.12)"
        }
      },
      fontFamily: {
        ui: ["var(--font-ui)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 24px 80px rgba(22, 31, 35, 0.08)",
        panel: "0 20px 70px rgba(22, 31, 35, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
