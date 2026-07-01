/** @type {import('tailwindcss').Config} */
// Tokens are CSS variables (space-separated RGB) so the light/dark theme can swap them.
const withVar = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: withVar('--bg'),
        surface: withVar('--surface'),
        'surface-2': withVar('--surface-2'),
        border: withVar('--border'),
        'border-strong': withVar('--border-strong'),
        text: withVar('--text'),
        muted: withVar('--muted'),
        dim: withVar('--dim'),
        primary: withVar('--primary'),
        'primary-fg': withVar('--primary-fg'),
        secondary: withVar('--secondary'),
        'secondary-fg': withVar('--secondary-fg'),
        success: withVar('--success'),
        warning: withVar('--warning'),
        danger: withVar('--danger'),
        info: withVar('--info'),
      },
      fontFamily: {
        // Editorial light serif for display, Inter for UI, mono for labels/metrics.
        display: ['Fraunces', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        overline: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.16em' }],
        // Fluid editorial display scale
        'display-sm': ['clamp(1.9rem, 4vw, 2.6rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        display: ['clamp(2.6rem, 6.5vw, 4.25rem)', { lineHeight: '1.0', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(3.25rem, 10vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        // Crisp, technical — not bubbly.
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.375rem',
      },
      boxShadow: {
        // Warm, low-contrast elevation — no neon glow.
        'elev-1': '0 1px 2px rgb(19 15 12 / 0.04), 0 1px 3px rgb(19 15 12 / 0.03)',
        'elev-2': '0 2px 6px rgb(19 15 12 / 0.05), 0 16px 34px -18px rgb(19 15 12 / 0.22)',
        'elev-3': '0 30px 60px -24px rgb(19 15 12 / 0.30)',
      },
      transitionTimingFunction: {
        // House easing (easeOutQuint-ish) — everything settles, nothing bounces.
        quint: 'cubic-bezier(.22,1,.36,1)',
        'in-out-cubic': 'cubic-bezier(.65,0,.35,1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        blink: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(.22,1,.36,1)',
        'rise-in': 'rise-in 0.5s cubic-bezier(.22,1,.36,1)',
        'scale-in': 'scale-in 0.35s cubic-bezier(.22,1,.36,1)',
        blink: 'blink 1s step-end infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
