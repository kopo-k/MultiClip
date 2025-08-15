// components/HeaderBar.tsx
import { useState } from 'react';
import { Clipboard, Settings, HelpCircle } from 'lucide-react';
import HelpModal from './HelpModal';

interface HeaderBarProps {
  onSettingsClick?: () => void;
  globalShortcut?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ onSettingsClick, globalShortcut }) => {
  const [showHelp, setShowHelp] = useState(false);

  // ショートカットキーの表示形式を整える
  const formatShortcut = (shortcut: string | undefined) => {
    if (!shortcut) return '⌘+Shift+C'; // デフォルト
    
    return shortcut
      .replace('CommandOrControl', '⌘')
      .replace('Command', '⌘')
      .replace('Cmd', '⌘')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Option')
      .replace('Control', 'Ctrl')
      .replace('Ctrl', 'Ctrl');
  };

  return (
    <>
      <div className="draggable select-none h-7 px-2 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clipboard className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold">MultiClip</h1>
        </div>
        <div className="flex items-center gap-3 no-drag">
          <div className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
            {formatShortcut(globalShortcut)}
          </div>
          <button title="設定" onClick={onSettingsClick}>
            <Settings className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
          <button title="ヘルプ" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
        </div>
      </div>

      {/* モーダルの表示 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default HeaderBar;
