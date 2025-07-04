import React, { useEffect, useState } from 'react';

//1つのクリップボード履歴の構造
type Clip = {
  id: number;
  content: string;
  created_at: string;
};

// クリップボード履歴を表示するコンポーネント
const App = () => {
  // クリップボード履歴を管理する
  const [clips, setClips] = useState<Clip[]>([]);
  //最初のレンダリング時にクリップボード履歴を取得する
  useEffect(() => {
    // 最初の履歴取得
    window.api.getRecentClips().then(setClips);
  
    // クリップボードが追加されたら再取得
    window.api.onClipAdded(() => {
      window.api.getRecentClips().then(setClips);
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4"> クリップボード履歴</h1>
      <ul className="space-y-2">
        {/* クリップボード履歴を表示する */}
        {clips.map((clip) => ( //clipsから1つずつ取り出して、liタグに表示する
          <li key={clip.id} className="bg-gray-100 p-2 rounded shadow">
            <div className="text-sm text-gray-700">{clip.content}</div>
            <div className="text-xs text-gray-500">{clip.created_at}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
