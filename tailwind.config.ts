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
        // Paleta unificada estilo Mundial 2026 (negro/dorado, broadcast).
        // base-* se remapeó a los tonos near-black del Mundial para que TODO
        // el sitio (no solo /worldcup) comparta la misma estética.
        base: {
          950: "#07070A",
          900: "#0C0D13",
          850: "#11131A",
          800: "#181B24",
          700: "#23262F",
          600: "#313640",
        },
        edge: {
          pos: "#00A86B",
          mid: "#f59e0b",
          neg: "#E63946",
        },
        // brand-* ahora es el dorado del Mundial (antes era verde). Sustituye
        // el acento verde por dorado en navbar, links, chips y botones.
        brand: {
          DEFAULT: "#D6B15E",
          400: "#E7C77C",
          500: "#D6B15E",
          600: "#C19A4C",
        },
        // Paleta estilo Mundial 2026 (transmision deportiva premium).
        wc: {
          bg: "#07070A",
          card: "#11131A",
          card2: "#181B24",
          text: "#FFFFFF",
          muted: "#A7ADBD",
          gold: "#D6B15E",
          red: "#E63946",
          green: "#00A86B",
          blue: "#2563EB",
          purple: "#7C3AED",
          pink: "#EC4899",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        glow: "0 0 0 1px rgba(34,197,94,0.25), 0 4px 20px rgba(34,197,94,0.08)",
        // Estilo Mundial 2026.
        "wc-card": "0 10px 40px -12px rgba(0,0,0,0.7)",
        "wc-gold": "0 0 0 1px rgba(214,177,94,0.45), 0 6px 24px rgba(214,177,94,0.12)",
      },
      backgroundImage: {
        "wc-radial": "radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(37,99,235,0.14), transparent 55%)",
        "wc-gold-line": "linear-gradient(90deg, transparent, #D6B15E, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
