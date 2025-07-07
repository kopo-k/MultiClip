/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}", // ← Reactコンポーネントのパス
    "./src/renderer/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
