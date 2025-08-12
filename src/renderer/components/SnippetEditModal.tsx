import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, shortcutKey: string, snippetName: string) => void;
  initialContent?: string;
  initialShortcutKey?: string;
  initialSnippetName?: string;
  existingShortcuts: string[];
  currentSnippetId?: number;
};

const SnippetEditModal = ({ isOpen, onClose, onSave, initialContent = '', initialShortcutKey = '', initialSnippetName = '', existingShortcuts, currentSnippetId }: Props) => {
  const [content, setContent] = useState(initialContent);
  const [shortcutKey, setShortcutKey] = useState(initialShortcutKey);
  const [snippetName, setSnippetName] = useState(initialSnippetName);
  const [isRecording, setIsRecording] = useState(false);
  const [shortcutError, setShortcutError] = useState('');
  const [conflictWarnings, setConflictWarnings] = useState<Array<{ type: string; description: string; appName?: string }>>([]);

  useEffect(() => {
    setContent(initialContent);
    setShortcutKey(initialShortcutKey);
    setSnippetName(initialSnippetName);
    setShortcutError('');
    setConflictWarnings([]);
  }, [initialContent, initialShortcutKey, initialSnippetName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (content.trim() && shortcutKey.trim()) {
      // ショートカットキーの重複チェック（自分以外のスニペットと重複していないか）
      const otherShortcuts = existingShortcuts.filter((_, index) => {
        // 現在編集中のスニペットのショートカットは除外
        return initialShortcutKey !== shortcutKey || existingShortcuts[index] !== initialShortcutKey;
      });
      
      if (otherShortcuts.includes(shortcutKey.trim()) && shortcutKey.trim() !== initialShortcutKey) {
        setShortcutError('このショートカットキーは既に使用されています');
        return;
      }
      
      onSave(content.trim(), shortcutKey.trim(), snippetName.trim());
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
    
    // モディファイアキー以外の実際のキーが押された場合のみ記録を完了
    if (e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Control' && e.key !== 'Shift') {
      // 通常のキーが押された場合
      if (e.key.length === 1) {
        // 単一文字のキー（a, b, c, 1, 2, 3 など）
        keys.push(e.key.toUpperCase());
      } else {
        // 特殊キー（F1, Enter, Space, Escape など）
        keys.push(e.key);
      }
      
      // モディファイアキーと通常キーの組み合わせが揃った場合のみ記録完了
      if (keys.length > 1) {
        const newShortcut = keys.join('+');
        setShortcutKey(newShortcut);
        setIsRecording(false);
        
        // エラーをクリア
        if (shortcutError) {
          setShortcutError('');
        }
        
        // 競合チェック
        checkShortcutConflicts(newShortcut);
      }
    }
    // モディファイアキーのみの場合は記録を継続
  };

  const checkShortcutConflicts = async (shortcut: string) => {
    try {
      const conflicts = await window.api.checkShortcutConflicts(shortcut);
      setConflictWarnings(conflicts.map(c => ({
        type: c.conflictType,
        description: c.description || '',
        appName: c.appName
      })));
    } catch (error) {
      console.error('Failed to check shortcut conflicts:', error);
      setConflictWarnings([]);
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
          {/* スニペット名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スニペット名
            </label>
            <input
              type="text"
              value={snippetName}
              onChange={(e) => setSnippetName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: handleSubmit"
            />
          </div>

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
                onChange={(e) => {
                  if (!isRecording) {
                    setShortcutKey(e.target.value);
                    if (shortcutError) setShortcutError('');
                    if (e.target.value.trim()) {
                      checkShortcutConflicts(e.target.value.trim());
                    }
                  }
                }}
                onKeyDown={handleKeyRecord}
                className={`flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 font-mono ${
                  shortcutError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="例: Cmd+Option+1"
                readOnly={isRecording}
              />
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isRecording 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {isRecording ? '記録中...' : '記録'}
              </button>
            </div>
            {shortcutError && (
              <p className="text-red-600 text-sm mt-1">{shortcutError}</p>
            )}
            {conflictWarnings.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center text-yellow-800 text-sm font-medium mb-1">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  競合の可能性があります
                </div>
                <div className="space-y-1">
                  {conflictWarnings.map((warning, index) => (
                    <p key={index} className="text-yellow-700 text-xs">
                      • {warning.type === 'system' ? 'システム' : 'アプリ'}
                      {warning.appName && ` (${warning.appName})`}
                      : {warning.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
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
            disabled={!content.trim() || !shortcutKey.trim() || !!shortcutError}
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