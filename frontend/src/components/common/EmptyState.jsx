import React from 'react';
import { Database } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Database,
  title = 'No records found',
  description = 'There is currently no data available to display.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#fafbfc] border border-dashed border-[#e2e8f0] ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-white border border-[#eaecef] shadow-sm flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-[#1e2329] mb-1">{title}</h3>
      <p className="text-xs text-[#707a8a] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] font-semibold text-xs tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
