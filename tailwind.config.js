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
        success: withVar('--success'),
        warning: withVar('--warning'),
        danger: withVar('--danger'),
        info: withVar('--info'),
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        overline: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'elev-1': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'elev-2': '0 12px 32px -12px rgb(0 0 0 / 0.65)',
        'glow-primary': '0 0 0 1px rgb(var(--primary) / 0.35), 0 10px 34px -8px rgb(var(--primary) / 0.30)',
        'glow-secondary': '0 0 0 1px rgb(var(--secondary) / 0.35), 0 10px 34px -8px rgb(var(--secondary) / 0.30)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'rise-in': 'rise-in 0.28s cubic-bezier(0.22,1,0.36,1)',
        'scale-in': 'scale-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
