import type { Config } from 'tailwindcss';

// Design tokens — design_handoff_7m_advisory/README.md
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a1436',
        'navy-elevated': '#0d183f',
        'navy-icon': '#0c1a3a',
        gold: { DEFAULT: '#C99A2E', light: '#E7C871' },
        orange: '#E9611A',
        blue: '#8FB4FF',
        green: '#7bd88f',
        text: { DEFAULT: '#ffffff', secondary: '#e8eaf0', tertiary: '#aab1c2', muted: '#8891a3', dim: '#6b7488' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
