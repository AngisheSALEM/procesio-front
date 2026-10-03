import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  Clock,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import type { EnqueteDataRow } from './types';
import {
  TableContainer,
  TableToolbar,
  TableHeadCell,
  TableRow,
  TableCell,
  TableEmptyState
} from '../table-system/TablePrimitives';

interface TableVariantGroupedProps {
  data: EnqueteDataRow[];
  onOpenDossier?: (id: string) => void;
}

export const TableVariantGrouped: React.FC<TableVariantGroupedProps> = ({
  data,
  onOpenDossier,
}) => {
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    conforme: false,
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredData = data.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.reference.toLowerCase().includes(q) ||
      row.operateur.toLowerCase().includes(q) ||
      row.nif.toLowerCase().includes(q)
    );
  });

  // Group definitions
  const groups = [
    {
      id: 'critique',
      title: 'Urgences & Contentieux DGDA',
      badgeType: 'danger' as const,
      icon: <AlertOctagon size={14} />,
      rows: filteredData.filter((r) => r.statut === 'CRITIQUE' || r.statut === 'CONTENTIEUX'),
    },
    {
      id: 'en_cours',
      title: 'Instructions en cours & Attente de pièces',
      badgeType: 'warning' as const,
      icon: <Clock size={14} />,
      rows: filteredData.filter((r) => r.statut === 'EN_COURS' || r.statut === 'EN_ATTENTE'),
    },
    {
      id: 'conforme',
      title: 'Affaires régularisées & Conformes',
      badgeType: 'success' as const,
      icon: <CheckCircle2 size={14} />,
      rows: filteredData.filter((r) => r.statut === 'CONFORME'),
    },
  ];

  return (
    <TableContainer>
      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filtrer parmi les groupes..."
        actionsSlot={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setCollapsedGroups({})}
            >
              Tout déplier
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setCollapsedGroups({ critique: true, en_cours: true, conforme: true })}
            >
              Tout replier
            </button>
          </div>
        }
      />

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <TableHeadCell width="32%">Entreprise & Dossier</TableHeadCell>
              <TableHeadCell width="20%">Bureau douanier</TableHeadCell>
              <TableHeadCell width="18%" align="right">Valeur CAF déclarée</TableHeadCell>
              <TableHeadCell width="16%" align="center">Risque estimé</TableHeadCell>
              <TableHeadCell width="14%" align="right">Actions</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {groups.every((g) => g.rows.length === 0) ? (
              <tr>
                <td colSpan={5}>
                  <TableEmptyState onReset={() => setSearch('')} />
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                if (group.rows.length === 0) return null;
                const isCollapsed = collapsedGroups[group.id] || false;
                const totalValueUSD = group.rows.reduce((acc, r) => acc + r.valeurUSD, 0);

                return (
                  <React.Fragment key={group.id}>
                    {/* Group Header Row */}
                    <tr
                      onClick={() => toggleGroup(group.id)}
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderTop: '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <td colSpan={5} style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <span style={{ color: `var(--color-${group.badgeType})`, display: 'inline-flex' }}>
                              {group.icon}
                            </span>
                            <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {group.title}
                            </strong>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--color-bg)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {group.rows.length} dossier{group.rows.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Sous-total : <strong className="font-sf" style={{ color: 'var(--color-text-primary)' }}>{totalValueUSD.toLocaleString('fr-FR')} $</strong>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Group Rows (if not collapsed) */}
                    {!isCollapsed &&
                      group.rows.map((row) => (
                        <TableRow
                          key={row.id}
                          onClick={() => onOpenDossier?.(row.id)}
                        >
                          {/* Col 1 : Seul le nom de l'entreprise est en gras */}
                          <TableCell>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {row.operateur}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                {row.reference.replace('DGDA/DRK/DIR-ENQ/2026/', '.../')}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                NIF: {row.nif}
                              </span>
                            </div>
                          </TableCell>

                          {/* Col 2 */}
                          <TableCell>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 400 }}>
                              {row.bureau.split('(')[0]}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {row.regime.split('—')[0]}
                            </div>
                          </TableCell>

                          {/* Col 3 */}
                          <TableCell align="right" isNumeric>
                            <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {row.valeurUSD.toLocaleString('fr-FR')} $
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              Échéance: {row.echeance}
                            </div>
                          </TableCell>

                          {/* Col 4 */}
                          <TableCell align="center">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor:
                                  row.tauxRisque >= 80
                                    ? 'var(--color-danger-surface)'
                                    : row.tauxRisque >= 50
                                    ? 'var(--color-warning-surface)'
                                    : 'var(--color-success-surface)',
                                color:
                                  row.tauxRisque >= 80
                                    ? 'var(--color-danger)'
                                    : row.tauxRisque >= 50
                                    ? 'var(--color-warning)'
                                    : 'var(--color-success)',
                              }}
                            >
                              {row.tauxRisque}% risque
                            </span>
                          </TableCell>

                          {/* Col 5 */}
                          <TableCell align="right">
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDossier?.(row.id);
                              }}
                            >
                              <FolderOpen size={12} />
                              <span>Instruction</span>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};
