// components/ClipListItem.tsx
import { FC } from 'react';
import { GearIcon } from '@radix-ui/react-icons';

type ClipListItemProps = {
  text: string;
};

const ClipListItem: FC<ClipListItemProps> = ({ text }) => {
  return (
    <div className="bg-zinc-900 text-white rounded-xl p-4 shadow-md flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">テキスト - Visual Studio Code</span>
        <button className="hover:text-blue-400 transition-colors">
          <GearIcon className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-white truncate">{text}</p> {/* ← 1行省略 */}

      <div className="flex gap-2 mt-2">
        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">JavaScript</span>
        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">React</span>
      </div>
    </div>
  );
};

export default ClipListItem;
