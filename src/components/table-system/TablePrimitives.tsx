import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox
} from 'lucide-react';
import type { TableDensity, SortDirection, TableStatusType } from './types';

// ============================================================================
// 1. TableContainer
// ============================================================================
interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TableContainer: React.FC<TableContainerProps> = ({ children, style }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// 2. TableToolbar
// ============================================================================
interface TableToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  selectedCount?: number;
  bulkActions?: React.ReactNode;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Filtrer les lignes...',
  density,
  onDensityChange,
  selectedCount = 0,
  bulkActions,
  filterSlot,
  actionsSlot,
}) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: selectedCount > 0 ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        transition: 'background-color var(--transition-fast)',
      }}
    >
      {/* Left side: Search or Bulk Actions notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
        {selectedCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-bg)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
            {bulkActions}
          </div>
        ) : (
          onSearchChange && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                padding: '6px 12px',
                width: '100%',
                maxWidth: '320px',
              }}
            >
              <Search size={14} color="var(--color-text-muted)" />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>
          )
        )}

        {filterSlot}
      </div>

      {/* Right side: Density & Custom Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onDensityChange && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-btn)',
              padding: '2px',
              border: '1px solid var(--color-border)',
            }}
          >
            {(['compact', 'comfortable'] as TableDensity[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDensityChange(d)}
                style={{
                  border: 'none',
                  background: density === d ? 'var(--color-surface-elevated)' : 'transparent',
                  color: density === d ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: density === d ? 600 : 500,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {d === 'compact' ? 'Dense' : 'Aéré'}
              </button>
            ))}
          </div>
        )}

        {actionsSlot}
      </div>
    </div>
  );
};

// ============================================================================
// 3. TableHead & TableHeadCell
// ============================================================================
interface TableHeadCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

export const TableHeadCell: React.FC<TableHeadCellProps> = ({
  children,
  align = 'left',
  width,
  minWidth,
  sortable = false,
  sortDirection = null,
  onSort,
}) => {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      style={{
        padding: '10px 14px',
        textAlign: align,
        width,
        minWidth,
        color: 'var(--color-text-muted)',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        userSelect: 'none',
        cursor: sortable ? 'pointer' : 'default',
        transition: 'color var(--transition-fast)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
          width: '100%',
        }}
      >
        <span>{children}</span>
        {sortable && (
          <span style={{ color: sortDirection ? 'var(--color-accent)' : 'var(--color-text-disabled)' }}>
            {sortDirection === 'asc' ? (
              <ArrowUp size={12} />
            ) : sortDirection === 'desc' ? (
              <ArrowDown size={12} />
            ) : (
              <ArrowUpDown size={12} />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// ============================================================================
// 4. TableRow
// ============================================================================
interface TableRowProps {
  children: React.ReactNode;
  isSelected?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  isSelected = false,
  isExpanded = false,
  onClick,
  interactive = true,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  let bg = 'transparent';
  if (isSelected) bg = 'var(--color-surface-elevated)';
  else if (isExpanded) bg = 'var(--color-surface-muted)';
  else if (isHovered && interactive) bg = 'var(--color-surface-elevated)';

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: bg,
        borderBottom: '1px solid var(--color-border-subtle)',
        cursor: interactive && onClick ? 'pointer' : 'default',
        transition: 'background-color 140ms ease',
      }}
    >
      {children}
    </tr>
  );
};

// ============================================================================
// 5. TableCell
// ============================================================================
interface TableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  density?: TableDensity;
  isNumeric?: boolean;
  style?: React.CSSProperties;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  density = 'comfortable',
  isNumeric = false,
  style,
}) => {
  const paddingMap: Record<TableDensity, string> = {
    compact: '8px 12px',
    comfortable: '12px 14px',
    spacious: '16px 18px',
  };

  return (
    <td
      className={isNumeric ? 'font-sf' : undefined}
      style={{
        padding: paddingMap[density],
        textAlign: align,
        fontSize: density === 'compact' ? '12px' : '13px',
        color: 'var(--color-text-primary)',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {children}
    </td>
  );
};

// ============================================================================
// 6. TableBadge
// ============================================================================
interface TableBadgeProps {
  label: string;
  type?: TableStatusType;
  icon?: React.ReactNode;
}

export const TableBadge: React.FC<TableBadgeProps> = ({ label, type = 'neutral', icon }) => {
  const typeMap: Record<TableStatusType, { bg: string; color: string }> = {
    danger: { bg: 'var(--color-danger-surface)', color: 'var(--color-danger)' },
    warning: { bg: 'var(--color-warning-surface)', color: 'var(--color-warning)' },
    success: { bg: 'var(--color-success-surface)', color: 'var(--color-success)' },
    info: { bg: 'var(--color-info-surface)', color: 'var(--color-info)' },
    neutral: { bg: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' },
  };

  const style = typeMap[type];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.2px',
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

// ============================================================================
// 7. TableEmptyState
// ============================================================================
interface TableEmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  resetLabel?: string;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title = 'Aucune donnée correspondante',
  description = 'Essayez de modifier votre recherche ou de réinitialiser vos filtres.',
  onReset,
  resetLabel = 'Réinitialiser les critères',
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <Inbox size={22} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '380px' }}>
        {description}
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary"
          style={{ marginTop: '8px' }}
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 8. TablePaginationBar
// ============================================================================
interface TablePaginationBarProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const TablePaginationBar: React.FC<TablePaginationBarProps> = ({
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      style={{
        padding: '10px 16px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-text-muted)',
      }}
    >
      <div>
        Affichage de <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{startItem}</span> à{' '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{endItem}</span> sur{' '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{totalItems}</span> enregistrements
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Page {currentPage} sur {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="btn-ghost"
          style={{
            padding: '4px 6px',
            opacity: currentPage <= 1 ? 0.4 : 1,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="btn-ghost"
          style={{
            padding: '4px 6px',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
