/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#007CC3",
          dark: "#006BA8",
          navy: "#0B2545",
        },
      },
    },
  },
  plugins: [],
};
