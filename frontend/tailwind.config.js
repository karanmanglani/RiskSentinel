/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desco: {
          900: '#0f172a', // Deep background
          800: '#1e293b', // Panel background
          accent: '#3b82f6', // Desco Blue
        }
      }
    },
  },
  plugins: [],
}