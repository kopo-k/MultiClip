import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface RegistrationErrorData {
  shortcut: string;
  reason: string;
}

const SnippetRegistrationError = () => {
  const [errorData, setErrorData] = useState<RegistrationErrorData | null>(null);

  useEffect(() => {
    // スニペット登録失敗通知のリスナーを設定
    const handleRegistrationError = (data: RegistrationErrorData) => {
      setErrorData(data);
      
      // 4秒後に自動で消す
      setTimeout(() => {
        setErrorData(null);
      }, 4000);
    };

    window.api.onSnippetRegistrationFailed(handleRegistrationError);
    
    return () => {
      // クリーンアップは不要（preload.tsで removeAllListeners を使用）
    };
  }, []);

  if (!errorData) return null;

  const handleClose = () => {
    setErrorData(null);
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-red-500 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                ショートカット登録失敗
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {errorData.shortcut}
                </span>
                {' '}の登録に失敗しました
              </p>
              <p className="text-xs text-red-600">
                {errorData.reason}
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

export default SnippetRegistrationError;