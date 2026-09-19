/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "index.html",
    "src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'border-cyan-500/20',
    'border-yellow-500/20',
    'border-green-500/20',
    'text-cyan-400',
    'text-yellow-400',
    'text-green-400',
    'bg-cyan-500/20',
    'bg-yellow-500/20',
    'bg-green-500/20',
    'border-cyan-500/50',
    'border-yellow-500/50',
    'border-green-500/50',
    'hover:bg-cyan-500/30',
    'hover:bg-yellow-500/30',
    'hover:bg-green-500/30',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};