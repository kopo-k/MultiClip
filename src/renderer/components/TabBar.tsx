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
        maxCount={50}
        active={currentTab === 'history'}
        onClick={() => onTabChange('history')}
      />
      <TabButton
        label="お気に入り"
        count={favoritesCount}
        maxCount={100}
        active={currentTab === 'favorites'}
        onClick={() => onTabChange('favorites')}
      />
      <TabButton
        label="スニペット"
        count={snippetsCount}
        maxCount={10}
        active={currentTab === 'snippets'}
        onClick={() => onTabChange('snippets')}
      />
    </div>
  );
};

const TabButton = ({
  label,
  count,
  maxCount,
  active,
  onClick,
}: {
  label: string;
  count: number;
  maxCount?: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={`flex-1 py-2 px-1 text-center border-b-2 ${
      active ? 'border-black font-semibold text-black' : 'border-transparent text-gray-500'
    }`}
    onClick={onClick}
  >
    <div className="flex flex-col items-center">
      <span className="text-sm">{label}</span>
      <span className={`text-xs ${
        maxCount && count >= maxCount 
          ? 'text-red-600 font-bold' 
          : maxCount && count >= maxCount * 0.9 
          ? 'text-orange-600 font-semibold' 
          : maxCount && count >= maxCount * 0.8 
          ? 'text-yellow-600' 
          : 'text-gray-400'
      }`}>
        {maxCount ? `${count}/${maxCount}` : `(${count})`}
      </span>
    </div>
  </button>
);

export default TabBar;
