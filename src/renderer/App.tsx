import React, { useEffect, useState } from 'react';
import { Settings, Search } from 'lucide-react';
import ClipListItem from './components/ClipListItem';
import TabBar from './components/TabBar';
import HeaderBar from './components/HeaderBar';
import SearchBar from './components/SearchBar';
import ClipList from './components/ClipList';

// Clip型を定義
type Clip = {
  id: number; // 履歴のID
  content: string; // コピーしたテキスト
  tag?: string; // タグ（オプション）
  isFavorite?: boolean; // お気に入り（オプション）
  isSnippet?: boolean; // スニペット（オプション）
};


const App = () => {
  // 履歴を管理するstate
  const [clips, setClips] = useState<Clip[]>([]);
  // 現在選択されているタブ
  const [currentTab, setCurrentTab] = useState<'history' | 'favorites' | 'snippets'>('history');
  // 検索フィルター
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 初回ロード・変更検知で履歴を取得
    window.api.getRecentClips().then((data: Clip[]) => {
      setClips(data);
    });
    // クリップが追加されたら履歴を更新
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

  // 指定されたIDのクリップのお気に入り状態を反転（ON/OFF）させる
const handleToggleFavorite = (id: number) => {
  setClips(prev =>
    prev.map(clip =>
      //クリップのIDが、変更対象のIDと一致しているかを確認
      clip.id === id ? { ...clip, isFavorite: !clip.isFavorite } : clip 
    )
  );
};

  return (
    <div className="p-4 w-full max-w-md mx-auto">
      {/* ヘッダー：アプリ名 + ホットキー + 設定アイコン */}
      <HeaderBar />

      {/* 検索バー */}
      <SearchBar search={search} setSearch={setSearch} />

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
