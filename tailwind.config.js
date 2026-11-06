/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0f4f78", light: "#1a6b9e", dark: "#0a3a5a" },
        accent: { DEFAULT: "#2f8ff5", light: "#5aabff", dark: "#1a6fc4" },
        surface: { DEFAULT: "#e3eaf2", dark: "#d0dde9" },
        card: { DEFAULT: "#ffffff" },
        content: { DEFAULT: "#0e1e33", muted: "#5b7b9a" },
        border: { DEFAULT: "#c8d8e8" },
        danger: { DEFAULT: "#dc2626" },
        success: { DEFAULT: "#16a34a" },
        warning: { DEFAULT: "#d97706" },
      },
      fontFamily: { amiri: ["Amiri", "serif"] },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
    },
  },
  plugins: [],
};
