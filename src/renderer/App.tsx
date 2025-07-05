import React, { useEffect, useState } from 'react';
import ClipListItem from './components/ClipListItem';

type Clip = {
  id: number;
  content: string;
};

const App = () => {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    window.api.getRecentClips().then((data: Clip[]) => {
      setClips(data);
    });

    // clipが追加されたら再取得する
    window.api.onClipAdded(() => {
      window.api.getRecentClips().then((data: Clip[]) => {
        setClips(data);
      });
    });
  }, []);

  return (
    <div className="p-4 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">コピー履歴</h1>
        <button className="text-sm text-blue-500 hover:underline">設定</button>
      </div>

      <ul className="space-y-2">
        {clips.map((clip) => (
          <ClipListItem key={clip.id} content={clip.content} />
        ))}
      </ul>
    </div>
  );
};

export default App;
