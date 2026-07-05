import type { Config } from "tailwindcss";

// Design system: Ecosia-style (adapted for Thai content)
// white canvas · single lime accent · ink text · warm off-white cards · pills · 20px radii
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          canopy: "#d7eb80", // the single chromatic accent (primary action)
          deep: "#c7dd66", // hover state for lime fills
        },
        ink: "#333333", // primary text / borders (never pure black)
        paper: "#ffffff", // page canvas
        mist: "#f8f8f6", // soft card surface
        linen: "#f0f0eb", // warm band / tertiary surface
        stone: "#6c6c6c", // secondary text / muted
        ash: "#bebeb9", // medium borders
        silver: "#b6b6b6",
        // reserved for data-viz / status only (used sparingly)
        forest: "#2d8c3a",
        coral: "#e44b4b",
        gold: "#f5c542",
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "Sarabun",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Prompt",
          "Space Grotesk",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
      },
      boxShadow: {
        // the system's single shadow token — used only on the floating stat overlay
        xl: "rgba(0, 0, 0, 0.2) 0px 11px 33px 0px",
      },
      borderRadius: {
        "2xl": "20px", // cards / images
        "3xl": "40px",
      },
      maxWidth: {
        container: "1200px",
      },
      spacing: {
        section: "80px",
      },
    },
  },
  plugins: [],
};

export default config;
