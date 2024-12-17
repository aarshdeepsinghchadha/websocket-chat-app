/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        external: '#DAA06D',
        chatbox: '#C19A6B',
        innerchat:'#EADDCA',
        buttonColor: '#7B3F00',
        buttonSecondaryColor: '#93785B',
        chatsubtitle :'#F2D2BD'
      },
    },
  },
  plugins: [],
}