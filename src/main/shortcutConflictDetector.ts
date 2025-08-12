import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// macOSの標準システムショートカット
const MAC_SYSTEM_SHORTCUTS = [
  'Cmd+Space',
  'Cmd+Tab',
  'Cmd+`',
  'Cmd+Q',
  'Cmd+W',
  'Cmd+T',
  'Cmd+R',
  'Cmd+Y',
  'Cmd+U',
  'Cmd+I',
  'Cmd+O',
  'Cmd+P',
  'Cmd+A',
  'Cmd+S',
  'Cmd+D',
  'Cmd+F',
  'Cmd+G',
  'Cmd+H',
  'Cmd+J',
  'Cmd+K',
  'Cmd+L',
  'Cmd+Z',
  'Cmd+X',
  'Cmd+C',
  'Cmd+V',
  'Cmd+B',
  'Cmd+N',
  'Cmd+M',
  'Cmd+Option+Esc',
  'Cmd+Shift+3',
  'Cmd+Shift+4',
  'Cmd+Shift+5',
  'Cmd+Control+Space',
  'Cmd+Control+F',
  'Cmd+Control+Q',
  'Control+Up',
  'Control+Down',
  'Control+Left',
  'Control+Right',
  'F11',
  'F12'
];

interface ShortcutConflict {
  shortcut: string;
  conflictType: 'system' | 'app';
  appName?: string;
  description?: string;
}

/**
 * システムショートカットキーとの競合をチェック
 */
export const checkSystemShortcutConflicts = (shortcut: string): ShortcutConflict[] => {
  const conflicts: ShortcutConflict[] = [];
  
  // 正規化された形式でチェック
  const normalizedShortcut = normalizeShortcut(shortcut);
  
  // システムショートカットとの競合チェック
  for (const sysShortcut of MAC_SYSTEM_SHORTCUTS) {
    if (normalizeShortcut(sysShortcut) === normalizedShortcut) {
      conflicts.push({
        shortcut: sysShortcut,
        conflictType: 'system',
        description: getSystemShortcutDescription(sysShortcut)
      });
    }
  }
  
  return conflicts;
};

/**
 * アクティブなアプリケーションのショートカットキーを取得
 */
export const getActiveAppShortcuts = async (): Promise<string[]> => {
  try {
    // アクティブなアプリケーションを取得
    const { stdout: activeApp } = await execAsync(`
      osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
    `);
    
    const appName = activeApp.trim().replace(/"/g, '');
    
    // そのアプリのメニューバーからショートカットを抽出
    const shortcuts = await extractAppShortcuts(appName);
    return shortcuts;
  } catch (error) {
    console.error('Failed to get active app shortcuts:', error);
    return [];
  }
};

/**
 * 指定されたアプリケーションのショートカットキーを抽出
 */
export const extractAppShortcuts = async (appName: string): Promise<string[]> => {
  try {
    const { stdout } = await execAsync(`
      osascript -e '
        tell application "System Events"
          tell process "${appName}"
            try
              set menuItems to every menu item of every menu of menu bar 1
              set shortcutList to {}
              repeat with menuItem in menuItems
                try
                  set keyEquivalent to keyboard equivalent of menuItem
                  set modifiers to keyboard modifiers of menuItem
                  if keyEquivalent is not "" then
                    set shortcutText to ""
                    if modifiers contains command down then
                      set shortcutText to shortcutText & "Cmd+"
                    end if
                    if modifiers contains option down then
                      set shortcutText to shortcutText & "Option+"
                    end if
                    if modifiers contains control down then
                      set shortcutText to shortcutText & "Control+"
                    end if
                    if modifiers contains shift down then
                      set shortcutText to shortcutText & "Shift+"
                    end if
                    set shortcutText to shortcutText & keyEquivalent
                    set end of shortcutList to shortcutText
                  end if
                end try
              end repeat
              return shortcutList
            end try
          end tell
        end tell
      '
    `);
    
    // AppleScriptの出力を解析
    const result = stdout.trim();
    if (result && result !== '{}') {
      // AppleScriptのリスト形式を解析
      const shortcuts = result.replace(/{|}/g, '').split(', ').map(s => s.trim().replace(/"/g, ''));
      return shortcuts.filter(s => s.length > 0);
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to extract shortcuts for ${appName}:`, error);
    return [];
  }
};

/**
 * アプリケーションショートカットとの競合をチェック
 */
export const checkAppShortcutConflicts = async (shortcut: string): Promise<ShortcutConflict[]> => {
  const conflicts: ShortcutConflict[] = [];
  
  try {
    // 現在フォーカスされているアプリを取得
    const { stdout: activeApp } = await execAsync(`
      osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
    `);
    
    const appName = activeApp.trim().replace(/"/g, '');
    const appShortcuts = await extractAppShortcuts(appName);
    
    const normalizedShortcut = normalizeShortcut(shortcut);
    
    for (const appShortcut of appShortcuts) {
      if (normalizeShortcut(appShortcut) === normalizedShortcut) {
        conflicts.push({
          shortcut: appShortcut,
          conflictType: 'app',
          appName: appName,
          description: `${appName}のショートカットキーと競合`
        });
      }
    }
  } catch (error) {
    console.error('Failed to check app shortcut conflicts:', error);
  }
  
  return conflicts;
};

/**
 * ショートカットキーを正規化（統一された形式に変換）
 */
const normalizeShortcut = (shortcut: string): string => {
  return shortcut
    .replace(/\s+/g, '')
    .replace(/Command/gi, 'Cmd')
    .replace(/Alt/gi, 'Option')
    .replace(/Ctrl/gi, 'Control')
    .toLowerCase();
};

/**
 * システムショートカットの説明を取得
 */
const getSystemShortcutDescription = (shortcut: string): string => {
  const descriptions: { [key: string]: string } = {
    'Cmd+Space': 'Spotlight検索',
    'Cmd+Tab': 'アプリケーション切り替え',
    'Cmd+`': '同一アプリ内のウィンドウ切り替え',
    'Cmd+Q': 'アプリケーション終了',
    'Cmd+W': 'ウィンドウを閉じる',
    'Cmd+T': '新しいタブ',
    'Cmd+R': '再読み込み',
    'Cmd+A': 'すべて選択',
    'Cmd+S': '保存',
    'Cmd+F': '検索',
    'Cmd+C': 'コピー',
    'Cmd+V': '貼り付け',
    'Cmd+Z': '元に戻す',
    'Cmd+X': '切り取り',
    'Cmd+Shift+3': 'スクリーンショット（全画面）',
    'Cmd+Shift+4': 'スクリーンショット（選択範囲）',
    'Cmd+Shift+5': 'スクリーンショット・録画メニュー',
    'Cmd+Option+Esc': 'アプリケーションの強制終了',
    'Cmd+Control+Space': '絵文字・記号ビューワー',
    'Control+Up': 'Mission Control',
    'Control+Down': 'アプリケーションウィンドウ',
    'F11': 'デスクトップを表示',
    'F12': 'Dashboard'
  };
  
  return descriptions[shortcut] || 'システムショートカット';
};

/**
 * すべての競合をチェック
 */
export const checkAllShortcutConflicts = async (shortcut: string): Promise<ShortcutConflict[]> => {
  const systemConflicts = checkSystemShortcutConflicts(shortcut);
  const appConflicts = await checkAppShortcutConflicts(shortcut);
  
  return [...systemConflicts, ...appConflicts];
};