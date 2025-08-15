import { Copy, Star, MoreVertical, Edit, Trash2, Keyboard } from 'lucide-react';
import { useState } from 'react';
import Tooltip from './Tooltip';

type Props = {
  content: string;
  isFavorite: boolean;
  isSnippet?: boolean;
  shortcutKey?: string;
  snippetName?: string;
  isEnabled?: boolean;
  currentTab?: 'history' | 'favorites' | 'snippets';
  onToggleFavorite: () => void;
  onToggleSnippet?: () => void;
  onEditSnippet?: () => void;
  onDeleteSnippet?: () => void;
  onDeleteHistoryItem?: () => void;
  onToggleSnippetEnabled?: () => void;
  onCopy?: (content: string) => void;
  onCreateSnippetWithContent?: (content: string) => void;
};

const ClipListItem = ({ 
  content, 
  isFavorite, 
  isSnippet, 
  shortcutKey, 
  snippetName,
  isEnabled,
  currentTab,
  onToggleFavorite, 
  onToggleSnippet, 
  onEditSnippet, 
  onDeleteSnippet, 
  onDeleteHistoryItem,
  onToggleSnippetEnabled,
  onCopy,
  onCreateSnippetWithContent
}: Props) => {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <li className={`border rounded-lg p-3 text-sm flex flex-col no-drag relative ${
      isSnippet && currentTab === 'snippets' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
    }`}>
      {/* スニペットタブの場合のみ、スニペット名とショートカットキーを表示 */}
      {isSnippet && shortcutKey && currentTab === 'snippets' && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {snippetName && (
              <span className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded-md font-medium">
                {snippetName}
              </span>
            )}
            <span className="text-xs text-blue-600 font-mono">{shortcutKey}</span>
          </div>
          <button
            onClick={() => onToggleSnippetEnabled?.()}
            className="flex items-center gap-1 hover:bg-blue-200 px-2 py-1 rounded-md transition-colors"
            title="有効/無効を切り替え"
          >
            <span className={`w-3 h-3 rounded-full ${
              isEnabled !== false ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
            <span className="text-xs text-gray-500">
              {isEnabled !== false ? '有効' : '無効'}
            </span>
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Tooltip content={content} maxLength={40} className="flex-1 min-w-0">
          <span className="truncate block">{content}</span>
        </Tooltip>
        <div className="flex gap-2 ml-2 shrink-0">
          <button 
            title="コピー"
            onClick={() => onCopy?.(content)}
          >
            <Copy className="w-4 h-4 text-gray-600 hover:text-black" />
          </button>
          <button
            title="お気に入り"
            onClick={onToggleFavorite}
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'text-yellow-500' : 'text-gray-600'
              } hover:text-yellow-500`}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </button>
          <button 
            title="その他"
            onClick={() => setShowMenu(!showMenu)}
            className="relative"
          >
            <MoreVertical className="w-4 h-4 text-gray-600 hover:text-black" />
            
            {/* コンテキストメニュー */}
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-2 min-w-[150px] z-10">
                {!isSnippet ? (
                  <>
                    <button
                      onClick={() => {
                        onCreateSnippetWithContent?.(content);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Keyboard className="w-4 h-4" />
                      スニペットに追加
                    </button>
                    {(currentTab === 'history' || currentTab === 'favorites') && (
                      <button
                        onClick={() => {
                          onDeleteHistoryItem?.();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-1 hover:bg-red-100 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {currentTab === 'history' && isFavorite ? '履歴から削除' : '削除'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onEditSnippet?.();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      スニペット編集
                    </button>
                    <button
                      onClick={() => {
                        onToggleSnippetEnabled?.();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 rounded-full ${
                        isEnabled !== false ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      {isEnabled !== false ? '無効にする' : '有効にする'}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteSnippet?.();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-red-100 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      削除
                    </button>
                  </>
                )}
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* メニューが開いているときは背景クリックで閉じる */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </li>
  );
};

export default ClipListItem;
