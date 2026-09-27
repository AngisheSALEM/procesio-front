import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
        
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre officiel'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              backgroundColor: 'var(--glass-surface)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>
    </header>
  );
};
