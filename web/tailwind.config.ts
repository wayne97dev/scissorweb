import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          975: '#04060a',
          950: '#06080d',
          900: '#0a0e16',
          850: '#0f1421',
          800: '#141b2b',
          750: '#1a2233',
          700: '#1f283b',
          600: '#2a3650',
        },
        brand: {
          DEFAULT: '#2dd4bf',
          300: '#5eead4',
          400: '#34e3c8',
          500: '#2dd4bf',
          600: '#14b8a6',
          700: '#0d9488',
        },
        iris: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        win: '#34d399',
        lose: '#fb7185',
        tie: '#fbbf24',
        gold: '#f5c451',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(45,212,191,0.30), 0 0 40px -6px rgba(45,212,191,0.45)',
        'glow-iris': '0 0 0 1px rgba(139,92,246,0.30), 0 0 40px -6px rgba(139,92,246,0.40)',
        'glow-win': '0 0 0 1px rgba(52,211,153,0.40), 0 0 48px -6px rgba(52,211,153,0.55)',
        panel:
          '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 1px 24px -8px rgba(0,0,0,0.7), 0 24px 60px -24px rgba(0,0,0,0.6)',
        lift: '0 18px 50px -20px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rise-fade': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' },
          '70%': { transform: 'scale(1.12) rotate(3deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        'slam-left': {
          '0%': { opacity: '0', transform: 'translateX(-60px) rotate(-25deg) scale(0.8)' },
          '60%': { transform: 'translateX(8px) rotate(6deg) scale(1.08)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0) scale(1)' },
        },
        'slam-right': {
          '0%': { opacity: '0', transform: 'translateX(60px) rotate(25deg) scale(0.8)' },
          '60%': { transform: 'translateX(-8px) rotate(-6deg) scale(1.08)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0) scale(1)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(-4deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0) rotate(6deg)' },
          '50%': { transform: 'translateY(-22px) rotate(-3deg)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(6%,-8%) scale(1.12)' },
          '66%': { transform: 'translate(-7%,5%) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'rise-fade': 'rise-fade 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
        'pop-in': 'pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'slam-left': 'slam-left 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'slam-right': 'slam-right 0.5s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        aurora: 'aurora 22s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
