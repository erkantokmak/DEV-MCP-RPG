/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#3fff14",
        "secondary": "#00e5ff",
        "destructive": "#ff00cc",
        "legendary": "#ffaa00",
        "gold": "#ffd700",
        "silver": "#c0c0c0",
        "bronze": "#cd7f32",
        "background-light": "#f1f2f4",
        "background-dark": "#0f1115",
        "surface-dark": "#161b22",
        "surface-highlight": "#1f2937",
        "surface-accent": "#2a3a27",
        "rarity-common": "#9ca3af",
        "rarity-rare": "#00e5ff",
        "rarity-epic": "#ff00cc",
        "rarity-legendary": "#ffaa00",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "mono": ["Space Grotesk", "monospace"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      boxShadow: {
        "neon": "0 0 5px #3fff14, 0 0 20px rgba(63, 255, 20, 0.3)",
        "neon-secondary": "0 0 5px #00e5ff, 0 0 20px rgba(0, 229, 255, 0.3)",
        "neon-destructive": "0 0 5px #ff00cc, 0 0 20px rgba(255, 0, 204, 0.3)",
        "neon-legendary": "0 0 5px #ffaa00, 0 0 20px rgba(255, 170, 0, 0.3)",
        "neon-gold": "0 0 5px #ffd700, 0 0 20px rgba(255, 215, 0, 0.3)",
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(#3fff14 1px, transparent 1px)",
        "hex-pattern": "radial-gradient(#1f2937 15%, transparent 16%), radial-gradient(#1f2937 15%, transparent 16%)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "blink": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
