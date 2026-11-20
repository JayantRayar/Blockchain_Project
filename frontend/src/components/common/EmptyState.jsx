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
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#10141d]/50 border border-dashed border-[#1f293d] ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-[#161d2a] border border-[#222c40] flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14] font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
