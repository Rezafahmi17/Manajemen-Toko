module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: '#fcfbf7', // Parchment Cream
        card: '#ffffff', // Pure Linen
        panel: '#ffffff',
        spruce: '#2b1b1b', // Espresso
        abyss: '#0d0d0f', // Ink Black
        mint: '#99ff66', // Acid Lime
        sage: '#2b1b1b', // Espresso
        mist: '#2b1b1b',
        faded: '#e7e4e0', // Warm Linen
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
