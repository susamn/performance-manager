/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'player-bg': '#1a1a1a',
        'player-accent': '#00ff41',
        'card-bg': '#2a2a2a',
        'card-selected': '#3a3a3a'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}