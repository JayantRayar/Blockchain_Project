import React from 'react';

export const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  badge,
  trend,
  className = ''
}) => {
  return (
    <div className={`bg-[#121721] border border-[#1e2638] rounded-xl p-5 hover:border-[#2a364f] transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#182030] text-slate-300 border border-[#222c40]">
            <Icon className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white truncate">
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5 truncate">
              {subValue}
            </div>
          )}
        </div>

        {badge && <div>{badge}</div>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#1a2232] text-xs text-slate-400 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
