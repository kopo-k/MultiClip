import { globalShortcut, BrowserWindow, app, clipboard } from 'electron';
import { isQuitting } from './index';
import { typeText } from './textTyper';

let hotkeyReady = false;
let snippetShortcuts = new Map<string, string>(); // shortcutKey -> content


/**
 * 指定したウィンドウにホットキー（Ctrl+Shift+C）を登録する関数
 */
export const registerHotKey = (win: BrowserWindow) => {
  // アプリが準備できたらホットキーを登録
  app.whenReady().then(() => {
    setTimeout(() => {
      hotkeyReady = true;
    }, 1000);
    // ホットキーを登録
    const success = globalShortcut.register('Control+Shift+C', () => {
      console.log('Hotkey triggered, win.isVisible():', win?.isVisible());

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
 * スニペット用のショートカットを登録
 */
export const registerSnippetShortcut = (shortcutKey: string, content: string): boolean => {
  if (!hotkeyReady) {
    console.warn('Hotkey system not ready yet');
    return false;
  }

  try {
    const success = globalShortcut.register(shortcutKey, () => {
      if (!isQuitting) {
        // テキストを直接入力
        typeText(content, process.platform === 'darwin' ? 200 : 150).then((success) => {
          if (!success) {
            // フォールバックとしてクリップボードに保存
            clipboard.writeText(content);
            console.log(`Fallback to clipboard: ${shortcutKey} -> ${content.substring(0, 50)}...`);
          }
        }).catch((error) => {
          console.error('Failed to type snippet:', error);
          // フォールバックとしてクリップボードに保存
          clipboard.writeText(content);
          console.log(`Fallback to clipboard: ${shortcutKey} -> ${content.substring(0, 50)}...`);
        });
      }
    });

    if (success) {
      snippetShortcuts.set(shortcutKey, content);
      console.log(`✅ Snippet shortcut registered: ${shortcutKey}`);
    } else {
      console.error(`❌ Failed to register snippet shortcut: ${shortcutKey}`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error registering snippet shortcut: ${error}`);
    return false;
  }
};

/**
 * スニペット用のショートカットを解除
 */
export const unregisterSnippetShortcut = (shortcutKey: string): boolean => {
  try {
    globalShortcut.unregister(shortcutKey);
    snippetShortcuts.delete(shortcutKey);
    console.log(`✅ Snippet shortcut unregistered: ${shortcutKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Error unregistering snippet shortcut: ${error}`);
    return false;
  }
};

/**
 * すべてのスニペットショートカットを更新
 */
export const updateSnippetShortcuts = (snippets: Array<{ shortcutKey: string; content: string; isEnabled: boolean }>) => {
  // 既存のスニペットショートカットをすべて解除
  for (const shortcutKey of snippetShortcuts.keys()) {
    globalShortcut.unregister(shortcutKey);
  }
  snippetShortcuts.clear();

  // 有効なスニペットのショートカットを再登録
  for (const snippet of snippets) {
    if (snippet.isEnabled && snippet.shortcutKey.trim()) {
      registerSnippetShortcut(snippet.shortcutKey, snippet.content);
    }
  }
};

/**
 * アプリ終了時に呼び出す：すべてのホットキーを解除
 */
export const unregisterHotKey = () => {
  globalShortcut.unregisterAll();
  snippetShortcuts.clear();
};
