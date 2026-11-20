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
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#eaecef] bg-white text-xs text-[#707a8a] ${className}`}>
      <div>
        Showing <span className="font-mono font-medium text-[#1e2329]">{startRecord}</span> to{' '}
        <span className="font-mono font-medium text-[#1e2329]">{endRecord}</span> of{' '}
        <span className="font-mono font-medium text-[#1e2329]">{totalCount}</span> records
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[#707a8a] mr-2">
          Page <span className="font-mono font-medium text-[#1e2329]">{page}</span> of{' '}
          <span className="font-mono font-medium text-[#1e2329]">{totalPages || 1}</span>
        </span>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage && page <= 1}
          className="p-1.5 rounded-lg border border-[#eaecef] bg-white text-slate-700 hover:bg-[#f5f6f8] hover:text-[#1e2329] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage && page >= totalPages}
          className="p-1.5 rounded-lg border border-[#eaecef] bg-white text-slate-700 hover:bg-[#f5f6f8] hover:text-[#1e2329] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
