/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Indian tricolor
        'india-saffron': '#FF9933',
        'india-white': '#FFFFFF',
        'india-green': '#138808',
        'india-navy': '#000080',
        // Government website palette
        'gov-primary': '#0056b3',
        'gov-secondary': '#6c757d',
        'gov-accent': '#ffc107',
        'gov-bg': '#f8f9fa',
        'gov-text': '#212529',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
