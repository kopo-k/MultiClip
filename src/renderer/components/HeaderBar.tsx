import { Clipboard, Settings, HelpCircle } from 'lucide-react';

const HeaderBar = () => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Clipboard className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl font-bold">MultiClip</h1>
      </div>
      <div className="flex gap-3">
        <button title="設定">
          <Settings className="w-5 h-5 text-gray-600 hover:text-black" />
        </button>
        <button title="ヘルプ">
          <HelpCircle className="w-5 h-5 text-gray-600 hover:text-black" />
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
