import ClipListItem from './ClipListItem';
import { Plus } from 'lucide-react';

type Clip = {
  id: number;
  content: string;
  isFavorite?: boolean;
  isSnippet?: boolean;
  shortcutKey?: string;
  isEnabled?: boolean;
};

type Props = {
  clips: Clip[];
  currentTab: 'history' | 'favorites' | 'snippets';
  search: string;
  onToggleFavorite: (id: number) => void;
  onToggleSnippet?: (id: number) => void;
  onEditSnippet?: (id: number) => void;
  onDeleteSnippet?: (id: number) => void;
  onToggleSnippetEnabled?: (id: number) => void;
  onCreateNewSnippet?: () => void;
  onCopy?: (content: string) => void;
};

const ClipList = ({ clips, currentTab, search, onToggleFavorite, onToggleSnippet, onEditSnippet, onDeleteSnippet, onToggleSnippetEnabled, onCreateNewSnippet, onCopy }: Props) => {
  const filtered = clips
    .filter((clip) => {
      if (currentTab === 'favorites') return clip.isFavorite;
      if (currentTab === 'snippets') return clip.isSnippet;
      // 履歴タブではスニペットを除外
      if (currentTab === 'history') return !clip.isSnippet;
      return true;
    })
    .filter((clip) => clip.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mt-3">
      {/* スニペットタブの場合、作成ボタンを表示 */}
      {currentTab === 'snippets' && onCreateNewSnippet && (
        <button
          onClick={onCreateNewSnippet}
          className="w-full mb-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">新しいスニペットを作成</span>
        </button>
      )}
      
      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <li className="text-gray-400 text-sm text-center py-8">
            {currentTab === 'snippets' ? 'スニペットがありません' : 'データがありません'}
          </li>
        ) : (
          filtered.map((clip) => (
            <ClipListItem
              key={clip.id}
              content={clip.content}
              isFavorite={!!clip.isFavorite}
              isSnippet={!!clip.isSnippet}
              shortcutKey={clip.shortcutKey}
              isEnabled={clip.isEnabled}
              onToggleFavorite={() => onToggleFavorite(clip.id)}
              onToggleSnippet={onToggleSnippet ? () => onToggleSnippet(clip.id) : undefined}
              onEditSnippet={onEditSnippet ? () => onEditSnippet(clip.id) : undefined}
              onDeleteSnippet={onDeleteSnippet ? () => onDeleteSnippet(clip.id) : undefined}
              onToggleSnippetEnabled={onToggleSnippetEnabled ? () => onToggleSnippetEnabled(clip.id) : undefined}
              onCopy={onCopy}
            />
          ))
        )}
      </ul>
    </div>
  );
};

export default ClipList;
