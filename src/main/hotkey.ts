import { globalShortcut, BrowserWindow, app } from 'electron';

/**
 * 指定したウィンドウにホットキー（Ctrl+Shift+C）を登録する関数
 * 押すたびに表示／非表示が切り替わる（トグル動作）
 */
export const registerHotKey = (win: BrowserWindow) => {
  app.whenReady().then(() => {
    const success = globalShortcut.register('Control+Shift+C', () => {
      if (!win) return;

      if (win.isVisible()) {
        win.hide();       // ウィンドウが見えている → 隠す
      } else {
        win.show();       // ウィンドウが隠れている → 表示する
      }
    });

    if (!success) {
      console.error('❌ ホットキー登録に失敗しました');
    } else {
      console.log('✅ ホットキー登録完了（Ctrl + Shift + C）');
    }
  });
};

/**
 * アプリ終了時に呼び出す：すべてのホットキーを解除
 */
export const unregisterHotKey = () => {
  globalShortcut.unregisterAll();
};
