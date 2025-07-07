import ClipListItem from './ClipListItem';

type Clip = {
  id: number;
  content: string;
  tag?: string;
  isFavorite?: boolean;
  isSnippet?: boolean;
};

type Props = {
  clips: Clip[];
  currentTab: 'history' | 'favorites' | 'snippets';
  search: string;
  onToggleFavorite: (id: number) => void;
};

const ClipList = ({ clips, currentTab, search, onToggleFavorite }: Props) => {
  const filtered = clips
    .filter((clip) => {
      if (currentTab === 'favorites') return clip.isFavorite;
      if (currentTab === 'snippets') return clip.isSnippet;
      return true;
    })
    .filter((clip) => clip.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <ul className="space-y-2 mt-3">
      {filtered.length === 0 ? (
        <li className="text-gray-400 text-sm text-center">データがありません</li>
      ) : (
        filtered.map((clip) => (
          <ClipListItem
            key={clip.id}
            content={clip.content}
            tag={clip.tag || 'レポート'}
            isFavorite={!!clip.isFavorite}
            onToggleFavorite={() => onToggleFavorite(clip.id)}
          />
        ))
      )}
    </ul>
  );
};

export default ClipList;
