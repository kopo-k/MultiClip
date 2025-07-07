import { Search } from 'lucide-react';

/**
 * 検索バーコンポーネント
 *
 * @param search 現在の検索キーワード
 * @param setSearch 検索キーワードを更新する関数
 * @returns JSXの検索バー
 *
 * @example
 * <SearchBar search={search} setSearch={setSearch} />
 */
const SearchBar = ({ search, setSearch }: { search: string; setSearch: (value: string) => void }) => {
  return (
    <div className="my-3 relative">
      {/* 検索アイコン（左側に配置） */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-gray-500" />
      </div>

      {/* 検索入力欄 */}
      <input
        type="text"
        placeholder="クリップを検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:border-blue-300"
      />
    </div>
  );
};

export default SearchBar;