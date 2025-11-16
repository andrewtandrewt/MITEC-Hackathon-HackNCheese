'use client';

import { useState } from 'react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <span
        className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full cursor-help hover:bg-blue-200 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
        role="button"
        aria-label="Show help"
      >
        ?
      </span>
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 text-xs text-white bg-gray-900 rounded-lg shadow-xl bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
          <div className="whitespace-normal leading-relaxed">{text}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </span>
  );
}

