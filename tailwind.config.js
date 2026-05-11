/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F2EBFF',
          100: '#E4D6FF',
          200: '#C7AEFF',
          300: '#A87DFF',
          400: '#8A52F5',
          500: '#6E2EE6',
          600: '#5621B8',
          700: '#3F1888',
          800: '#2A0F5C',
          900: '#1A0937',
        },
        ink: {
          900: '#111827',
          700: '#374151',
          500: '#6B7280',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#FAFAFB',
        },
        status: {
          new: '#2563EB',
          progress: '#D97706',
          done: '#059669',
        },
        priority: {
          p1: '#DC2626',
          p2: '#D97706',
          p3: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.04), 0 1px 3px rgba(17, 24, 39, 0.06)',
        pop: '0 10px 30px rgba(86, 33, 184, 0.12), 0 4px 10px rgba(17, 24, 39, 0.06)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
