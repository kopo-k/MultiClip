// components/HelpModal.tsx
import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const HelpModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">MultiClip の使い方</h2>

        <div className="text-sm space-y-4">
          <div>
            <h3 className="font-semibold">基本操作</h3>
            <ul className="list-disc list-inside">
              <li>⌘+Shift+V でアプリを開く</li>
              <li>テキストをコピーすると自動で履歴に追加</li>
              <li>クリップをクリックして再コピー</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">お気に入り</h3>
            <ul className="list-disc list-inside">
              <li>⭐ボタンでお気に入りに追加</li>
              <li>よく使うテキストを保存</li>
              <li>メモやタグで整理可能</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">スニペット</h3>
            <ul className="list-disc list-inside">
              <li>Cmd+Option+1〜9 でクイック入力</li>
              <li>よく使うコードや定型文に便利</li>
              <li>有効/無効の切り替え可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
