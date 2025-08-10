import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { registerHotKey, unregisterHotKey, registerSnippetShortcut, unregisterSnippetShortcut, updateSnippetShortcuts, changeGlobalShortcut } from './hotkey';
import { startClipboardWatcher } from './clipboard';
import { createTray } from './tray';
import { setDockIcon } from './dock';
import { getRecentClips, addSnippet, updateClip, setHistoryLimit, setFavoriteLimit } from './db';

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

  // IPC - 設定の読み込み
  ipcMain.handle('load-settings', async () => {
    try {
      const fs = require('fs');
      const settingsPath = path.join(__dirname, '../data/settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(data);
      }
      // デフォルト設定を返す
      return {
        autoStart: false,
        showWindowOnStartup: true,
        historyLimit: 50,
        favoriteLimit: 100,
        globalShortcut: 'Cmd+Shift+C',
        theme: 'system',
        windowSize: { width: 500, height: 500 },
        opacity: 100,
        alwaysOnTop: false
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  });

  // IPC - 設定の保存
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const fs = require('fs');
      const settingsPath = path.join(__dirname, '../data/settings.json');
      
      // dataディレクトリが存在しない場合は作成
      const dataDir = path.dirname(settingsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('Settings saved:', settings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  });

  // IPC - 履歴の一括削除
  ipcMain.handle('clear-all-history', async () => {
    try {
      const { clearAllHistory } = require('./db');
      clearAllHistory();
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  });

  // IPC - 自動起動設定
  ipcMain.handle('set-auto-start', async (event, enable: boolean) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
      });
      return true;
    } catch (error) {
      console.error('Failed to set auto start:', error);
      return false;
    }
  });

  // IPC - グローバルショートカット変更
  ipcMain.handle('change-global-shortcut', async (event, shortcut: string) => {
    try {
      return changeGlobalShortcut(shortcut);
    } catch (error) {
      console.error('Failed to change global shortcut:', error);
      return false;
    }
  });

  // IPC - ウィンドウ設定変更
  ipcMain.handle('update-window-settings', async (event, settings: { 
    width?: number, 
    height?: number, 
    opacity?: number, 
    alwaysOnTop?: boolean 
  }) => {
    try {
      if (settings.width && settings.height) {
        // 安全な範囲内でサイズを制限
        const safeWidth = Math.max(400, Math.min(1600, settings.width));
        const safeHeight = Math.max(400, Math.min(1200, settings.height));
        win.setSize(safeWidth, safeHeight);
        console.log(`Window size updated to: ${safeWidth}x${safeHeight}`);
      }
      if (settings.opacity !== undefined) {
        // 透明度も安全な範囲内で制限
        const safeOpacity = Math.max(0.7, Math.min(1.0, settings.opacity / 100));
        win.setOpacity(safeOpacity);
      }
      if (settings.alwaysOnTop !== undefined) {
        win.setAlwaysOnTop(settings.alwaysOnTop, settings.alwaysOnTop ? 'screen-saver' : 'normal');
      }
      return true;
    } catch (error) {
      console.error('Failed to update window settings:', error);
      return false;
    }
  });

  // IPC - テーマ変更（将来の実装用）
  ipcMain.handle('change-theme', async (event, theme: string) => {
    try {
      // テーマ変更ロジック（CSS変更など）は後で実装
      console.log('Theme changed to:', theme);
      return true;
    } catch (error) {
      console.error('Failed to change theme:', error);
      return false;
    }
  });

  // IPC - 履歴件数制限設定
  ipcMain.handle('set-history-limit', async (event, limit: number) => {
    try {
      setHistoryLimit(limit);
      return true;
    } catch (error) {
      console.error('Failed to set history limit:', error);
      return false;
    }
  });

  // IPC - お気に入り件数制限設定
  ipcMain.handle('set-favorite-limit', async (event, limit: number) => {
    try {
      setFavoriteLimit(limit);
      return true;
    } catch (error) {
      console.error('Failed to set favorite limit:', error);
      return false;
    }
  });

  // HTML読み込み
  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  return win;
};

// アプリ起動時の処理
app.whenReady().then(async () => {
  mainWindow = createMainWindow();
  
  // 設定を読み込んで適用
  try {
    const fs = require('fs');
    const settingsPath = path.join(__dirname, '../data/settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      
      // ウィンドウ設定を適用（安全な範囲内で制限）
      if (settings.windowSize) {
        const safeWidth = Math.max(400, Math.min(1600, settings.windowSize.width));
        const safeHeight = Math.max(400, Math.min(1200, settings.windowSize.height));
        mainWindow.setSize(safeWidth, safeHeight);
      }
      if (settings.opacity !== undefined) {
        const safeOpacity = Math.max(0.7, Math.min(1.0, settings.opacity / 100));
        mainWindow.setOpacity(safeOpacity);
      }
      if (settings.alwaysOnTop !== undefined) {
        mainWindow.setAlwaysOnTop(settings.alwaysOnTop, settings.alwaysOnTop ? 'screen-saver' : 'normal');
      }
    }
  } catch (error) {
    console.error('Failed to load and apply startup settings:', error);
  }

  // 初回のみ、現在のSpaceにウィンドウを表示（フルスクリーン対応）
  mainWindow.once('ready-to-show', async () => {
    mainWindow?.setAlwaysOnTop(true, 'screen-saver'); // ウィンドウレベル最大化
    mainWindow?.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // 設定で起動時ウィンドウ表示が無効の場合は表示しない
    let showOnStartup = true;
    try {
      const fs = require('fs');
      const settingsPath = path.join(__dirname, '../data/settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(data);
        showOnStartup = settings.showWindowOnStartup !== false;
      }
    } catch (error) {
      console.error('Failed to load startup window setting:', error);
    }
    
    if (showOnStartup) {
      mainWindow?.show();
      mainWindow?.focus();
      console.log('現在のSpaceでウィンドウを起動しました');
    } else {
      console.log('起動時ウィンドウ表示は無効になっています');
    }
  });

  // 重要：表示処理が先。その後に常駐処理を行う
  setTimeout(async () => {
    setDockIcon();                      // Dockにアイコン設定
    if (mainWindow) {
      createTray(mainWindow);
      
      // カスタムショートカットキーを適用
      let globalShortcut = 'Control+Shift+C';
      try {
        const fs = require('fs');
        const settingsPath = path.join(__dirname, '../data/settings.json');
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf8');
          const settings = JSON.parse(data);
          if (settings.globalShortcut) {
            globalShortcut = settings.globalShortcut
              .replace(/Cmd/g, 'Command')
              .replace(/Ctrl/g, 'Control');
          }
        }
      } catch (error) {
        console.error('Failed to load global shortcut setting:', error);
      }
      
      registerHotKey(mainWindow, globalShortcut);
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
