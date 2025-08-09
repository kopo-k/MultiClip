import { contextBridge, ipcRenderer } from 'electron';
// アプリ起動時に preload.js をレンダラープロセスが始まる前に読み込む
contextBridge.exposeInMainWorld('api', {
  getRecentClips: () => ipcRenderer.invoke('get-recent-clips'),
  onClipAdded: (callback: () => void) => {
    // 重複を避けるため、一度リスナーを削除してから追加
    ipcRenderer.removeAllListeners('clip-added');
    ipcRenderer.on('clip-added', callback);
  },
  registerSnippetShortcut: (shortcutKey: string, content: string) => 
    ipcRenderer.invoke('register-snippet-shortcut', shortcutKey, content),
  unregisterSnippetShortcut: (shortcutKey: string) => 
    ipcRenderer.invoke('unregister-snippet-shortcut', shortcutKey),
  updateSnippetShortcuts: (snippets: Array<{ shortcutKey: string; content: string; isEnabled: boolean }>) =>
    ipcRenderer.invoke('update-snippet-shortcuts', snippets),
  createSnippet: (content: string, shortcutKey: string) =>
    ipcRenderer.invoke('create-snippet', content, shortcutKey),
  updateClip: (id: number, updates: any) =>
    ipcRenderer.invoke('update-clip', id, updates),
  copyToClipboard: (text: string) =>
    ipcRenderer.invoke('copy-to-clipboard', text)
});
