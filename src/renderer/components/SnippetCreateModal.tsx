import React, { useState } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, shortcutKey: string, content: string) => void;
};

// 事前定義されたショートカットキーのオプション
const SHORTCUT_OPTIONS = [
  'Cmd+Option+1',
  'Cmd+Option+2', 
  'Cmd+Option+3',
  'Cmd+Option+4',
  'Cmd+Option+5',
  'Cmd+Option+6',
  'Cmd+Option+7',
  'Cmd+Option+8',
  'Cmd+Option+9',
  'Cmd+Option+0',
  'Cmd+Shift+1',
  'Cmd+Shift+2',
  'Cmd+Shift+3',
  'Cmd+Shift+4',
  'Cmd+Shift+5'
];

const SnippetCreateModal = ({ isOpen, onClose, onCreate }: Props) => {
  const [name, setName] = useState('');
  const [shortcutKey, setShortcutKey] = useState('Cmd+Option+1');
  const [content, setContent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim() && shortcutKey.trim() && content.trim()) {
      onCreate(name.trim(), shortcutKey.trim(), content.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setShortcutKey('Cmd+Option+1');
    setContent('');
    setShowDropdown(false);
    onClose();
  };

  const selectShortcut = (shortcut: string) => {
    setShortcutKey(shortcut);
    setShowDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[480px] max-w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">新しいスニペットを作成</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* スニペット名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スニペット名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: handleSubmit"
            />
          </div>

          {/* ホットキー */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ホットキー (Cmd+Option+数字)
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full border border-gray-300 rounded-md p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center bg-white font-mono"
              >
                <span>{shortcutKey}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                  {SHORTCUT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => selectShortcut(option)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 font-mono text-sm ${
                        shortcutKey === option ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* テキスト内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テキスト内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="スニペットの内容を入力..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !shortcutKey.trim() || !content.trim()}
            className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            作成
          </button>
        </div>
      </div>
      
      {/* ドロップダウンが開いているときは背景クリックで閉じる */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default SnippetCreateModal;