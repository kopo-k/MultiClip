type Tab = 'history' | 'favorites' | 'snippets';

const TabBar = ({
  currentTab,
  onTabChange,
  historyCount,
  favoritesCount,
  snippetsCount,
}: {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  historyCount: number;
  favoritesCount: number;
  snippetsCount: number;
}) => {
  return (
    <div className="flex text-sm border-b border-gray-300 no-drag">
      <TabButton
        label="履歴"
        count={historyCount}
        active={currentTab === 'history'}
        onClick={() => onTabChange('history')}
      />
      <TabButton
        label="お気に入り"
        count={favoritesCount}
        active={currentTab === 'favorites'}
        onClick={() => onTabChange('favorites')}
      />
      <TabButton
        label="スニペット"
        count={snippetsCount}
        active={currentTab === 'snippets'}
        onClick={() => onTabChange('snippets')}
      />
    </div>
  );
};

const TabButton = ({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={`flex-1 py-2 text-center border-b-2 ${
      active ? 'border-black font-semibold text-black' : 'border-transparent text-gray-500'
    }`}
    onClick={onClick}
  >
    {label} ({count})
  </button>
);

export default TabBar;
