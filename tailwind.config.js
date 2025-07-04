/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}", // ← Reactコンポーネントのパス
    "./src/renderer/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
