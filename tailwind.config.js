
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      'sans': ['"Noto Sans"', 'sans-serif'],
    },
    fontSize: {
      base: '14px', // default is 16px, decreased for smaller base font size
    },
  },
  plugins: [],
}
