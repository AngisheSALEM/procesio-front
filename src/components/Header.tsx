import React from 'react';
import { Search, X, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
}) => {
  return (
    <header
      style={{
        backgroundColor: 'transparent',
        borderBottom: 'none',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        userSelect: 'none',
      }}
    >
      {/* Right: Floating Pill Search Bar + Quick Theme Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--glass-surface)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: '9999px',
            padding: '7px 16px',
            gap: '10px',
            width: '320px',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          <Search size={15} color="var(--color-text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un dossier, NIF, opérateur..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

       
      </div>
    </header>
  );
};
