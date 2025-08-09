import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

type Props = {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
};

const Toast = ({ message, isVisible, onHide, duration = 2000 }: Props) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onHide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // フェードアウトのために少し遅らせてからunmount
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onHide]);

  if (!shouldRender) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div
        className={`
          flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg
          transition-all duration-300 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        `}
      >
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;