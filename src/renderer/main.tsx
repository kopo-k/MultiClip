import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// グローバルエラーハンドラーを追加
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
  
  // エラー時のフォールバック表示
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2>アプリケーションの起動に失敗しました</h2>
      <p>申し訳ございません。アプリケーションを正常に起動できませんでした。</p>
      <button onclick="location.reload()" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
        再読み込み
      </button>
    </div>
  `;
}
