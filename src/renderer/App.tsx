import React, { useEffect, useState, useRef } from 'react';
import { Settings, Search } from 'lucide-react';
import ClipListItem from './components/ClipListItem';
import TabBar from './components/TabBar';
import HeaderBar from './components/HeaderBar';
import SearchBar from './components/SearchBar';
import ClipList from './components/ClipList';
import SnippetEditModal from './components/SnippetEditModal';
import SnippetCreateModal from './components/SnippetCreateModal';
import SettingsModal from './components/SettingsModal';
import ReportModal from './components/ReportModal';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import ShortcutConflictWarning from './components/ShortcutConflictWarning';
import SnippetRegistrationError from './components/SnippetRegistrationError';

// Clip型を定義
type Clip = {
  id: number; // 履歴のID
  content: string; // コピーしたテキスト
  tag?: string; // タグ（オプション）
  isFavorite?: boolean; // お気に入り（オプション）
  isSnippet?: boolean; // スニペット（オプション）
  shortcutKey?: string; // スニペット用ショートカットキー
  snippetName?: string; // スニペット名
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
  const [initialSnippetContent, setInitialSnippetContent] = useState('');
  // 設定モーダル
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 報告モーダル
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // トースト通知
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // ウィンドウドラッグ機能
  const appRef = useRef<HTMLDivElement>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // データベースからクリップを取得してフォーマット
  const fetchAndUpdateClips = async () => {
    try {
      const data = await window.api.getRecentClips();
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data received from getRecentClips');
        return;
      }
      const formattedClips: Clip[] = data.map((item: any) => ({
        id: item.id,
        content: item.content || '',
        isFavorite: item.is_favorite === 1,
        isSnippet: item.is_snippet === 1,
        shortcutKey: item.shortcut_key || undefined,
        snippetName: item.snippet_name || undefined,
        isEnabled: item.is_enabled !== 0 // デフォルトはtrue
      }));
      setClips(formattedClips);
      console.log('Updated clips:', formattedClips.length, 'total items');
    } catch (error) {
      console.error('Failed to fetch clips:', error);
      setClips([]); // エラー時は空配列を設定
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

    // スニペットフォールバック通知を受信
    window.api.onSnippetFallback((data) => {
      setToastMessage(`${data.reason} (${data.shortcutKey})`);
      setShowToast(true);
    });
    
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

  // スニペット化する場合、上限チェック
  if (!clip.isSnippet) {
    const currentSnippets = clips.filter(c => c.isSnippet).length;
    if (currentSnippets >= 10) {
      setToastMessage('スニペットは10個まで登録可能です');
      setShowToast(true);
      return;
    }
  }

  // データベースにも変更を保存
  try {
    const success = await window.api.updateClip(id, {
      is_snippet: !clip.isSnippet,
      is_enabled: clip.isSnippet ? undefined : true
    });

    if (success) {
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
    } else {
      setToastMessage('スニペットは10個まで登録可能です');
      setShowToast(true);
    }
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
const handleSaveSnippet = async (content: string, shortcutKey: string, snippetName: string) => {
  if (editingSnippetId !== null) {
    // UIを更新
    setClips(prev =>
      prev.map(clip =>
        clip.id === editingSnippetId ? { 
          ...clip, 
          content,
          shortcutKey,
          snippetName,
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
        snippet_name: snippetName,
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
    // 上限チェック
    const currentSnippets = clips.filter(c => c.isSnippet).length;
    if (currentSnippets >= 10) {
      setToastMessage('スニペットは10個まで登録可能です');
      setShowToast(true);
      return;
    }

    const success = await window.api.createSnippet(content, shortcutKey, name);
    if (success) {
      // データベースから最新のデータを取得して画面を更新
      fetchAndUpdateClips();
    } else {
      setToastMessage('スニペットは10個まで登録可能です');
      setShowToast(true);
    }
  } catch (error) {
    console.error('Failed to create snippet:', error);
  }
};

// コンテンツ付きでスニペット作成モーダルを開く
const handleCreateSnippetWithContent = (content: string) => {
  // 上限チェック
  const currentSnippets = clips.filter(c => c.isSnippet).length;
  if (currentSnippets >= 10) {
    setToastMessage('スニペットは10個まで登録可能です');
    setShowToast(true);
    return;
  }

  setInitialSnippetContent(content);
  setIsSnippetCreateModalOpen(true);
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

  // ウィンドウドラッグ機能のイベントハンドラー
  const handleMouseDown = (e: React.MouseEvent) => {
    // 入力フィールドやボタンなど、対話可能要素の場合はドラッグを開始しない
    const target = e.target as HTMLElement;
    const isInputElement = target instanceof HTMLInputElement;
    const isInteractiveElement = target.tagName === 'INPUT' || 
                                  target.tagName === 'BUTTON' || 
                                  target.tagName === 'SELECT' || 
                                  target.tagName === 'TEXTAREA' ||
                                  (isInputElement && target.type === 'range') ||
                                  target.closest('button') ||
                                  target.closest('input') ||
                                  target.closest('select') ||
                                  target.closest('textarea');
    
    if (isInteractiveElement) return;
    
    // 長押しタイマーを開始
    const timer = setTimeout(() => {
      setIsDragging(true);
      // CSSでドラッグ可能にする
      if (appRef.current) {
        (appRef.current.style as any).webkitAppRegion = 'drag';
        // 数秒後に元に戻す（ドラッグ完了後）
        setTimeout(() => {
          if (appRef.current) {
            (appRef.current.style as any).webkitAppRegion = 'no-drag';
          }
          setIsDragging(false);
        }, 100);
      }
    }, 300); // 300ms長押し
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    // 長押しタイマーをクリア
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // ドラッグを無効化
    if (appRef.current) {
      (appRef.current.style as any).webkitAppRegion = 'no-drag';
    }
    setIsDragging(false);
  };

  // コンポーネントがアンマウントされる時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // ショートカットキー（Cmd+Shift+R）で報告モーダルを開く
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        setIsReportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div 
        ref={appRef}
        className={`p-4 w-full max-w-md mx-auto select-none ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
      {/* ヘッダー：アプリ名 + ホットキー + 設定アイコン */}
      <HeaderBar onSettingsClick={() => setIsSettingsModalOpen(true)} />
      {/* 検索バー */}
      <div className="select-text">
        <SearchBar search={search} setSearch={setSearch} />
      </div>
      {/* タブ：履歴 / お気に入り / スニペット */}
      <TabBar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab}
        historyCount={historyCount}
        favoritesCount={favoritesCount}
        snippetsCount={snippetsCount}
      />
      {/* 履歴リスト */}
      <div className="select-text">
        <ClipList
          clips={clips}
          currentTab={currentTab}
          search={search}
          onToggleFavorite={handleToggleFavorite}
          onToggleSnippet={handleToggleSnippet}
          onEditSnippet={handleEditSnippet}
          onDeleteSnippet={handleDeleteSnippet}
          onToggleSnippetEnabled={handleToggleSnippetEnabled}
          onCreateNewSnippet={() => {
            const currentSnippets = clips.filter(c => c.isSnippet).length;
            if (currentSnippets >= 10) {
              setToastMessage('スニペットは10個まで登録可能です');
              setShowToast(true);
              return;
            }
            setIsSnippetCreateModalOpen(true);
          }}
          onCopy={handleCopy}
          onCreateSnippetWithContent={handleCreateSnippetWithContent}
        />
      </div>
      
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
        initialSnippetName={
          editingSnippetId !== null 
            ? clips.find(clip => clip.id === editingSnippetId)?.snippetName || ''
            : ''
        }
        existingShortcuts={clips.filter(clip => clip.isSnippet && clip.shortcutKey).map(clip => clip.shortcutKey!)}
        currentSnippetId={editingSnippetId || undefined}
      />
      
      {/* スニペット作成モーダル */}
      <SnippetCreateModal
        isOpen={isSnippetCreateModalOpen}
        onClose={() => {
          setIsSnippetCreateModalOpen(false);
          setInitialSnippetContent('');
        }}
        onCreate={handleCreateSnippet}
        existingShortcuts={clips.filter(clip => clip.isSnippet && clip.shortcutKey).map(clip => clip.shortcutKey!)}
        initialContent={initialSnippetContent}
      />
      
      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      {/* 報告モーダル */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      
      {/* トースト通知 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onHide={() => setShowToast(false)}
      />
      
      {/* ショートカットキー競合警告 */}
      <ShortcutConflictWarning />
      
      {/* スニペット登録失敗通知 */}
      <SnippetRegistrationError />
      </div>
    </ErrorBoundary>
  );
};

export default App;
