import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield, Monitor } from 'lucide-react';

interface ConflictData {
  shortcut: string;
  conflicts: Array<{
    type: string;
    description: string;
    appName?: string;
  }>;
}

const ShortcutConflictWarning = () => {
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  useEffect(() => {
    // ショートカットキー競合警告のリスナーを設定
    const handleConflictWarning = (data: ConflictData) => {
      setConflictData(data);
      
      // 6秒後に自動で消す
      setTimeout(() => {
        setConflictData(null);
      }, 6000);
    };

    window.api.onShortcutConflictWarning(handleConflictWarning);
    
    return () => {
      // クリーンアップは不要（preload.tsで removeAllListeners を使用）
    };
  }, []);

  if (!conflictData) return null;

  const handleClose = () => {
    setConflictData(null);
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Monitor className="w-4 h-4 text-red-500" />;
      case 'app':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'system':
        return 'システム';
      case 'app':
        return 'アプリケーション';
      default:
        return '不明';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ショートカットキー競合の警告
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {conflictData.shortcut}
                </span>
                {' '}は以下と競合しています：
              </p>
              
              <div className="space-y-2">
                {conflictData.conflicts.map((conflict, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {getConflictIcon(conflict.type)}
                    <span className="text-gray-700">
                      <strong>{getConflictTypeLabel(conflict.type)}</strong>
                      {conflict.appName && ` (${conflict.appName})`}
                      : {conflict.description}
                    </span>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                このスニペットは正常に動作しない可能性があります。
                異なるショートカットキーの使用を検討してください。
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutConflictWarning;