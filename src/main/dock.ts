import { app, nativeImage } from 'electron';
import * as path from 'path';

export const setDockIcon = () => {
  const iconPath = path.join(app.getAppPath(), 'public', 'app-icon.png'); // /Users/k24032kk/src/MultiClip/public/app-icon.png
  const image = nativeImage.createFromPath(iconPath);
  console.log('Icon path:', iconPath); // /Users/k24032kk/src/MultiClip/public/app-icon.png
  console.log('Exists:', !image.isEmpty());

  if (!image.isEmpty()) {
    image.setTemplateImage(false);
    app.dock.setIcon(image);
    console.log('✅ Dockアイコン設定成功');
  } else {
    console.warn('⚠️ Dockアイコン画像が読み込めませんでした');
  }
  app.dock.show();
}