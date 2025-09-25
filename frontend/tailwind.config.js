/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        roseA: '#ff3b7f',
        roseB: '#ff7bbd',
        roseC: '#ffd1e6',
        ink:   '#1B1C1F',
        sky:   '#5ad7ff',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(255,59,127,.25)',
      },
    },
  },
  plugins: [],
}
