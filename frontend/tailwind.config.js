/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          dark: '#0f1923',
          panel: '#1a2632',
          steel: '#2d3f50',
          accent: '#f59e0b',
          danger: '#ef4444',
          safe: '#22c55e',
          neutral: '#64748b',
        }
      }
    },
  },
  plugins: [],
}