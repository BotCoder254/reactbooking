/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8F87F1',
          hover: '#7A71E8',
        },
        secondary: {
          DEFAULT: '#C68EFD',
          hover: '#B77AE8',
        },
        accent: {
          DEFAULT: '#E9A5F1',
          hover: '#D990E8',
        },
        soft: {
          DEFAULT: '#FED2E2',
          hover: '#FFC1D6',
        },
      },
      spacing: {
        'sidebar': '280px',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

