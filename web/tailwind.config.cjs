/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "index.html",
    "src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'border-cyan-500/20',
    'border-cyan-500/30',
    'border-cyan-500/40',
    'border-blue-500/20',
    'border-blue-500/30',
    'border-violet-500/20',
    'border-purple-500/20',
    'border-purple-500/30',
    'border-amber-500/20',
    'border-emerald-500/20',
    'border-emerald-500/30',
    'text-cyan-400',
    'text-cyan-300',
    'text-blue-400',
    'text-violet-400',
    'text-purple-400',
    'text-amber-400',
    'text-emerald-400',
    'bg-cyan-500/10',
    'bg-cyan-500/20',
    'bg-blue-500/10',
    'bg-violet-500/10',
    'bg-purple-500/10',
    'bg-emerald-500/10',
    'bg-amber-500/10',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#050912',
          900: '#070B14',
          850: '#0B1220',
          800: '#0D1626',
          750: '#111D33',
          700: '#162542',
          border: '#1C3150',
          cyan: '#00E5FF',
          blue: '#3B82F6',
          violet: '#8B5CF6',
          purple: '#A855F7',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};