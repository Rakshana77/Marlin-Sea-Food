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
        primary: {
          DEFAULT: '#000f22',
          container: '#0a2540',
          fixed: '#d2e4ff',
          dim: '#b0c8eb',
        },
        secondary: {
          DEFAULT: '#006a61',
          marine: '#0d9488',
          container: '#86f2e4',
          dim: '#6bd8cb',
        },
        surface: {
          DEFAULT: '#f8fafc',
          container: '#f1f5f9',
          card: '#ffffff',
          dark: '#020617',
          dim: '#e2e8f0',
        },
        brand: {
          dark: '#000f22',
          navy: '#0a2540',
          teal: '#0d9488',
          cyan: '#06b6d4',
          accent: '#14b8a6',
        },
        profit: '#059669',
        warning: '#d97706',
        error: '#ba1a1a',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
