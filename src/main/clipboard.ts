import { clipboard } from 'electron';
import { addClip } from './db';

let lastText = ''; // 前回のクリップボード内容
let intervalId: NodeJS.Timeout | null = null;

/**
 * クリップボードの内容を監視し、変更があれば onChange を呼び出す
 * @param onChange 変化があったときに呼ばれるコールバック
 * @param intervalMs 監視間隔（ミリ秒、デフォルト：1000ms）
 */
export function startClipboardWatcher(onChange: (text: string) => void, intervalMs = 1000) {
  if (intervalId) return; // 二重起動を防止
  
  // 初期値を設定
  lastText = clipboard.readText();
  
  // クリップボードの内容を監視し、変更があれば onChange を呼び出す
  intervalId = setInterval(() => {
    const currentText = clipboard.readText();
    if (currentText && currentText !== lastText) {
      console.log('Clipboard changed:', currentText.substring(0, 50) + '...');
      lastText = currentText;
      try {
        addClip(currentText); // クリップボードの内容をDBに保存する
        // データベース操作完了後に通知を送る
        onChange(currentText); // 変化を通知
      } catch (error) {
        console.error('Failed to add clip to database:', error);
      }
    }
  }, intervalMs);
}

/**
 * クリップボードの監視を停止する
 */
export function stopClipboardWatcher() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * 現在のクリップボードのテキストを取得する
 */
export function getClipboardText(): string {
  return clipboard.readText();
}
