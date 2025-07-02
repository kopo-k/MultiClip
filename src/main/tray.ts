// src/main/tray.ts
import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

export const createTray = (win: BrowserWindow) => {
  const iconPath = path.join(app.getAppPath(), 'public', 'iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  console.log(iconPath);
  icon.setTemplateImage(true); // macOSのダークモードに対応

  tray = new Tray(icon);
  tray.setToolTip('MultiClip');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ウィンドウを表示',
      click: () => {
        win.show();
      },
    },
    {
      label: '終了',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    // 左クリックでウィンドウをトグル
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });
};
