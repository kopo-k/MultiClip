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
              <li>⌘+Shift+C でアプリを表示/非表示</li>
              <li>テキストをコピーすると自動で履歴に追加</li>
              <li>アイテムをクリックまたはEnterキーで再コピー</li>
              <li>↑/↓キーでアイテム選択</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">お気に入り</h3>
            <ul className="list-disc list-inside">
              <li>⭐ボタンでお気に入りに追加</li>
              <li>よく使うテキストを永続保存</li>
              <li>履歴制限とは別に管理</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">設定</h3>
            <ul className="list-disc list-inside">
              <li>履歴・お気に入りの保存件数設定</li>
              <li>ウィンドウサイズや位置の調整</li>
              <li>透明度や常に最前面表示</li>
              <li>テーマの変更（ライト/ダーク/システム追従）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
