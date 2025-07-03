import { app, nativeImage } from 'electron';
import * as path from 'path';

 //ドックアイコンを設定する
export const setDockIcon = () => {
  const iconPath = path.join(app.getAppPath(), 'public', 'app-icon.png'); // /Users/k24032kk/src/MultiClip/public/app-icon.png
  const image = nativeImage.createFromPath(iconPath);
  console.log('Icon path:', iconPath); // /Users/k24032kk/src/MultiClip/public/app-icon.png
  console.log('Exists:', !image.isEmpty());

  if (!image.isEmpty()) {
    image.setTemplateImage(false);// フルカラーで表示する
    app.dock?.setIcon(image); // ドックアイコンを設定する
    console.log('Dockアイコン設定成功');
  } else {
    console.warn('Dockアイコン画像が読み込めませんでした');
  }
  app.dock?.show(); // ドックアイコンを表示する
}