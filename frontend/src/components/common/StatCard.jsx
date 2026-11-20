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
    <div className={`bg-white border border-[#eaecef] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all duration-150 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-xs font-medium tracking-wide text-[#707a8a]">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-[#f5f6f8] text-[#707a8a] border border-[#eaecef]">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1e2329] truncate">
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-[#707a8a] font-mono mt-1 flex items-center gap-1.5 truncate">
              {subValue}
            </div>
          )}
        </div>

        {badge && <div>{badge}</div>}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-[#f1f3f5] text-xs text-[#707a8a] flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
