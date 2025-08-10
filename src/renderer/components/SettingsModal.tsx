import React, { useState, useEffect } from 'react';
import { X, Settings, Monitor, Clock, Keyboard, Database, Info, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppSettings {
  autoStart: boolean;
  showWindowOnStartup: boolean;
  historyLimit: number;
  favoriteLimit: number;
  globalShortcut: string;
  theme: 'light' | 'dark' | 'system';
  windowSize: { width: number; height: number };
  windowPosition: { x: number; y: number };
  windowPositionMode: 'center' | 'left-bottom' | 'center-bottom' | 'right-bottom' | 'remember-last' | 'custom';
  opacity: number;
  alwaysOnTop: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'history' | 'hotkey' | 'display' | 'data' | 'info'>('basic');
  const [settings, setSettings] = useState<AppSettings>({
    autoStart: false,
    showWindowOnStartup: true,
    historyLimit: 50,
    favoriteLimit: 100,
    globalShortcut: 'Cmd+Shift+C',
    theme: 'system',
    windowSize: { width: 500, height: 500 },
    windowPosition: { x: -1, y: -1 },
    windowPositionMode: 'center',
    opacity: 100,
    alwaysOnTop: false
  });


  useEffect(() => {
    if (isOpen) {
      // 設定の読み込み
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.api.loadSettings();
      if (loadedSettings) {
        // 設定にwindowPositionが存在しない場合はデフォルト値を設定
        const safeSettings = {
          ...loadedSettings,
          windowPosition: loadedSettings.windowPosition || { x: -1, y: -1 },
          windowPositionMode: loadedSettings.windowPositionMode || 'center'
        };
        setSettings(safeSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await window.api.saveSettings(settings);
      if (success) {
        // すべての設定を適用
        await applyAllSettings();
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const applyAllSettings = async () => {
    try {
      // 自動起動設定
      await window.api.setAutoStart(settings.autoStart);
      
      // グローバルショートカット
      await window.api.changeGlobalShortcut(settings.globalShortcut);
      
      // ウィンドウ設定
      await window.api.updateWindowSettings({
        width: settings.windowSize.width,
        height: settings.windowSize.height,
        x: settings.windowPosition?.x ?? -1,
        y: settings.windowPosition?.y ?? -1,
        opacity: settings.opacity,
        alwaysOnTop: settings.alwaysOnTop
      });
      
      // 履歴制限
      await window.api.setHistoryLimit(settings.historyLimit);
      await window.api.setFavoriteLimit(settings.favoriteLimit);
      
      // テーマ
      await window.api.changeTheme(settings.theme);
      
    } catch (error) {
      console.error('Failed to apply settings:', error);
    }
  };

  // ショートカットキーを内部形式に変換
  const convertShortcutToElectron = (shortcut: string): string => {
    return shortcut
      .replace(/Cmd/g, 'Command')
      .replace(/Ctrl/g, 'Control')
      .replace(/Alt/g, 'Alt')
      .replace(/Shift/g, 'Shift');
  };

  // ポジションモードから座標を計算
  const calculatePositionFromMode = async (mode: string) => {
    try {
      const screenInfo = await window.api.getScreenInfo();
      const { width: screenWidth, height: screenHeight } = screenInfo.primaryDisplay.workAreaSize;
      const windowWidth = settings.windowSize.width;
      const windowHeight = settings.windowSize.height;
      
      switch (mode) {
        case 'center':
          return { 
            x: Math.round((screenWidth - windowWidth) / 2), 
            y: Math.round((screenHeight - windowHeight) / 2) 
          };
        case 'left-bottom':
          return { 
            x: 20, 
            y: screenHeight - windowHeight - 20 
          };
        case 'center-bottom':
          return { 
            x: Math.round((screenWidth - windowWidth) / 2), 
            y: screenHeight - windowHeight - 20 
          };
        case 'right-bottom':
          return { 
            x: screenWidth - windowWidth - 20, 
            y: screenHeight - windowHeight - 20 
          };
        case 'remember-last':
          // 現在の位置を取得して記憶
          return await window.api.getCurrentWindowPosition();
        case 'custom':
          // 現在の設定値をそのまま使用
          return settings.windowPosition;
        default:
          return { x: -1, y: -1 };
      }
    } catch (error) {
      console.error('Failed to calculate position:', error);
      return null;
    }
  };

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // 特定の設定は即座に反映
    try {
      switch (key) {
        case 'globalShortcut':
          const electronShortcut = convertShortcutToElectron(value);
          await window.api.changeGlobalShortcut(electronShortcut);
          break;
        case 'opacity':
          await window.api.updateWindowSettings({ opacity: value });
          break;
        case 'alwaysOnTop':
          await window.api.updateWindowSettings({ alwaysOnTop: value });
          break;
        case 'historyLimit':
          await window.api.setHistoryLimit(value);
          break;
        case 'favoriteLimit':
          await window.api.setFavoriteLimit(value);
          break;
        case 'theme':
          await window.api.changeTheme(value);
          break;
        case 'autoStart':
          await window.api.setAutoStart(value);
          break;
        case 'windowSize':
          await window.api.updateWindowSettings({ 
            width: value.width, 
            height: value.height 
          });
          break;
        case 'windowPosition':
          await window.api.updateWindowSettings({ 
            x: value.x, 
            y: value.y 
          });
          break;
        case 'windowPositionMode':
          // ポジションモードの変更時は位置も自動計算
          const calculatedPosition = await calculatePositionFromMode(value);
          if (calculatedPosition) {
            setSettings(prev => ({
              ...prev,
              windowPosition: calculatedPosition,
              windowPositionMode: value
            }));
            await window.api.updateWindowSettings({ 
              x: calculatedPosition.x, 
              y: calculatedPosition.y 
            });
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to apply ${key} setting:`, error);
    }
  };

  const clearAllHistory = async () => {
    if (confirm('履歴をすべて削除しますか？この操作は元に戻せません。（お気に入りとスニペットは保持されます）')) {
      try {
        const success = await window.api.clearAllHistory();
        if (success) {
          alert('履歴を削除しました。');
        } else {
          alert('履歴の削除に失敗しました。');
        }
      } catch (error) {
        console.error('Failed to clear history:', error);
        alert('履歴の削除中にエラーが発生しました。');
      }
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: '基本設定', icon: Settings },
    { id: 'history', label: '履歴・保存', icon: Clock },
    { id: 'hotkey', label: 'ホットキー', icon: Keyboard },
    { id: 'display', label: '表示・UI', icon: Monitor },
    { id: 'data', label: 'データ管理', icon: Database },
    { id: 'info', label: '情報・サポート', icon: Info }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            style={{ cursor: 'pointer' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* サイドバー */}
          <div className="w-48 bg-gray-50 border-r flex-shrink-0">
            <nav className="p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded mb-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* コンテンツエリア */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本設定</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoStart}
                      onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                      className="mr-2"
                    />
                    システム起動時に自動で開始する
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.showWindowOnStartup}
                      onChange={(e) => handleSettingChange('showWindowOnStartup', e.target.checked)}
                      className="mr-2"
                    />
                    アプリ起動時にウィンドウを表示する
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">履歴・保存設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      履歴の保存件数: {settings.historyLimit}件
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={settings.historyLimit}
                      onChange={(e) => handleSettingChange('historyLimit', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10件</span>
                      <span>500件</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      お気に入りの保存件数: {settings.favoriteLimit}件
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      value={settings.favoriteLimit}
                      onChange={(e) => handleSettingChange('favoriteLimit', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50件</span>
                      <span>1000件</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hotkey' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">ホットキー設定</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      アプリ表示/非表示
                    </label>
                    <input
                      type="text"
                      value={settings.globalShortcut}
                      onChange={(e) => handleSettingChange('globalShortcut', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Cmd+Shift+C"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>利用可能なキー: Cmd, Ctrl, Alt, Shift + A-Z, 0-9</p>
                    <p>例: Cmd+Shift+C, Ctrl+Alt+V</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">表示・UI設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">テーマ</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="light">ライト</option>
                      <option value="dark">ダーク</option>
                      <option value="system">システム追従</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ウィンドウサイズ</label>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          幅: {settings.windowSize.width}px
                        </label>
                        <input
                          type="range"
                          min="400"
                          max="1200"
                          step="10"
                          value={settings.windowSize.width}
                          onChange={(e) => handleSettingChange('windowSize', {
                            ...settings.windowSize,
                            width: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>400px</span>
                          <span>1200px</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          高さ: {settings.windowSize.height}px
                        </label>
                        <input
                          type="range"
                          min="400"
                          max="1000"
                          step="10"
                          value={settings.windowSize.height}
                          onChange={(e) => handleSettingChange('windowSize', {
                            ...settings.windowSize,
                            height: parseInt(e.target.value)
                          })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>400px</span>
                          <span>1000px</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ウィンドウ初期位置</label>
                    <div className="space-y-3">
                      <select
                        value={settings.windowPositionMode}
                        onChange={(e) => handleSettingChange('windowPositionMode', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="center">画面中央</option>
                        <option value="left-bottom">左下</option>
                        <option value="center-bottom">中央下</option>
                        <option value="right-bottom">右下</option>
                        <option value="remember-last">最後の位置を記憶</option>
                        <option value="custom">カスタム位置</option>
                      </select>
                      
                      {settings.windowPositionMode === 'custom' && (
                        <div className="flex gap-4 mt-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">X座標</label>
                            <input
                              type="number"
                              min="0"
                              max="2000"
                              value={settings.windowPosition?.x === -1 ? 100 : settings.windowPosition?.x || 100}
                              onChange={(e) => {
                                const x = parseInt(e.target.value) || 0;
                                handleSettingChange('windowPosition', {
                                  ...(settings.windowPosition || { x: -1, y: -1 }),
                                  x: Math.max(0, Math.min(2000, x))
                                });
                              }}
                              className="w-20 p-1 border rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Y座標</label>
                            <input
                              type="number"
                              min="0"
                              max="2000"
                              value={settings.windowPosition?.y === -1 ? 100 : settings.windowPosition?.y || 100}
                              onChange={(e) => {
                                const y = parseInt(e.target.value) || 0;
                                handleSettingChange('windowPosition', {
                                  ...(settings.windowPosition || { x: -1, y: -1 }),
                                  y: Math.max(0, Math.min(2000, y))
                                });
                              }}
                              className="w-20 p-1 border rounded text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const currentPos = await window.api.getCurrentWindowPosition();
                                if (currentPos) {
                                  handleSettingChange('windowPosition', currentPos);
                                }
                              } catch (error) {
                                console.error('Failed to get current position:', error);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            現在位置を取得
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        アプリ起動時のウィンドウ表示位置を設定します
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      透明度: {settings.opacity}%
                    </label>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={settings.opacity}
                      onChange={(e) => handleSettingChange('opacity', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.alwaysOnTop}
                      onChange={(e) => handleSettingChange('alwaysOnTop', e.target.checked)}
                      className="mr-2"
                    />
                    常に最前面に表示
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">データ管理</h3>
                <div className="space-y-3">
                  <button
                    onClick={clearAllHistory}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    履歴の一括削除
                  </button>
                  <p className="text-sm text-gray-600">
                    すべての履歴データを削除します。この操作は元に戻せません。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">情報・サポート</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">アプリ情報</h4>
                    <p className="text-sm text-gray-600">バージョン: 1.0.0</p>
                    <p className="text-sm text-gray-600">ライセンス: MIT</p>
                  </div>
                  <div>
                    <h4 className="font-medium">ヘルプ</h4>
                    <div className="space-y-2 text-sm">
                      <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+Shift+C</kbd> アプリ表示/非表示</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> 選択したアイテムをコピー</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑/↓</kbd> アイテム選択</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
                    <HelpCircle className="w-4 h-4" />
                    問題の報告
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              saveSettings();
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;