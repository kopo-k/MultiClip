import { contextBridge, ipcRenderer } from 'electron';
// アプリ起動時に preload.js をレンダラープロセスが始まる前に読み込む
contextBridge.exposeInMainWorld('api', {
  getRecentClips: () => ipcRenderer.invoke('get-recent-clips'),
  onClipAdded: (callback: () => void) => {
    ipcRenderer.on('clip-added', callback);
  }
});
