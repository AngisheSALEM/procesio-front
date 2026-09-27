export type TableDensity = 'compact' | 'comfortable' | 'spacious';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableSortConfig {
  key: string;
  direction: SortDirection;
}

export type TableStatusType = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableAuditFinding {
  title: string;
  severity: 'critical' | 'high' | 'medium';
  problem: string;
  solution: string;
  lawRef: string;
}
