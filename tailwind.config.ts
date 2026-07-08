import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#030712",
        ink: "#050816",
        panel: "rgba(8, 15, 32, 0.76)",
        line: "rgba(96, 165, 250, 0.18)",
        ritual: {
          black: "#000000",
          elevated: "#111827",
          surface: "#1F2937",
          green: "#19D184",
          lime: "#BFFF00",
          pink: "#FF1DCE",
          gold: "#FACC15",
          blue: "#3B82F6",
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          purple: "#A855F7",
        },
      },
      fontFamily: {
        body: ["Barlow", "Inter", "system-ui", "sans-serif"],
        display: ["Archivo", "Barlow", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "neon-blue": "0 0 32px rgba(59, 130, 246, 0.28)",
        "neon-violet": "0 0 40px rgba(139, 92, 246, 0.32)",
        "neon-green": "0 0 24px rgba(25, 209, 132, 0.25)",
        glass: "0 20px 70px rgba(0, 0, 0, 0.38)",
      },
      backgroundImage: {
        "holo-line": "linear-gradient(90deg, transparent, rgba(34, 211, 238, .7), transparent)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        pulseCore: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.92" },
          "50%": { transform: "scale(1.035)", opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        wave: {
          "0%": { transform: "translateX(-40%)" },
          "100%": { transform: "translateX(0%)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 22px rgba(59, 130, 246, .35)" },
          "50%": { boxShadow: "0 0 38px rgba(168, 85, 247, .58)" },
        },
        flow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-core": "pulseCore 5s ease-in-out infinite",
        orbit: "orbit 22s linear infinite",
        wave: "wave 2.4s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        flow: "flow 2.2s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
