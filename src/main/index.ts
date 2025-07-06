import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerHotKey, unregisterHotKey } from './hotkey';
import { startClipboardWatcher } from './clipboard';
import { createTray } from './tray';
import { setDockIcon } from './dock';
import { getRecentClips } from './db';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// ウィンドウを作成する関数
const createMainWindow = () => {
  console.log('createMainWindow called');
  const win = new BrowserWindow({
    width: 500,
    height: 700,
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
  ipcMain.handle('get-recent-clips', () => getRecentClips());

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
  setTimeout(() => {
    setDockIcon();                      // Dockにアイコン設定
    if (mainWindow) {
      createTray(mainWindow);
      registerHotKey(mainWindow);
    }

    // クリップボード監視
    startClipboardWatcher((text) => {
      console.log('コピーされました:', text);
      if (mainWindow) {
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

export { isQuitting };
