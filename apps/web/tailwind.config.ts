import type { Config } from 'tailwindcss';

// Design tokens — design_handoff_7market_app/README.md
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08132C',
        navy: '#0B2149',
        'navy-deep': '#0d2a5e',
        'navy-darkest': '#070f22',
        gold: { DEFAULT: '#C99A2E', light: '#F4D48A' },
        'ai-blue': '#8FB4FF',
        'status-green': '#5ee08a',
        'status-amber': '#F4A24A',
        'status-red': '#F4776A',
        text: { DEFAULT: '#e8eef7', secondary: '#8ea0bc', tertiary: '#b6c4db', muted: '#6b82a6' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '22px',
        'card-sm': '16px',
        chip: '13px',
        nav: '13px',
      },
      keyframes: {
        msgin: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        ovin: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        msgin: 'msgin .2s ease',
        ovin: 'ovin .28s ease',
      },
      screens: {
        desktop: '760px',
        wide: '1180px',
      },
    },
  },
  plugins: [],
} satisfies Config;
