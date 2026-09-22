/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        hollywood: {
          red: '#d32f2f',
          darkred: '#b71c1c',
          gold: '#c5a059',
          black: '#121212',
          charcoal: '#1e1e1e',
          lightgray: '#f7f7f8',
          border: '#e5e7eb',
        },
      },
      fontFamily: {
        serif: ['"Lora"', '"Newsreader"', 'Georgia', 'Cambria', 'serif'],
        headline: ['"Cinzel"', '"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
