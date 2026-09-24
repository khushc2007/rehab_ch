import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      colors: {
        rehab: {
          teal: "#0F6E5E",
          background: "#0a0a0a",
          panel: "#111111",
          card: "#161616",
          border: "#1f1f1f"
        }
      }
    }
  },
  plugins: []
};

export default config;
