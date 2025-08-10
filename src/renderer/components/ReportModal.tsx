import React, { useState } from 'react';
import { X, AlertCircle, Bug, Lightbulb, HelpCircle, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  type: 'bug' | 'feature' | 'other';
  title: string;
  description: string;
  steps: string;
  email: string;
  priority: 'low' | 'medium' | 'high';
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [reportData, setReportData] = useState<ReportData>({
    type: 'bug',
    title: '',
    description: '',
    steps: '',
    email: '',
    priority: 'medium'
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // 任意項目なので空でもOK
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!reportData.title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    } else if (reportData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }
    
    if (!reportData.description.trim()) {
      newErrors.description = '問題の詳細を入力してください';
    } else if (reportData.description.length > 2000) {
      newErrors.description = '詳細は2000文字以内で入力してください';
    }
    
    if (reportData.steps.length > 1000) {
      newErrors.steps = '再現手順は1000文字以内で入力してください';
    }
    
    if (reportData.email && !validateEmail(reportData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    
    // リアルタイムバリデーション
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    try {
      const systemInfo = await window.api.getSystemInfo();
      const reportWithSystemInfo = {
        ...reportData,
        systemInfo,
        timestamp: new Date().toISOString()
      };
      
      const success = await window.api.submitReport(reportWithSystemInfo);
      if (success) {
        alert('問題の報告を送信しました。ご協力ありがとうございます。');
        onClose();
        // フォームをリセット
        setReportData({
          type: 'bug',
          title: '',
          description: '',
          steps: '',
          email: '',
          priority: 'medium'
        });
      } else {
        throw new Error('送信に失敗しました');
      }
    } catch (error) {
      console.error('Report submission failed:', error);
      alert('送信に失敗しました。後でもう一度お試しください。');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              問題の報告
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* フォーム */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 問題の種類 */}
            <div>
              <label className="block text-sm font-medium mb-3">問題の種類</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bug', label: 'バグ', desc: 'アプリの不具合' },
                  { value: 'feature', label: '機能要望', desc: '新機能の提案' },
                  { value: 'other', label: 'その他', desc: '質問・相談など' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleInputChange('type', option.value as any)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      reportData.type === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(option.value)}
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reportData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full p-2 border rounded ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="問題を簡潔に説明してください（例：設定画面でアプリがクラッシュする）"
                maxLength={100}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
                <span className="text-xs text-gray-500 ml-auto">{reportData.title.length}/100</span>
              </div>
            </div>

            {/* 問題の詳細 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                問題の詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reportData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full p-2 border rounded h-32 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="問題について詳しく説明してください。何が期待される動作で、実際には何が起こるのかを含めてください。"
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                <span className="text-xs text-gray-500 ml-auto">{reportData.description.length}/2000</span>
              </div>
            </div>

            {/* 再現手順 */}
            <div>
              <label className="block text-sm font-medium mb-2">再現手順（任意）</label>
              <textarea
                value={reportData.steps}
                onChange={(e) => handleInputChange('steps', e.target.value)}
                className={`w-full p-2 border rounded h-24 resize-none ${
                  errors.steps ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="問題を再現するための手順を番号付きで記載してください&#10;1. ○○を開く&#10;2. △△をクリックする&#10;3. エラーが発生する"
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                {errors.steps && <p className="text-red-500 text-xs">{errors.steps}</p>}
                <span className="text-xs text-gray-500 ml-auto">{reportData.steps.length}/1000</span>
              </div>
            </div>

            {/* 緊急度 */}
            <div>
              <label className="block text-sm font-medium mb-2">緊急度</label>
              <select
                value={reportData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="low">低 - 軽微な問題や改善提案</option>
                <option value="medium">中 - 通常の問題や機能要望</option>
                <option value="high">高 - 重要な機能が使えない問題</option>
              </select>
            </div>

            {/* 連絡先 */}
            <div>
              <label className="block text-sm font-medium mb-2">連絡先（任意）</label>
              <input
                type="email"
                value={reportData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full p-2 border rounded ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="フォローアップが必要な場合のメールアドレス"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              <p className="text-xs text-gray-500 mt-1">
                追加の質問や進捗の連絡を希望される場合のみ入力してください
              </p>
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">送信の確認</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">種類:</span> 
                <span className={`ml-2 inline-flex items-center gap-1`}>
                  {getTypeIcon(reportData.type)}
                  {reportData.type === 'bug' ? 'バグ' : reportData.type === 'feature' ? '機能要望' : 'その他'}
                </span>
              </div>
              <div>
                <span className="font-medium">緊急度:</span> 
                <span className={`ml-2 ${getPriorityColor(reportData.priority)}`}>
                  {reportData.priority === 'high' ? '高' : reportData.priority === 'medium' ? '中' : '低'}
                </span>
              </div>
              <div>
                <span className="font-medium">タイトル:</span> {reportData.title}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              以下の情報も自動的に含まれます：
            </p>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li>• アプリバージョン</li>
              <li>• OS情報</li>
              <li>• 報告日時</li>
            </ul>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                onClick={handleConfirmSend}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportModal;