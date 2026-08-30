/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        ai: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          300: '#5EEAD4',
          600: '#0D9488',
          700: '#0F766E',
        },
        primary:        '#818CF8',
        'primary-dark': '#A5B4FC',
        'primary-dim':  'rgba(129,140,248,0.72)',
        'primary-faint':'rgba(129,140,248,0.10)',
        secondary:      '#11182A',
        'sec-light':    '#172036',
        'sec-dark':     '#0B1020',

        'nt-bg':       '#0B1020',
        'nt-bg1':      '#11182A',
        'nt-bg2':      '#151D31',
        'nt-bg3':      '#172036',
        'nt-bg4':      '#202A43',

        'nt-border':   'rgba(170,180,200,0.14)',
        'nt-border2':  'rgba(170,180,200,0.22)',
        'nt-border3':  'rgba(170,180,200,0.32)',

        'nt-text':     '#F8FAFC',
        'nt-text2':    '#D7DDEA',
        'nt-muted':    '#AAB4C8',
        'nt-faint':    'rgba(170,180,200,0.56)',

        'nt-teal':     '#5EEAD4',
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
        'nt-card': '0 12px 30px rgba(15,23,42,0.10)',
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
