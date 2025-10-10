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
        // 🌿 Nueva paleta verde-azulada
        roseA: '#00bfa6', // Verde azulado principal
        roseB: '#3de0c4', // Tono medio (para degradados)
        roseC: '#b8f5ec', // Fondo suave pastel
        ink:   '#1B1C1F', // Texto principal oscuro
        sky:   '#5ad7ff', // Puedes dejarlo o adaptarlo luego
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,191,166,.25)', // sombreado adaptado al nuevo color
      },
    },
  },
  plugins: [],
}
