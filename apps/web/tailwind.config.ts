import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marino: {
          950: '#050b16',
          900: '#0a1224',
          800: '#101c33',
          700: '#182848',
          600: '#22375f',
          500: '#2f4a7a',
          300: '#8ca0c4',
          200: '#b7c6de',
        },
        turquesa: {
          300: '#7deede',
          400: '#3fe0d0',
          500: '#1fc7b6',
          600: '#12a396',
        },
        grafito: {
          100: '#eef1f6',
          200: '#dbe1ea',
          300: '#b7c1d1',
          400: '#8b96aa',
          500: '#5c6780',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(5, 11, 22, 0.06), 0 8px 24px -12px rgba(5, 11, 22, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
