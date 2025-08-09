import React, { useEffect, useState } from 'react';
import { Settings, Search } from 'lucide-react';
import ClipListItem from './components/ClipListItem';
import TabBar from './components/TabBar';
import HeaderBar from './components/HeaderBar';
import SearchBar from './components/SearchBar';
import ClipList from './components/ClipList';
import SnippetEditModal from './components/SnippetEditModal';
import SnippetCreateModal from './components/SnippetCreateModal';
import Toast from './components/Toast';

// Clip型を定義
type Clip = {
  id: number; // 履歴のID
  content: string; // コピーしたテキスト
  tag?: string; // タグ（オプション）
  isFavorite?: boolean; // お気に入り（オプション）
  isSnippet?: boolean; // スニペット（オプション）
  shortcutKey?: string; // スニペット用ショートカットキー
  isEnabled?: boolean; // スニペットの有効/無効状態
};


const App = () => {
  // 履歴を管理するstate
  const [clips, setClips] = useState<Clip[]>([]);
  // 現在選択されているタブ
  const [currentTab, setCurrentTab] = useState<'history' | 'favorites' | 'snippets'>('history');
  // 検索フィルター
  const [search, setSearch] = useState('');
  // スニペット編集モーダル
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [editingSnippetId, setEditingSnippetId] = useState<number | null>(null);
  // スニペット作成モーダル
  const [isSnippetCreateModalOpen, setIsSnippetCreateModalOpen] = useState(false);
  // トースト通知
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // データベースからクリップを取得してフォーマット
  const fetchAndUpdateClips = async () => {
    try {
      const data = await window.api.getRecentClips();
      const formattedClips: Clip[] = data.map((item: any) => ({
        id: item.id,
        content: item.content,
        isFavorite: item.is_favorite === 1,
        isSnippet: item.is_snippet === 1,
        shortcutKey: item.shortcut_key || undefined,
        isEnabled: item.is_enabled !== 0 // デフォルトはtrue
      }));
      setClips(formattedClips);
      console.log('Updated clips:', formattedClips.length, 'total items');
    } catch (error) {
      console.error('Failed to fetch clips:', error);
    }
  };

  useEffect(() => {
    // 初回ロード
    fetchAndUpdateClips();
    
    // クリップが追加されたら履歴を更新
    const handleClipAdded = () => {
      console.log('Clip added event received');
      setTimeout(() => {
        fetchAndUpdateClips();
      }, 100); // 少し遅延させてDBの更新を待つ
    };

    window.api.onClipAdded(handleClipAdded);
    
    // クリーンアップは不要（preloadでremoveListenerが実装されていない）
  }, []);

  // スニペットのショートカットを更新
  useEffect(() => {
    const snippets = clips
      .filter(clip => clip.isSnippet && clip.shortcutKey)
      .map(clip => ({
        shortcutKey: clip.shortcutKey!,
        content: clip.content,
        isEnabled: clip.isEnabled !== false
      }));

    if (snippets.length > 0) {
      window.api.updateSnippetShortcuts(snippets).catch(error => {
        console.error('Failed to update snippet shortcuts:', error);
      });
    }
  }, [clips]);

  // 検索フィルター適用（シンプルなフィルター）
  const filteredClips = clips.filter(clip =>
    clip.content.toLowerCase().includes(search.toLowerCase())
  );

  // 各タブの実際のアイテム数を計算
  const historyCount = clips.filter(clip => !clip.isSnippet).length; // スニペットを除外
  const favoritesCount = clips.filter(clip => clip.isFavorite).length;
  const snippetsCount = clips.filter(clip => clip.isSnippet).length;

  // 指定されたIDのクリップのお気に入り状態を反転（ON/OFF）させる
const handleToggleFavorite = async (id: number) => {
  const clip = clips.find(c => c.id === id);
  if (!clip) return;

  // お気に入りに追加する場合の上限チェック
  if (!clip.isFavorite) {
    const currentFavorites = clips.filter(c => c.isFavorite).length;
    if (currentFavorites >= 100) {
      setToastMessage('お気に入りは100件まで登録可能です。古いものが自動で解除されます。');
      setShowToast(true);
    }
  }

  // まずUIを更新
  setClips(prev =>
    prev.map(clip =>
      //クリップのIDが、変更対象のIDと一致しているかを確認
      clip.id === id ? { ...clip, isFavorite: !clip.isFavorite } : clip 
    )
  );

  // データベースにも変更を保存
  try {
    await window.api.updateClip(id, {
      is_favorite: !clip.isFavorite
    });

    // データベースから最新状態を取得して同期
    fetchAndUpdateClips();

  } catch (error) {
    console.error('Failed to update favorite status:', error);
    // エラーの場合、UIを元に戻す
    setClips(prev =>
      prev.map(clip =>
        clip.id === id ? { ...clip, isFavorite: !clip.isFavorite } : clip 
      )
    );
  }
};

// スニペット状態をトグル
const handleToggleSnippet = async (id: number) => {
  const clip = clips.find(c => c.id === id);
  if (!clip) return;

  // UIを更新
  setClips(prev =>
    prev.map(clip =>
      clip.id === id ? { 
        ...clip, 
        isSnippet: !clip.isSnippet,
        isEnabled: clip.isSnippet ? undefined : true // スニペット化する時は有効にする
      } : clip 
    )
  );

  // データベースにも変更を保存
  try {
    await window.api.updateClip(id, {
      is_snippet: !clip.isSnippet,
      is_enabled: clip.isSnippet ? undefined : true
    });
  } catch (error) {
    console.error('Failed to update snippet status:', error);
  }
};

// スニペット編集
const handleEditSnippet = (id: number) => {
  setEditingSnippetId(id);
  setIsSnippetModalOpen(true);
};

// スニペット削除
const handleDeleteSnippet = async (id: number) => {
  // UIを更新
  setClips(prev =>
    prev.map(clip =>
      clip.id === id ? { 
        ...clip, 
        isSnippet: false,
        shortcutKey: undefined,
        isEnabled: undefined
      } : clip 
    )
  );

  // データベースにも変更を保存
  try {
    await window.api.updateClip(id, {
      is_snippet: false,
      shortcut_key: null,
      is_enabled: false
    });
  } catch (error) {
    console.error('Failed to delete snippet:', error);
  }
};

// スニペット有効/無効切り替え
const handleToggleSnippetEnabled = async (id: number) => {
  const clip = clips.find(c => c.id === id);
  if (!clip) return;

  const newEnabledState = clip.isEnabled === false ? true : false;

  // UIを更新
  setClips(prev =>
    prev.map(clip =>
      clip.id === id ? { 
        ...clip, 
        isEnabled: newEnabledState
      } : clip 
    )
  );

  // データベースにも変更を保存
  try {
    await window.api.updateClip(id, {
      is_enabled: newEnabledState
    });
  } catch (error) {
    console.error('Failed to update snippet enabled status:', error);
  }
};

// スニペット保存
const handleSaveSnippet = async (content: string, shortcutKey: string) => {
  if (editingSnippetId !== null) {
    // UIを更新
    setClips(prev =>
      prev.map(clip =>
        clip.id === editingSnippetId ? { 
          ...clip, 
          content,
          shortcutKey,
          isSnippet: true,
          isEnabled: true
        } : clip 
      )
    );

    // データベースにも変更を保存
    try {
      await window.api.updateClip(editingSnippetId, {
        content,
        shortcut_key: shortcutKey,
        is_snippet: true,
        is_enabled: true
      });
    } catch (error) {
      console.error('Failed to save snippet:', error);
    }
  }
  setEditingSnippetId(null);
};

// 新しいスニペット作成
const handleCreateSnippet = async (name: string, shortcutKey: string, content: string) => {
  try {
    const success = await window.api.createSnippet(content, shortcutKey);
    if (success) {
      // データベースから最新のデータを取得して画面を更新
      fetchAndUpdateClips();
    }
  } catch (error) {
    console.error('Failed to create snippet:', error);
  }
};

// コピー機能
const handleCopy = async (content: string) => {
  try {
    const success = await window.api.copyToClipboard(content);
    if (success) {
      setToastMessage('コピーしました');
      setShowToast(true);
    } else {
      setToastMessage('コピーに失敗しました');
      setShowToast(true);
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    setToastMessage('コピーに失敗しました');
    setShowToast(true);
  }
};

  return (
    <div className="p-4 w-full max-w-md mx-auto">
      {/* ヘッダー：アプリ名 + ホットキー + 設定アイコン */}
      <HeaderBar />
      {/* 検索バー */}
      <SearchBar search={search} setSearch={setSearch} />
      {/* タブ：履歴 / お気に入り / スニペット */}
      <TabBar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab}
        historyCount={historyCount}
        favoritesCount={favoritesCount}
        snippetsCount={snippetsCount}
      />
      {/* 履歴リスト */}
      <ClipList
        clips={clips}
        currentTab={currentTab}
        search={search}
        onToggleFavorite={handleToggleFavorite}
        onToggleSnippet={handleToggleSnippet}
        onEditSnippet={handleEditSnippet}
        onDeleteSnippet={handleDeleteSnippet}
        onToggleSnippetEnabled={handleToggleSnippetEnabled}
        onCreateNewSnippet={() => setIsSnippetCreateModalOpen(true)}
        onCopy={handleCopy}
      />
      
      {/* スニペット編集モーダル */}
      <SnippetEditModal
        isOpen={isSnippetModalOpen}
        onClose={() => {
          setIsSnippetModalOpen(false);
          setEditingSnippetId(null);
        }}
        onSave={handleSaveSnippet}
        initialContent={
          editingSnippetId !== null 
            ? clips.find(clip => clip.id === editingSnippetId)?.content || ''
            : ''
        }
        initialShortcutKey={
          editingSnippetId !== null 
            ? clips.find(clip => clip.id === editingSnippetId)?.shortcutKey || ''
            : ''
        }
      />
      
      {/* スニペット作成モーダル */}
      <SnippetCreateModal
        isOpen={isSnippetCreateModalOpen}
        onClose={() => setIsSnippetCreateModalOpen(false)}
        onCreate={handleCreateSnippet}
      />
      
      {/* トースト通知 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onHide={() => setShowToast(false)}
      />
    </div>
  );
};

export default App;
