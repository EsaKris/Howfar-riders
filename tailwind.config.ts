import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hfc: {
          black:  "#09090F",
          dark:   "#111118",
          card:   "#16161F",
          border: "#222230",
          lime:   "#C8F53F",
          orange: "#FF6B2C",
          muted:  "#6B6B82",
          light:  "#E8E8F0",
          red:    "#FF4444",
          green:  "#22C55E",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body:    ["var(--font-jakarta)", "sans-serif"],
      },
      animation: {
        "spin-slow":  "spin 3s linear infinite",
        "fade-up":    "fadeUp 0.4s ease forwards",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "slide-up":   "slideUp 0.4s ease forwards",
        "ping-slow":  "ping 2s cubic-bezier(0,0,0.2,1) infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(100%)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
