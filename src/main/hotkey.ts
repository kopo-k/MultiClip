import { globalShortcut, BrowserWindow, app } from 'electron';
import { isQuitting } from './index';

/**
 * 指定したウィンドウにホットキー（Ctrl+Shift+C）を登録する関数
 */
export const registerHotKey = (win: BrowserWindow) => {
  // アプリが準備できたらホットキーを登録
  app.whenReady().then(() => {
    // ホットキーを登録
    const success = globalShortcut.register('Control+Shift+C', () => {
      // ウィンドウが破棄されている場合は何もしない
      if (!win || win.isDestroyed() || isQuitting) return;

      // ウィンドウが表示されている場合は非表示にする
      if (win.isVisible()) {
        win.hide(); //非表示にする
      } else {
        // フルスクリーン上でも表示されるように設定
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.show(); //表示する
        win.focus(); //フォーカスする
        setTimeout(() => {
          win.setVisibleOnAllWorkspaces(false); //ワークスペースを移動しても表示されるようにする
        }, 100);
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
