/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060d17',
          900: '#0a192f',
          850: '#0d213f',
          800: '#112240',
          700: '#1e3a5f',
          600: '#2d4b73',
          500: '#3d608f',
          400: '#5c80b0',
          300: '#8ba6cf',
          200: '#bad0ee',
          100: '#e1ecf8',
          50: '#f0f5fc',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        clinical: {
          blue: '#0284c7',
          dark: '#0f172a',
          slate: '#334155',
          light: '#f8fafc',
          border: '#e2e8f0',
          accent: '#0d9488',
          danger: '#e11d48',
          warning: '#d97706',
          success: '#059669',
          info: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
