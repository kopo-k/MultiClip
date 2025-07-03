import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getRecentClips: () => ipcRenderer.invoke('get-recent-clips'),
});