import { app } from 'electron';

let robotjs: any = null;

// robotjsを安全に初期化
function initializeRobot() {
  if (robotjs) return robotjs;
  
  try {
    robotjs = require('robotjs');
    
    // robotjsの設定
    robotjs.setKeyboardDelay(1);
    
    console.log('✅ robotjs initialized successfully');
    return robotjs;
  } catch (error) {
    console.error('❌ Failed to initialize robotjs:', error);
    return null;
  }
}

/**
 * テキストを直接入力する関数
 * @param text 入力するテキスト
 * @param delay 入力前の遅延時間（ms）
 * @returns 成功したかどうか
 */
export async function typeText(text: string, delay: number = 150): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const robot = initializeRobot();
      
      if (!robot) {
        console.warn('robotjs not available, cannot type text directly');
        resolve(false);
        return;
      }
      
      try {
        // macOSでは追加の権限チェック
        if (process.platform === 'darwin') {
          // アクセシビリティ権限をチェック（macOS 10.14+）
          const hasAccessibility = await checkAccessibilityPermission();
          if (!hasAccessibility) {
            console.warn('Accessibility permission required for text typing on macOS');
            resolve(false);
            return;
          }
        }
        
        // テキストを入力
        robot.typeString(text);
        console.log(`✅ Text typed successfully: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        resolve(true);
        
      } catch (error) {
        console.error('❌ Failed to type text:', error);
        resolve(false);
      }
    }, delay);
  });
}

/**
 * macOSでアクセシビリティ権限があるかチェック
 */
async function checkAccessibilityPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') return true;
  
  try {
    const robot = initializeRobot();
    if (!robot) return false;
    
    // 簡単なテストでアクセシビリティ権限をチェック
    const pos = robot.getMousePos();
    return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
  } catch (error) {
    console.warn('Accessibility permission check failed:', error);
    return false;
  }
}

/**
 * アクセシビリティ権限を要求するダイアログを表示
 */
export function showAccessibilityDialog() {
  if (process.platform === 'darwin') {
    const { shell } = require('electron');
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  }
}