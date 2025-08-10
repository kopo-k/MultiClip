import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  maxLength?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, maxLength = 40, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowLeft, setArrowLeft] = useState(16);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 文字数が制限を超えているかチェック
  const shouldShowTooltip = content.length > maxLength;

  const updatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      let calculatedArrowLeft = 16;

      // 画面右端を超える場合は左に調整
      if (left + tooltipRect.width > window.innerWidth - 10) {
        const newLeft = window.innerWidth - tooltipRect.width - 10;
        calculatedArrowLeft = Math.max(8, Math.min(tooltipRect.width - 24, triggerRect.left + triggerRect.width/2 - newLeft));
        left = newLeft;
      }

      // 画面左端を超える場合は右に調整
      if (left < 10) {
        calculatedArrowLeft = Math.max(8, triggerRect.left + triggerRect.width/2 - 10);
        left = 10;
      }

      // 画面下端を超える場合は上に表示
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = triggerRect.top - tooltipRect.height - 8;
      }

      setPosition({ top, left });
      setArrowLeft(calculatedArrowLeft);
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (shouldShowTooltip) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      
      {isVisible && shouldShowTooltip && (
        <div
          ref={tooltipRef}
          className="fixed bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 max-w-xs break-words z-50 shadow-lg"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          {/* 矢印 */}
          <div 
            className="absolute -top-1 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"
            style={{ left: `${arrowLeft}px` }}
          ></div>
        </div>
      )}
    </>
  );
};

export default Tooltip;