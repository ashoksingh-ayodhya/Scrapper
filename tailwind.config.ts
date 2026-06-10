import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    {
      pattern: /(text|bg|border)-(plasma|solar|acid|magenta|violet|gold)/,
      variants: ["hover"],
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        plasma: "hsl(186 100% 60%)",
        solar: "hsl(24 100% 58%)",
        acid: "hsl(140 85% 55%)",
        magenta: "hsl(320 95% 62%)",
        violet: "hsl(270 90% 68%)",
        gold: "hsl(42 95% 60%)",
        background: "hsl(230 40% 3%)",
        foreground: "hsl(40 30% 92%)",
        card: "hsl(230 40% 5%)",
        border: "hsl(230 30% 14%)",
      },
      animation: {
        "orbit-slow": "orbit 28s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
      },
      keyframes: {
        orbit: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "pulse-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 12px hsl(var(--plasma) / 0.6))" },
          "50%": { filter: "drop-shadow(0 0 28px hsl(var(--plasma) / 0.95))" },
        },
        twinkle: { "0%, 100%": { opacity: "0.25" }, "50%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
