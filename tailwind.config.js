/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hbs: {
          blue: {
            DEFAULT: '#0B7BA7',
            deep: '#006185',
            light: '#E6F4F8',
            soft: '#F0F8FA',
            dark: '#004C6A',
          },
          slate: {
            DEFAULT: '#2C3E50',
            dark: '#091D2E',
            muted: '#4A5568',
            light: '#6F787F',
            border: '#D1E4FB',
          },
          amber: {
            DEFAULT: '#F39200',
            light: '#FEF7EE',
            dark: '#A76300',
          },
          teal: {
            DEFAULT: '#00A896',
            light: '#E6FAF7',
            deep: '#006B5F',
          },
          bg: {
            DEFAULT: '#F8FBFC',
            card: '#FFFFFF',
            accent: '#EDF4FF',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'hbs-card': '0 4px 20px -2px rgba(11, 123, 167, 0.08), 0 2px 6px -1px rgba(9, 29, 46, 0.04)',
        'hbs-hover': '0 12px 30px -4px rgba(11, 123, 167, 0.16), 0 4px 10px -2px rgba(9, 29, 46, 0.06)',
        'hbs-modal': '0 25px 50px -12px rgba(9, 29, 46, 0.25)',
      },
      animation: {
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(3px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      }
    },
  },
  plugins: [],
}
