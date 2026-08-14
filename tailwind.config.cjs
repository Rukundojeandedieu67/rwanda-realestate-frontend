module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        nzu: {
          teal: '#235E62',
          'teal-dark': '#1A4548',
          'teal-light': '#2D7377',
          cream: '#EFE8D5',
          terracotta: '#C26E4A',
          'terracotta-dark': '#A8593A',
          bg: '#F3F7FA',
        },
      },
    },
  },
  plugins: [],
}
