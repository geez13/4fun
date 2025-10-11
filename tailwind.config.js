/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // Bright green brand colors
        binance: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          primary: '#00FF41',
          secondary: '#000000',
          yellow: '#00FF41',
          black: '#000000',
          accent: '#00FF88',
          dark: '#1a1a1a',
        },
        // Dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backgroundImage: {
        'binance-gradient': 'linear-gradient(135deg, #00FF41 0%, #000000 100%)',
        'binance-accent-gradient': 'linear-gradient(135deg, #00FF88 0%, #00FF41 100%)',
        'dark-gradient': 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)',
      }
    },
  },
  plugins: [],
};
