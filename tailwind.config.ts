import type { Config } from "tailwindcss";

// Identidad Aldore: papel cálido, tinta casi negra y un solo color de acento (bermellón).
const signal = {
  50: "#fdf1ec", 100: "#fbe0d5", 200: "#f6bfa9", 300: "#ef9673", 400: "#e86a42",
  500: "#e2471c", 600: "#c63b14", 700: "#a32f11", 800: "#842914", 900: "#6c2414", 950: "#3b0f07",
};

/** Color que sale de una variable CSS (con su valor normal de respaldo) y acepta opacidad: bg-white/80. */
const v = (name: string, rgb: string) => `rgb(var(--${name}, ${rgb}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: signal,
        accent: { 400: signal[400], 500: signal[500], 600: signal[600] },
        paper: { DEFAULT: "#f4f1ea", 2: "#ebe6db", line: "#d9d2c3" },
        ink: { 900: "#16130f", 800: "#221e19", 700: "#3a342c", 500: "#6b6358", 400: "#8f8679" },
      },
      // Modo oscuro del sitio: textos, fondos claros y bordes leen variables que cambia html.dark (ver globals.css).
      // Los fondos oscuros (bg-ink-900) y el texto claro (text-paper) no cambian.
      textColor: {
        ink: { 900: v("t-900", "22 19 15"), 800: v("t-800", "34 30 25"), 700: v("t-700", "58 52 44"), 500: v("t-500", "107 99 88"), 400: v("t-400", "143 134 121") },
      },
      backgroundColor: {
        paper: { DEFAULT: v("b-paper", "244 241 234"), 2: v("b-paper2", "235 230 219"), line: v("b-line", "217 210 195") },
        white: v("b-white", "255 255 255"),
      },
      borderColor: {
        paper: { line: v("b-line", "217 210 195") },
        ink: { 900: v("t-900", "22 19 15") },
      },
      fontFamily: {
        sans: ['"Geist Variable"', "system-ui", "sans-serif"],
        grotesk: ['"Space Grotesk Variable"', "system-ui", "sans-serif"],
        serif: ['"Fraunces Variable"', "Georgia", "serif"],
        castorly: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
