import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', tranform: 'none' },
        },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out-both',
      },
      colors: {
        brand: {
          blue: "#0045d7",
          cyan: "#00e3fe",
          orange: "#fb9216",
          gradientStart: "#0045d7",
          gradientEnd: "#00e3fe"
        }
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #0045d7 0%, #00e3fe 100%)"
      },
      borderRadius: {
        "2xl": "1rem"
      }
    },
    fontFamily: {
      sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      accent: ["var(--font-candara)", "ui-sans-serif", "system-ui"]
    }
  },
  plugins: [],
};
export default {
  config,
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [typography],
}



