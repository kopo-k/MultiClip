import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import ClipListItem from './components/ClipListItem';
import TabBar from './components/TabBar';
import HeaderBar from './components/HeaderBar';
import ClipList from './components/ClipList';

type Clip = {
  id: number;
  content: string;
  tag?: string;
  isFavorite?: boolean;
  isSnippet?: boolean;
};


const App = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentTab, setCurrentTab] = useState<'history' | 'favorites' | 'snippets'>('history');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 初回ロード・変更検知で履歴を取得
    window.api.getRecentClips().then((data: Clip[]) => {
      setClips(data);
    });

    window.api.onClipAdded(() => {
      window.api.getRecentClips().then((data: Clip[]) => {
        setClips(data);
      });
    });
  }, []);

  // 検索フィルター適用（シンプルなフィルター）
  const filteredClips = clips.filter(clip =>
    clip.content.toLowerCase().includes(search.toLowerCase())
  );

  // 関数追加
const handleToggleFavorite = (id: number) => {
  setClips(prev =>
    prev.map(clip =>
      clip.id === id ? { ...clip, isFavorite: !clip.isFavorite } : clip
    )
  );
};

  return (
    <div className="p-4 w-full max-w-md mx-auto">
      {/* ヘッダー：アプリ名 + ホットキー + 設定アイコン */}
      <HeaderBar />

      {/* 検索バー */}
      <div className="my-3">
        <input
          type="text"
          placeholder="クリップを検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* タブ：履歴 / お気に入り / スニペット */}
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
      {/* 履歴リスト */}
      <ClipList
        clips={clips}
        currentTab={currentTab}
        search={search}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};

export default App;
