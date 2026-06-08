import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 브랜드 강조색은 여기 한 곳에서만 관리. 바꾸려면 이 값만 수정.
      colors: {
        accent: { DEFAULT: '#2563eb', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
      },
    },
  },
  plugins: [],
} satisfies Config;
