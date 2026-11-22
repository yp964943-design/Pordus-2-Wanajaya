'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

export function buildCompactPageItems(
  currentPage: number,
  totalPages: number
): PaginationToken[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const safeCurrent = Math.min(Math.max(1, currentPage), totalPages);
  const included = new Set<number>([1, safeCurrent, totalPages]);

  if (safeCurrent <= 2) {
    included.add(2);
  }
  if (safeCurrent >= totalPages - 1) {
    included.add(totalPages - 1);
  }

  const sorted = Array.from(included).sort((a, b) => a - b);
  const tokens: PaginationToken[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = page - prev;
      if (gap === 2) {
        tokens.push(prev + 1);
      } else if (gap > 2) {
        tokens.push(prev === 1 ? 'ellipsis-left' : 'ellipsis-right');
      }
    }
    tokens.push(page);
  }

  return tokens;
}

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel: string;
  info?: React.ReactNode;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
  getPageAriaLabel?: (page: number) => string;
  getPageTitle?: (page: number) => string;
  className?: string;
}

export default function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel,
  info,
  prevAriaLabel = 'Halaman sebelumnya',
  nextAriaLabel = 'Halaman selanjutnya',
  getPageAriaLabel,
  getPageTitle,
  className = '',
}: CompactPaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const tokens = buildCompactPageItems(safePage, totalPages);

  return (
    <div
      className={`pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 ${className}`}
    >
      {info ? (
        <div className="text-xs text-slate-400 tabular-nums">{info}</div>
      ) : (
        <span className="text-xs text-slate-400 tabular-nums">
          Halaman <span className="font-semibold text-slate-200">{safePage}/{totalPages}</span>
        </span>
      )}

      <nav aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5 sm:gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label={prevAriaLabel}
          title="Sebelum"
          className="min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Sebelum</span>
        </button>

        {tokens.map((token) => {
          if (token === 'ellipsis-left' || token === 'ellipsis-right') {
            return (
              <span
                key={token}
                aria-hidden="true"
                className="min-h-[44px] sm:min-h-[38px] px-1.5 flex items-center justify-center text-xs font-bold text-slate-500 select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = token === safePage;
          return (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={getPageAriaLabel ? getPageAriaLabel(token) : `Halaman ${token}`}
              title={getPageTitle ? getPageTitle(token) : `Halaman ${token}`}
              className={`min-h-[44px] min-w-[40px] sm:min-h-[38px] sm:min-w-[36px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer tabular-nums ${
                isCurrent
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                  : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
              }`}
            >
              {token}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label={nextAriaLabel}
          title="Selanjutnya"
          className="min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </nav>
    </div>
  );
}
