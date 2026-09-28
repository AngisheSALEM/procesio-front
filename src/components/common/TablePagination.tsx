import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  itemLabel?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'éléments',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, currentPage * pageSize);

  // If there are no items or only 1 item and no pages, still render a discreet status
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        backgroundColor: 'var(--color-surface)',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div>
        {totalItems > 0 ? (
          <span>
            {startIndex}–{endIndex} sur{' '}
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{totalItems}</span> {itemLabel}
          </span>
        ) : (
          <span>0 {itemLabel}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(currentPage - 1)}
          title="Page précédente"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: canPrev ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)',
            cursor: canPrev ? 'pointer' : 'not-allowed',
            transition: 'background var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (canPrev) e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronLeft size={14} />
          <span>Précédent</span>
        </button>

        {/* Page pills for discreet navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
            // Keep pagination compact if many pages: only show first, last, and around current
            if (
              totalPages > 7 &&
              page !== 1 &&
              page !== totalPages &&
              Math.abs(page - currentPage) > 1
            ) {
              if (page === 2 || page === totalPages - 1) {
                return (
                  <span key={page} style={{ padding: '0 3px', color: 'var(--color-text-disabled)' }}>
                    …
                  </span>
                );
              }
              return null;
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                style={{
                  minWidth: '24px',
                  height: '24px',
                  padding: '0 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--color-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(currentPage + 1)}
          title="Page suivante"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: canNext ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)',
            cursor: canNext ? 'pointer' : 'not-allowed',
            transition: 'background var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (canNext) e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Suivant</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
