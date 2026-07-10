/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onforge: {
          black: '#0D0D0D',
          peach: '#F0CAAC',
          cream: '#EAE3DA',
          gray: '#AFB0B3',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Zalando Sans Expanded"', '"Montserrat"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
