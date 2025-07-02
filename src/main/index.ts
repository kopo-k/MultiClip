import { app, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';
import { createTray } from './tray';

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
    show: true, // 最初は非表示にしてTrayから表示
  });

  win.loadFile(path.join(app.getAppPath(), 'public', 'index.html'));
  return win;
};

app.whenReady().then(() => {
  // Dock アイコンの設定
  const iconPath = path.join(app.getAppPath(), 'public', 'app-icon.png');
  const image = nativeImage.createFromPath(iconPath);

  console.log('Icon path:', iconPath);
  console.log('Exists:', !image.isEmpty());

  if (!image.isEmpty()) {
    image.setTemplateImage(false);
    app.dock.setIcon(image);
    console.log('✅ Dockアイコン設定成功');
  } else {
    console.warn('⚠️ Dockアイコン画像が読み込めませんでした');
  }

  app.dock.show();

  // ウィンドウ作成
  mainWindow = createMainWindow();

  // Tray 作成（ウィンドウ渡す）
  createTray(mainWindow);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
