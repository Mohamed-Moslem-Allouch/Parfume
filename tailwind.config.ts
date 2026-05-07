import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#000000",
        obsidian: "#0A0A0A",
        charcoal: "#141414",
        foreground: "#F5F5F5",
        gold: {
          DEFAULT: "#D4AF37",
          soft: "#F8E08E",
          deep: "#8A6A13"
        },
        mist: "#F5F5F5",
        muted: "#9CA3AF",
        glass: {
          light: "rgba(255, 255, 255, 0.05)",
          base: "rgba(255, 255, 255, 0.08)",
          heavy: "rgba(255, 255, 255, 0.12)",
          dark: "rgba(0, 0, 0, 0.4)",
          stroke: "rgba(255, 255, 255, 0.1)"
        }
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"]
      },
      boxShadow: {
        gold: "0 10px 40px -10px rgba(212, 175, 55, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-inner": "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
        "gold-strong": "0 0 55px rgba(212, 175, 55, 0.28)",
        "edge-glow": "0 0 15px rgba(212, 175, 55, 0.15)",
        "glass-elevated": "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)"
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F8E08E 0%, #D4AF37 44%, #8A6A13 100%)",
        "liquid-glass": "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
        "refraction": "linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 60%)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(212, 175, 55, 0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        "badge-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" }
        },
        "refract": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 200%" }
        }
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "badge-glow": "badge-glow 2s ease-in-out infinite",
        "refraction": "refract 8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
