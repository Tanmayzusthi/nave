/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ededed",
        card: {
          DEFAULT: "rgba(23, 23, 23, 0.8)",
          foreground: "#ededed",
          border: "rgba(255, 255, 255, 0.1)",
        },
        primary: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
        muted: {
          DEFAULT: "#1f1f1f",
          foreground: "#a3a3a3",
        },
        accent: {
          DEFAULT: "#ffffff",
          muted: "#a3a3a3",
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
