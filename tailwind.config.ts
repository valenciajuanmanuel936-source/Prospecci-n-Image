import type { Config } from "tailwindcss";

// Identidad visual propia de IMAGE: grafito cálido + ámbar/dorado.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grafito cálido (color principal)
        carbon: {
          50: "#f6f5f3",
          100: "#e8e6e1",
          200: "#d2cec6",
          300: "#b1aaa0",
          400: "#8a8177",
          500: "#6f665d",
          600: "#585049",
          700: "#47413b",
          800: "#332e2a",
          900: "#221f1c",
          950: "#141210",
        },
        // Ámbar / dorado (acento de transformación)
        ambar: {
          50: "#fdf8ee",
          100: "#f9edd0",
          200: "#f2d79c",
          300: "#eabc63",
          400: "#e3a23a",
          500: "#d4870f",
          600: "#b96b0a",
          700: "#994f0d",
          800: "#7d3f11",
          900: "#673511",
        },
        // Jade (acento secundario para estados positivos)
        jade: {
          100: "#d5f2e3",
          500: "#12a06a",
          600: "#0d8557",
        },
        crema: "#faf8f4",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        suave: "0 4px 22px -4px rgba(20, 18, 16, 0.12)",
        tarjeta: "0 2px 12px -2px rgba(20, 18, 16, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
