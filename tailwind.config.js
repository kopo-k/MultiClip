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
  
plugins: [
  function ({ addUtilities }) {
    addUtilities({
      '.draggable': { '-webkit-app-region': 'drag' },
      '.no-drag': { '-webkit-app-region': 'no-drag' },
    });
  },
]
};

