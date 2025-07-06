import { app, BrowserWindow, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { registerHotKey, unregisterHotKey } from './hotkey';
import { startClipboardWatcher } from './clipboard';
import { createTray } from './tray';
import { setDockIcon } from './dock';
import { getRecentClips } from './db';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// メインウィンドウを作成する関数
const createMainWindow = () => {
  const win = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: false,
    fullscreenable: false, //緑ボタン無効
    titleBarStyle: 'hiddenInset', //タイトルバー非表示
    title: 'MultiClip', //タイトル
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    show: true, // 最初は非表示にする
  });

  // どのデスクトップからでも呼び出せるようにする、フルスクリーンでも表示されるようにする
  // win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.on('close', (e) => { //閉じるボタンを押した時
    if (!isQuitting) { //終了していない場合
      e.preventDefault(); //デフォルトの挙動をキャンセル
      win.hide(); //非表示にしてバックグラウンドに残す。
    }
  });

  // クリップボードの履歴を取得するAPI
  ipcMain.handle('get-recent-clips', () => {
    return getRecentClips(); //データベースから最近のコピー履歴（clips）を取得
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  return win;
};

app.whenReady().then(() => {
  setDockIcon();
  mainWindow = createMainWindow();
  createTray(mainWindow);
  registerHotKey(mainWindow);
  //クリップボードの監視を開始する関数
  startClipboardWatcher((text) => {
    console.log('コピーされました:', text);
    // ウィンドウが開いている場合はコピーされたテキストを送信
    if (mainWindow) {
      mainWindow.webContents.send('clip-added');
    }
  });
});

// アプリがアクティブになった時
app.on('activate', () => {
  // ウィンドウが閉じられている場合は新しいウィンドウを作成
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// アプリが終了する前に実行される関数
app.on('before-quit', () => {
  isQuitting = true; //終了していることを示す
  unregisterHotKey(); //ホットキーを解除
  if (mainWindow) { //ウィンドウが開いている場合
    mainWindow.destroy(); //ウィンドウを破棄
  }
});

export { isQuitting };
