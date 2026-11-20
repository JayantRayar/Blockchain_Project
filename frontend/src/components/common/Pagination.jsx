import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page = 1,
  limit = 10,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  className = ''
}) => {
  if (totalCount === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#1a2232] text-xs text-slate-400 ${className}`}>
      <div>
        Showing <span className="font-mono text-slate-200">{startRecord}</span> to{' '}
        <span className="font-mono text-slate-200">{endRecord}</span> of{' '}
        <span className="font-mono text-slate-200">{totalCount}</span> records
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400 mr-2">
          Page <span className="font-mono text-slate-200">{page}</span> of{' '}
          <span className="font-mono text-slate-200">{totalPages || 1}</span>
        </span>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage && page <= 1}
          className="p-1.5 rounded-lg border border-[#222c40] bg-[#141a26] text-slate-300 hover:bg-[#1a2333] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage && page >= totalPages}
          className="p-1.5 rounded-lg border border-[#222c40] bg-[#141a26] text-slate-300 hover:bg-[#1a2333] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
