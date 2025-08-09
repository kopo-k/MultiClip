import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, shortcutKey: string) => void;
  initialContent?: string;
  initialShortcutKey?: string;
};

const SnippetEditModal = ({ isOpen, onClose, onSave, initialContent = '', initialShortcutKey = '' }: Props) => {
  const [content, setContent] = useState(initialContent);
  const [shortcutKey, setShortcutKey] = useState(initialShortcutKey);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    setContent(initialContent);
    setShortcutKey(initialShortcutKey);
  }, [initialContent, initialShortcutKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (content.trim() && shortcutKey.trim()) {
      onSave(content.trim(), shortcutKey.trim());
      onClose();
    }
  };

  const handleKeyRecord = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    e.preventDefault();
    
    const keys = [];
    if (e.metaKey) keys.push('Cmd');
    if (e.altKey) keys.push('Option');
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    
    if (e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Control' && e.key !== 'Shift') {
      keys.push(e.key);
    }
    
    if (keys.length > 1) {
      setShortcutKey(keys.join('+'));
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">スニペット編集</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              コンテンツ
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="スニペットの内容を入力..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ショートカットキー
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shortcutKey}
                onChange={(e) => setShortcutKey(e.target.value)}
                onKeyDown={handleKeyRecord}
                className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="例: Cmd+Option+1"
                readOnly={isRecording}
              />
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isRecording 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {isRecording ? '記録中...' : '記録'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              記録ボタンを押してからキーを押すか、直接入力してください
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || !shortcutKey.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnippetEditModal;