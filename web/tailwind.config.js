/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        danex: {
          blue: '#2196F3',
          'blue-dark': '#1976D2',
          'blue-light': '#64B5F6',
          slate: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          emerald: '#10B981',
          amber: '#F59E0B',
          sky: '#38BDF8',
          violet: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
