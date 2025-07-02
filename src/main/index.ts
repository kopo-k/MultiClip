import { app, BrowserWindow, nativeImage } from 'electron';
import { registerHotKey, unregisterHotKey } from './hotkey';
import { startClipboardWatcher } from './clipboard';
import * as path from 'path';
import { createTray } from './tray';
import { setDockIcon } from './dock';

let mainWindow: BrowserWindow | null = null;

const createMainWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    fullscreenable: false,
    title: 'MultiClip',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    show: false, // 最初は非表示にしてTrayから表示
  });

  win.loadFile(path.join(app.getAppPath(), 'public', 'index.html'));
  return win;
};

app.whenReady().then(() => {
  // Dock アイコンの設定
  setDockIcon();
  // ウィンドウ作成
  mainWindow = createMainWindow();

  // Tray 作成（ウィンドウ渡す）
  createTray(mainWindow);

  // ホットキーの登録
  registerHotKey(mainWindow);

  startClipboardWatcher((text) => {
    console.log('📋 コピーされました:', text);
    // ここで DB に保存する、UI に渡す など
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
