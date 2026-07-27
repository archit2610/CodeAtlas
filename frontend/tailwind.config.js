/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ["'Instrument Serif'", 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        atlas: {
          base: '#12151A',
          panel: '#181C22',
          surface: '#1E232B',
          border: '#262B33',
          accent: '#38BDF8', // Refined Sky Blue/Cyan replaces yellow
          indigo: '#818CF8',
          teal: '#4A8B85',
          text: '#E4E1D6',
          muted: '#8A8F97',
          sage: '#7C9473',
        },
      },
    },
  },
  plugins: [],
}
