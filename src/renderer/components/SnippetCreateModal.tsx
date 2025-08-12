import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, shortcutKey: string, content: string) => void;
  existingShortcuts: string[];
  initialContent?: string;
};


const SnippetCreateModal = ({ isOpen, onClose, onCreate, existingShortcuts, initialContent }: Props) => {
  const [name, setName] = useState('');
  const [shortcutKey, setShortcutKey] = useState('');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [shortcutError, setShortcutError] = useState('');
  const [conflictWarnings, setConflictWarnings] = useState<Array<{ type: string; description: string; appName?: string }>>([]);

  // モーダルが開かれた時に初期コンテンツを設定
  useEffect(() => {
    if (isOpen && initialContent) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim() && shortcutKey.trim() && content.trim()) {
      // ショートカットキーの重複チェック
      if (existingShortcuts.includes(shortcutKey.trim())) {
        setShortcutError('このショートカットキーは既に使用されています');
        return;
      }
      onCreate(name.trim(), shortcutKey.trim(), content.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setShortcutKey('');
    setContent('');
    setIsRecording(false);
    setShortcutError('');
    setConflictWarnings([]);
    onClose();
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

  // 現在のショートカットが使用可能かチェック
  const isCurrentShortcutAvailable = !existingShortcuts.includes(shortcutKey);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-[480px] max-w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">新しいスニペットを作成</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: handleSubmit"
            />
          </div>

          {/* ホットキー */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ホットキー
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
                className={`flex-1 border rounded-md p-3 focus:outline-none focus:ring-2 font-mono ${
                  !isCurrentShortcutAvailable || shortcutError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="例: Cmd+Option+1"
                readOnly={isRecording}
              />
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-3 rounded-md text-sm font-medium ${
                  isRecording 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {isRecording ? '記録中...' : '記録'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              記録ボタンを押してからキーを押すか、直接入力してください
            </p>
            {(shortcutError || !isCurrentShortcutAvailable) && (
              <p className="text-red-600 text-sm mt-1">
                {shortcutError || 'このショートカットキーは既に使用されています'}
              </p>
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
          </div>
          
          {/* テキスト内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テキスト内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="スニペットの内容を入力..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !shortcutKey.trim() || !content.trim() || !isCurrentShortcutAvailable || !!shortcutError}
            className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            作成
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default SnippetCreateModal;