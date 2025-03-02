/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"], // ✅ Ensure this is correct
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Replace 'Poppins' with your font
      },
    },
  },
  plugins: [],
};
