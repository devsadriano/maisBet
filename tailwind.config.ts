import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './shared/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        bebas: ['Bebas Neue', 'ui-sans-serif'],
      },
      fontSize: {
        'xs':  ['0.8125rem', { lineHeight: '1.125rem' }],   // 13px (era 12px)
        'sm':  ['0.9375rem', { lineHeight: '1.375rem' }],   // 15px (era 14px)
        'base': ['1.0625rem', { lineHeight: '1.625rem' }],  // 17px (era 16px)
      },
      colors: {
        // ── Cores temáticas via CSS Tokens ──────────────────────────
        // Usar estas em componentes para suporte automático dark/light
        'brand': {
          DEFAULT: 'var(--brand)',
          light:   'var(--brand-light)',
          dim:     'var(--brand-dim)',
          glow:    'var(--brand-glow)',
          // Escala numérica verde (substitui o antigo azul)
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'theme': {
          base:      'var(--bg-base)',
          surface:   'var(--bg-surface)',
          'surface-2': 'var(--bg-surface-2)',
          'surface-3': 'var(--bg-surface-3)',
          text:      'var(--text-primary)',
          muted:     'var(--text-muted)',
          subtle:    'var(--text-subtle)',
          border:    'var(--border)',
        },

        // ── Cores fixas (safe para os dois modos) ───────────────────
        pitch: {
          50:  '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#114024',
          900: '#14532d',
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      backgroundImage: {
        'gradient-pitch':  'linear-gradient(135deg, #0c4a6e 0%, #14532d 100%)',
        'gradient-card':   'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        'gradient-dark':   'linear-gradient(135deg, #0d0d0d 0%, #161616 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 20px var(--brand-glow)',
        'glow-gold':  '0 0 20px rgba(250, 204, 21, 0.35)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-light': '0 4px 24px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'countdown':  'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in':    'fadeIn 0.35s ease-out forwards',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config
