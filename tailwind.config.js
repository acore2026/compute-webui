/** @type {import('tailwindcss').Config} */
import primeui from 'tailwindcss-primeui'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        cmcc: '#0085D0',
        plane: {
          control: '#7c3aed',
          data: '#f59e0b',
          wireless: '#0284c7',
          bus: '#38bdf8',
          success: '#10b981'
        },
        ink: {
          50: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          700: '#334155',
          800: '#1e293b'
        },
        brand: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'PingFang SC', 'system-ui', 'sans-serif'],
        display: ['Avenir Next', 'Source Sans 3', 'Helvetica Neue', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        sm: '0 4px 12px rgba(15, 23, 42, 0.08)',
        md: '0 10px 24px rgba(15, 23, 42, 0.08)',
        deep: '0 28px 70px rgba(15, 23, 42, 0.22)',
        glow: '0 14px 34px -10px rgba(59, 130, 246, 0.34)'
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '26px'
      }
    }
  },
  plugins: [primeui]
}
