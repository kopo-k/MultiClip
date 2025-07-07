import { Copy, Star, MoreVertical, Tag } from 'lucide-react';

type Props = {
  content: string;
  tag: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const ClipListItem = ({ content, tag, isFavorite, onToggleFavorite }: Props) => {
  return (
    <li className="border rounded-lg p-3 bg-gray-50 text-sm flex flex-col">
      <span className="inline-flex items-center text-xs text-gray-500 mb-1">
        <Tag className="w-3.5 h-3.5 mr-1" />
        {tag}
      </span>
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
