import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { accent: '#7c5cff' },
    },
  },
  plugins: [],
} satisfies Config;
