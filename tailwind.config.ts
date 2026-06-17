import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta dashboard deportivo premium, dark mode primero.
        base: {
          950: "#070b14",
          900: "#0b1120",
          850: "#0f1729",
          800: "#141d33",
          700: "#1e293f",
          600: "#2a3a55",
        },
        edge: {
          pos: "#22c55e",
          mid: "#f59e0b",
          neg: "#ef4444",
        },
        brand: {
          DEFAULT: "#16a34a",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        glow: "0 0 0 1px rgba(34,197,94,0.25), 0 4px 20px rgba(34,197,94,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
