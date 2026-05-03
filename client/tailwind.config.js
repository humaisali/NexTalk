/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── NexTalk Brand ──────────────────────────────────
        primary:   '#FFEFB2',   // warm cream yellow
        'primary-dark':  '#F5DC6E',
        'primary-light': '#FFFBEA',
        secondary: '#013E37',   // deep forest teal
        'secondary-light': '#024D44',
        'secondary-dark':  '#012B26',

        // ── UI surfaces (teal-based dark theme) ────────────
        'nt-bg':       '#011F1B',   // deepest bg
        'nt-surface':  '#012B26',   // panels
        'nt-surface2': '#013E37',   // elevated cards
        'nt-surface3': '#024D44',   // hover states
        'nt-border':   '#025A50',   // borders
        'nt-border2':  '#037066',   // stronger borders

        // ── Text ──────────────────────────────────────────
        'nt-text':     '#FFEFB2',   // primary text = brand cream
        'nt-text2':    '#D4C98A',   // secondary text
        'nt-muted':    '#7A9E99',   // muted/placeholder

        // ── Accent / status ───────────────────────────────
        'nt-accent':   '#FFEFB2',   // same as primary
        'nt-success':  '#4ADE80',
        'nt-warning':  '#FCD34D',
        'nt-danger':   '#F87171',
        'nt-info':     '#60D4C8',   // teal highlight
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'nt-glow': '0 0 40px rgba(255, 239, 178, 0.08)',
        'nt-card': '0 4px 24px rgba(0,0,0,0.3)',
        'nt-float': '0 8px 40px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        'nt': '12px',
        'nt-lg': '16px',
        'nt-xl': '20px',
      }
    }
  },
  plugins: []
};
