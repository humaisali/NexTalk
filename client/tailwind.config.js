/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:        '#FFEFB2',
        'primary-dark': '#F5DC6E',
        'primary-dim':  'rgba(255,239,178,0.7)',
        'primary-faint':'rgba(255,239,178,0.08)',
        secondary:      '#013E37',
        'sec-light':    '#024D44',
        'sec-dark':     '#012B26',

        'nt-bg':       '#080E0D',
        'nt-bg1':      '#0D1A18',
        'nt-bg2':      '#0F211E',
        'nt-bg3':      '#122822',
        'nt-bg4':      '#163028',

        'nt-border':   'rgba(255,239,178,0.08)',
        'nt-border2':  'rgba(255,239,178,0.14)',
        'nt-border3':  'rgba(255,239,178,0.22)',

        'nt-text':     '#FFEFB2',
        'nt-text2':    '#D4C98A',
        'nt-muted':    '#7A9E99',
        'nt-faint':    'rgba(122,158,153,0.5)',

        'nt-teal':     '#60D4C8',
        'nt-success':  '#4ADE80',
        'nt-warning':  '#FCD34D',
        'nt-danger':   '#F87171',
        'nt-info':     '#93C5FD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'brand':    'linear-gradient(135deg, #FFEFB2 0%, #F5DC6E 50%, #E8C94A 100%)',
        'surface':  'linear-gradient(135deg, #0D1A18 0%, #0F2520 100%)',
        'teal':     'linear-gradient(135deg, #013E37 0%, #025A50 100%)',
        'mesh':     'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(2,90,80,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(255,239,178,0.04) 0%, transparent 50%)',
      },
      boxShadow: {
        'sm':    '0 2px 8px rgba(0,0,0,0.3)',
        'md':    '0 4px 20px rgba(0,0,0,0.4)',
        'lg':    '0 8px 40px rgba(0,0,0,0.5)',
        'xl':    '0 16px 60px rgba(0,0,0,0.6)',
        'cream': '0 0 40px rgba(255,239,178,0.12), 0 0 80px rgba(255,239,178,0.04)',
        'teal':  '0 0 30px rgba(2,90,80,0.3)',
        'glow':  '0 0 0 3px rgba(255,239,178,0.08)',
        'btn':   '0 4px 15px rgba(255,239,178,0.25), 0 1px 3px rgba(0,0,0,0.3)',
        'float': '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,239,178,0.05)',
        'inner': 'inset 0 1px 0 rgba(255,239,178,0.08)',
      },
      borderRadius: {
        'nt':    '12px',
        'nt-lg': '16px',
        'nt-xl': '20px',
        'nt-2xl':'24px',
      },
      backdropBlur: {
        'xs':   '4px',
        'premium': '20px',
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'glow-pulse':  'glow-pulse 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'slide-up':    'slide-up 0.35s cubic-bezier(0.34,1.3,0.64,1) forwards',
        'toast-in':    'toast-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'scale-in':    'scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-in':     'fade-in 0.3s ease-out forwards',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  },
  plugins: []
};
