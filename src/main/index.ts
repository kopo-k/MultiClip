import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { registerHotKey, unregisterHotKey, registerSnippetShortcut, unregisterSnippetShortcut, updateSnippetShortcuts } from './hotkey';
import { startClipboardWatcher } from './clipboard';
import { createTray } from './tray';
import { setDockIcon } from './dock';
import { getRecentClips, addSnippet, updateClip } from './db';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// ウィンドウを作成する関数
const createMainWindow = () => {
  console.log('createMainWindow called');
  const win = new BrowserWindow({
    width: 500,
    height: 500,

    resizable: false,
    fullscreenable: true, // フルスクリーンSpaceでの補助ウィンドウとして許可
    titleBarStyle: 'hiddenInset',
    title: 'MultiClip',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    show: false, // 最初は非表示
  });

  // 閉じるとき非表示にして常駐
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  // IPC - クリップ履歴取得
  ipcMain.handle('get-recent-clips', () => {
    const clips = getRecentClips();
    console.log('Fetching clips from DB:', clips.length, 'total items');
    return clips;
  });

  // IPC - スニペット ショートカット管理
  ipcMain.handle('register-snippet-shortcut', async (event, shortcutKey: string, content: string) => {
    return registerSnippetShortcut(shortcutKey, content);
  });

  ipcMain.handle('unregister-snippet-shortcut', async (event, shortcutKey: string) => {
    return unregisterSnippetShortcut(shortcutKey);
  });

  ipcMain.handle('update-snippet-shortcuts', async (event, snippets: Array<{ shortcutKey: string; content: string; isEnabled: boolean }>) => {
    updateSnippetShortcuts(snippets);
    return true;
  });

  // IPC - スニペット作成
  ipcMain.handle('create-snippet', async (event, content: string, shortcutKey: string) => {
    try {
      addSnippet(content, shortcutKey);
      return true;
    } catch (error) {
      console.error('Failed to create snippet:', error);
      return false;
    }
  });

  // IPC - クリップ更新
  ipcMain.handle('update-clip', async (event, id: number, updates: any) => {
    try {
      updateClip(id, updates);
      return true;
    } catch (error) {
      console.error('Failed to update clip:', error);
      return false;
    }
  });

  // IPC - クリップボードにテキストをコピー
  ipcMain.handle('copy-to-clipboard', async (event, text: string) => {
    try {
      const { clipboard } = require('electron');
      clipboard.writeText(text);
      console.log(`Copied to clipboard: ${text.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  });

  // HTML読み込み
  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  return win;
};

// アプリ起動時の処理
app.whenReady().then(() => {
  mainWindow = createMainWindow();

  // 初回のみ、現在のSpaceにウィンドウを表示（フルスクリーン対応）
  mainWindow.once('ready-to-show', () => {
    mainWindow?.setAlwaysOnTop(true, 'screen-saver'); // ウィンドウレベル最大化
    mainWindow?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow?.show();
    mainWindow?.focus();

    console.log('現在のSpaceでウィンドウを起動しました');
  });

  // 重要：表示処理が先。その後に常駐処理を行う
  setTimeout(async () => {
    setDockIcon();                      // Dockにアイコン設定
    if (mainWindow) {
      createTray(mainWindow);
      registerHotKey(mainWindow);
    }

    // macOSでアクセシビリティ権限をチェック
    if (process.platform === 'darwin') {
      await checkAccessibilityPermission(mainWindow);
    }

    // クリップボード監視
    startClipboardWatcher((text) => {
      console.log('コピーされました:', text.substring(0, 50) + '...');
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Sending clip-added event to renderer');
        mainWindow.webContents.send('clip-added');
      }
    });
  }, 600); // ウィンドウ表示後に遅延して実行
});

// アクティブ時にウィンドウ再作成
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// 全ウィンドウ閉じたときの挙動（mac以外は終了）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 終了処理
app.on('before-quit', () => {
  isQuitting = true;
  unregisterHotKey();
  if (mainWindow) {
    mainWindow.destroy();
  }
});

// macOSでアクセシビリティ権限をチェック
async function checkAccessibilityPermission(window: BrowserWindow | null) {
  try {
    // robotjsを使ってマウス位置を取得してアクセシビリティ権限をテスト
    const robot = require('robotjs');
    robot.getMousePos();
    console.log('✅ Accessibility permission granted');
  } catch (error) {
    console.warn('❌ Accessibility permission required');
    
    // 権限が必要であることをユーザーに通知
    if (window) {
      const result = await dialog.showMessageBox(window, {
        type: 'warning',
        title: 'アクセシビリティ権限が必要です',
        message: 'スニペット機能でテキストを直接入力するために、アクセシビリティ権限が必要です。',
        detail: 'システム環境設定 > セキュリティとプライバシー > アクセシビリティ で MultiClip を許可してください。',
        buttons: ['システム環境設定を開く', 'スキップ'],
        defaultId: 0
      });
      
      if (result.response === 0) {
        const { shell } = require('electron');
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
      }
    }
  }
}

export { isQuitting };
