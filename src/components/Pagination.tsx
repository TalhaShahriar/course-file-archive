import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'entries',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const startItem = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (validTotalPages <= 7) {
      for (let i = 1; i <= validTotalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', validTotalPages);
      } else if (currentPage >= validTotalPages - 3) {
        pages.push(
          1,
          '...',
          validTotalPages - 4,
          validTotalPages - 3,
          validTotalPages - 2,
          validTotalPages - 1,
          validTotalPages
        );
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          validTotalPages
        );
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-surface border border-subtle rounded-2xl text-xs text-secondary shadow-xs ${className}`}
    >
      {/* Items range counter and page size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="text-tertiary font-mono">
          Showing <span className="font-bold text-primary font-sans">{startItem}</span>–
          <span className="font-bold text-primary font-sans">{endItem}</span> of{' '}
          <span className="font-bold text-brand font-sans">{totalItems}</span> {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-quaternary">
            <span className="hidden md:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to page 1 on page size change
              }}
              className="bg-background border border-subtle text-primary font-mono text-xs rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation buttons */}
      {validTotalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
            className="p-1.5 rounded-lg border border-subtle hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition text-secondary hover:text-primary cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-subtle hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition text-secondary hover:text-primary cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Numeric Page Buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-quaternary font-mono select-none"
                  >
                    …
                  </span>
                );
              }

              const pageNum = Number(p);
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-brand text-white shadow-xs shadow-indigo-500/30 border border-brand'
                      : 'border border-subtle hover:bg-surface-hover text-secondary hover:text-primary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(validTotalPages, currentPage + 1))}
            disabled={currentPage >= validTotalPages}
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-subtle hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition text-secondary hover:text-primary cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => onPageChange(validTotalPages)}
            disabled={currentPage >= validTotalPages}
            aria-label="Last page"
            className="p-1.5 rounded-lg border border-subtle hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition text-secondary hover:text-primary cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
