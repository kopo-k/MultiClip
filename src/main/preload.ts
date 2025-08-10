import { contextBridge, ipcRenderer } from 'electron';
// アプリ起動時に preload.js をレンダラープロセスが始まる前に読み込む
contextBridge.exposeInMainWorld('api', {
  getRecentClips: () => ipcRenderer.invoke('get-recent-clips'),
  onClipAdded: (callback: () => void) => {
    // 重複を避けるため、一度リスナーを削除してから追加
    ipcRenderer.removeAllListeners('clip-added');
    ipcRenderer.on('clip-added', callback);
  },
  onSnippetFallback: (callback: (data: { shortcutKey: string; content: string; reason: string }) => void) => {
    ipcRenderer.removeAllListeners('snippet-fallback');
    ipcRenderer.on('snippet-fallback', (event, data) => callback(data));
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
    ipcRenderer.invoke('copy-to-clipboard', text),
  // 設定関連API
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  clearAllHistory: () => ipcRenderer.invoke('clear-all-history'),
  setAutoStart: (enable: boolean) => ipcRenderer.invoke('set-auto-start', enable),
  changeGlobalShortcut: (shortcut: string) => ipcRenderer.invoke('change-global-shortcut', shortcut),
  updateWindowSettings: (settings: { width?: number, height?: number, x?: number, y?: number, opacity?: number, alwaysOnTop?: boolean }) => 
    ipcRenderer.invoke('update-window-settings', settings),
  changeTheme: (theme: string) => ipcRenderer.invoke('change-theme', theme),
  setHistoryLimit: (limit: number) => ipcRenderer.invoke('set-history-limit', limit),
  setFavoriteLimit: (limit: number) => ipcRenderer.invoke('set-favorite-limit', limit),
  startWindowDrag: () => ipcRenderer.invoke('start-window-drag'),
  getCurrentWindowPosition: () => ipcRenderer.invoke('get-current-window-position'),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  submitReport: (reportData: any) => ipcRenderer.invoke('submit-report', reportData)
});
