/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NexTalk Design System
        'nt-bg':        '#050709',
        'nt-surface':   '#0D1117',
        'nt-surface2':  '#161B22',
        'nt-border':    '#30363D',
        'nt-blue':      '#0A84FF',
        'nt-cyan':      '#00D4FF',
        'nt-text':      '#E6EDF3',
        'nt-muted':     '#8B949E',
        'nt-success':   '#3FB950',
        'nt-warning':   '#F0B849',
        'nt-danger':    '#FF6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    }
  },
  plugins: []
};
