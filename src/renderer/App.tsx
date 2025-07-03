import React, { useEffect, useState } from 'react';

type Clip = {
  id: number;
  content: string;
  created_at: string;
};

const App = () => {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    window.api.getRecentClips().then((data: Clip[]) => {
      setClips(data);
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4"> クリップボード履歴</h1>
      <ul className="space-y-2">
        {clips.map((clip) => (
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
