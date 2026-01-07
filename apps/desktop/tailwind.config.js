/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Borderlands color palette
        'bl-yellow': {
          DEFAULT: '#F5C518',
          light: '#FFE066',
          dark: '#C9A000',
        },
        'bl-orange': {
          DEFAULT: '#FF6B00',
          light: '#FF8C3A',
          dark: '#CC5500',
        },
        'bl-black': {
          DEFAULT: '#0A0A0F',
          light: '#1A1A25',
          card: '#12121A',
        },
        'bl-gray': {
          DEFAULT: '#3A3A4A',
          light: '#5A5A6A',
          dark: '#2A2A3A',
        },
        'bl-green': '#22C55E',
        'bl-red': '#EF4444',
        'bl-blue': '#3B82F6',
      },
      fontFamily: {
        'display': ['"Bebas Neue"', 'Impact', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(245, 197, 24, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.3)',
        'cel': '4px 4px 0px rgba(0, 0, 0, 0.8)',
        'cel-sm': '2px 2px 0px rgba(0, 0, 0, 0.8)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 197, 24, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 197, 24, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
