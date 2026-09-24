import React from 'react';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header
      style={{
        backgroundColor: 'var(--color-bg-deep)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        userSelect: 'none',
      }}
    >
      {/* Brand & Logo DGDA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img
          src="/Logo-dgda.png"
          alt="Logo DGDA"
          style={{
            width: '38px',
            height: '38px',
            objectFit: 'contain',
            borderRadius: '6px',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                color: 'var(--color-text-primary)',
              }}
            >
              PROCEZO
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
            Direction Générale des Douanes et Accises — RDC
          </div>
        </div>
      </div>

      {/* Right: Floating Pill Search Bar (Style from reference image) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
