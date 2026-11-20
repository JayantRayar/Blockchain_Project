import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', message = 'Loading data...', className = '' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size] || 'w-6 h-6';

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeClass} animate-spin text-[#F0B90B]`} />
      {message && <p className="text-xs font-mono tracking-wide text-[#707a8a]">{message}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-8 bg-slate-100 rounded flex-1"
              style={{ opacity: 1 - rIdx * 0.15 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
