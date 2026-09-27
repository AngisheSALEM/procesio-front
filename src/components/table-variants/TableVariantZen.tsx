import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal
} from 'lucide-react';
import type { EnqueteDataRow } from './mockTableData';
import {
  TableContainer,
  TableToolbar,
  TableHeadCell,
  TableRow,
  TableCell,
  TableBadge,
  TableEmptyState
} from '../table-system/TablePrimitives';

interface TableVariantZenProps {
  data: EnqueteDataRow[];
  onOpenDossier?: (id: string) => void;
}

export const TableVariantZen: React.FC<TableVariantZenProps> = ({
  data,
  onOpenDossier,
}) => {
  const [activeFacet, setActiveFacet] = useState<'all' | 'urgent' | 'high_value' | 'im4'>('all');
  const [search, setSearch] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    bureau: true,
    regime: true,
    marchandise: false,
    inspecteur: true,
    risque: true,
  });

  // Smart filters computation
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Facet check
      if (activeFacet === 'urgent' && row.joursRestants > 5) return false;
      if (activeFacet === 'high_value' && row.valeurUSD < 1000000) return false;
      if (activeFacet === 'im4' && !row.regime.startsWith('IM4')) return false;

      // 2. Search check
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        row.reference.toLowerCase().includes(q) ||
        row.operateur.toLowerCase().includes(q) ||
        row.bureau.toLowerCase().includes(q) ||
        row.marchandise.toLowerCase().includes(q)
      );
    });
  }, [data, activeFacet, search]);

  const facets = [
    { id: 'all', label: 'Toutes les affaires', count: data.length },
    { id: 'urgent', label: 'Urgences J-5', count: data.filter((d) => d.joursRestants <= 5).length },
    { id: 'high_value', label: 'Valeur > 1M $', count: data.filter((d) => d.valeurUSD >= 1000000).length },
    { id: 'im4', label: 'Importation IM4', count: data.filter((d) => d.regime.startsWith('IM4')).length },
  ];

  return (
    <TableContainer>
      {/* 1. Smart Facets Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
          Vues rapides :
        </span>
        {facets.map((f) => {
          const isActive = activeFacet === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFacet(f.id as typeof activeFacet)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                color: isActive ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{f.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  opacity: isActive ? 0.9 : 0.6,
                }}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Search and Columns customizer */}
      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche instantanée..."
        actionsSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              <SlidersHorizontal size={13} />
              <span>Colonnes ({Object.values(visibleColumns).filter(Boolean).length})</span>
            </button>

            {/* Column customizer dropdown */}
            {showColumnMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  width: '200px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '10px',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Afficher / Masquer
                </div>
                {(Object.keys(visibleColumns) as (keyof typeof visibleColumns)[]).map((col) => (
                  <label
                    key={col}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col]}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({ ...prev, [col]: e.target.checked }))
                      }
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* 3. Zen Minimalist Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <TableHeadCell width="32%">Affaire & Opérateur</TableHeadCell>
              {visibleColumns.regime && <TableHeadCell width="14%">Régime</TableHeadCell>}
              {visibleColumns.bureau && <TableHeadCell width="16%">Poste frontalier</TableHeadCell>}
              {visibleColumns.marchandise && <TableHeadCell width="16%">Marchandise</TableHeadCell>}
              {visibleColumns.inspecteur && <TableHeadCell width="14%">Inspecteur</TableHeadCell>}
              <TableHeadCell width="16%" align="right">Valeur CAF</TableHeadCell>
              {visibleColumns.risque && <TableHeadCell width="10%" align="center">Risque</TableHeadCell>}
              <TableHeadCell width="12%" align="right">Statut</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <TableEmptyState
                    title="Aucune affaire pour cette vue"
                    description="Changez de vue rapide ou supprimez les termes de recherche pour voir l'ensemble des affaires."
                    onReset={() => {
                      setActiveFacet('all');
                      setSearch('');
                    }}
                  />
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onOpenDossier?.(row.id)}
                >
                  {/* Opérateur & Réf : Seul l'opérateur est en gras */}
                  <TableCell density="spacious">
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {row.operateur}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        {row.reference.replace('DGDA/DRK/DIR-ENQ/2026/', '.../')}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        NIF {row.nif}
                      </span>
                    </div>
                  </TableCell>

                  {/* Régime */}
                  {visibleColumns.regime && (
                    <TableCell density="spacious">
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-surface-elevated)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {row.regime.split('—')[0]}
                      </span>
                    </TableCell>
                  )}

                  {/* Bureau */}
                  {visibleColumns.bureau && (
                    <TableCell density="spacious">
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        {row.bureau.split('(')[0]}
                      </div>
                    </TableCell>
                  )}

                  {/* Marchandise */}
                  {visibleColumns.marchandise && (
                    <TableCell density="spacious">
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {row.marchandise}
                      </div>
                    </TableCell>
                  )}

                  {/* Inspecteur */}
                  {visibleColumns.inspecteur && (
                    <TableCell density="spacious">
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {row.inspecteur.replace('Insp. ', '')}
                      </div>
                    </TableCell>
                  )}

                  {/* Valeur */}
                  <TableCell density="spacious" align="right" isNumeric>
                    <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {row.valeurUSD.toLocaleString('fr-FR')} $
                    </div>
                  </TableCell>

                  {/* Risque */}
                  {visibleColumns.risque && (
                    <TableCell density="spacious" align="center">
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color:
                            row.tauxRisque >= 80
                              ? 'var(--color-danger)'
                              : row.tauxRisque >= 50
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                        }}
                      >
                        {row.tauxRisque}%
                      </span>
                    </TableCell>
                  )}

                  {/* Statut */}
                  <TableCell density="spacious" align="right">
                    <TableBadge
                      label={row.statut}
                      type={
                        row.statut === 'CRITIQUE' || row.statut === 'CONTENTIEUX'
                          ? 'danger'
                          : row.statut === 'EN_ATTENTE'
                          ? 'warning'
                          : row.statut === 'CONFORME'
                          ? 'success'
                          : 'info'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};
