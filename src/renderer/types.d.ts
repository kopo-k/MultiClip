declare global {
  /*
  window.api というオブジェクトに、2つのメソッド getRecentClips() と onClipAdded() があることを型として定義する
  */
  interface Window {
    api: {
      //引数なしで呼び出すと、Clip型の配列（リスト）を Promise で返す関数
      getRecentClips: () => Promise<Clip[]>;
      //引数としてコールバック関数を受け取り、何も返さない関数
      onClipAdded: (callback: () => void) => void;
      //スニペットフォールバック通知を受け取る
      onSnippetFallback: (callback: (data: { shortcutKey: string; content: string; reason: string }) => void) => void;
      //スニペット用のショートカットを登録
      registerSnippetShortcut: (shortcutKey: string, content: string) => Promise<boolean>;
      //スニペット用のショートカットを解除
      unregisterSnippetShortcut: (shortcutKey: string) => Promise<boolean>;
      //すべてのスニペットショートカットを更新
      updateSnippetShortcuts: (snippets: Array<{ shortcutKey: string; content: string; isEnabled: boolean }>) => Promise<boolean>;
      //新しいスニペットを作成
      createSnippet: (content: string, shortcutKey: string) => Promise<boolean>;
      //クリップを更新
      updateClip: (id: number, updates: any) => Promise<boolean>;
      //クリップボードにテキストをコピー
      copyToClipboard: (text: string) => Promise<boolean>;
      //設定関連API
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      clearAllHistory: () => Promise<boolean>;
      setAutoStart: (enable: boolean) => Promise<boolean>;
      changeGlobalShortcut: (shortcut: string) => Promise<boolean>;
      updateWindowSettings: (settings: { width?: number, height?: number, x?: number, y?: number, opacity?: number, alwaysOnTop?: boolean }) => Promise<boolean>;
      changeTheme: (theme: string) => Promise<boolean>;
      setHistoryLimit: (limit: number) => Promise<boolean>;
      setFavoriteLimit: (limit: number) => Promise<boolean>;
      startWindowDrag: () => Promise<boolean>;
      getCurrentWindowPosition: () => Promise<{ x: number, y: number } | null>;
      getScreenInfo: () => Promise<any>;
      getSystemInfo: () => Promise<any>;
      submitReport: (reportData: any) => Promise<boolean>;
    };
  }
}

export {};