import { Copy, Star, MoreVertical } from 'lucide-react';

type Props = {
  content: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const ClipListItem = ({ content, isFavorite, onToggleFavorite }: Props) => {
  return (
    <li className="border rounded-lg p-3 bg-gray-50 text-sm flex flex-col no-drag">
      {/* タグ行を削除 */}
      <div className="flex justify-between items-center">
        <span className="truncate">{content}</span>
        <div className="flex gap-2 ml-2 shrink-0">
          <button title="コピー">
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
          <button title="その他">
            <MoreVertical className="w-4 h-4 text-gray-600 hover:text-black" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default ClipListItem;
