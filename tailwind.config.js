/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f7f0",
          100: "#d9eed9",
          200: "#b3ddb3",
          300: "#7fc47f",
          400: "#4fa84f",
          500: "#2d8a3e",
          600: "#1e6b2e",
          700: "#165222",
          800: "#0f3a18",
          900: "#0a2610",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
