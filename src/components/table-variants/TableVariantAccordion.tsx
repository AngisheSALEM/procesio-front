import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { EnqueteDataRow } from './types';
import {
  TableContainer,
  TableToolbar,
  TableHeadCell,
  TableRow,
  TableCell,
  TableBadge,
  TableEmptyState
} from '../table-system/TablePrimitives';

interface TableVariantAccordionProps {
  data: EnqueteDataRow[];
  onOpenDossier?: (id: string) => void;
}

export const TableVariantAccordion: React.FC<TableVariantAccordionProps> = ({
  data,
  onOpenDossier,
}) => {
  const [search, setSearch] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(data[0]?.id || null);

  const filteredData = data.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.reference.toLowerCase().includes(q) ||
      row.operateur.toLowerCase().includes(q) ||
      row.marchandise.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <TableContainer>
      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une affaire..."
        filterSlot={
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Cliquez sur une ligne pour révéler les pièces, l’anomalie et les actions
          </div>
        }
      />

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}></th>
              <TableHeadCell width="32%">Dossier & Entreprise</TableHeadCell>
              <TableHeadCell width="24%">Régime & Poste Frontière</TableHeadCell>
              <TableHeadCell width="18%" align="right">Valeur CAF</TableHeadCell>
              <TableHeadCell width="18%" align="right">Statut & Échéance</TableHeadCell>
              <th style={{ width: '40px', borderBottom: '1px solid var(--color-border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <TableEmptyState onReset={() => setSearch('')} />
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const isExpanded = expandedRowId === row.id;
                const ratioPieces = Math.round((row.piecesFournies / row.piecesTotal) * 100);

                return (
                  <React.Fragment key={row.id}>
                    {/* Primary concise row */}
                    <TableRow
                      isExpanded={isExpanded}
                      onClick={() => toggleExpand(row.id)}
                    >
                      {/* Chevron state */}
                      <TableCell style={{ width: '40px', textAlign: 'center' }}>
                        <span style={{ color: isExpanded ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </TableCell>

                      {/* Dossier & Entreprise : SEUL LE NOM DE L'ENTREPRISE EST EN GRAS */}
                      <TableCell>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                          {row.operateur}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            {row.reference}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            • {row.inspecteur}
                          </span>
                        </div>
                      </TableCell>

                      {/* Régime & Poste */}
                      <TableCell>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 400 }}>
                          {row.regime.split('—')[0]}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {row.bureau}
                        </div>
                      </TableCell>

                      {/* Valeur CAF */}
                      <TableCell align="right" isNumeric>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                          {row.valeurUSD.toLocaleString('fr-FR')} $
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Risque: <span style={{ color: row.tauxRisque >= 80 ? 'var(--color-danger)' : 'inherit' }}>{row.tauxRisque}%</span>
                        </div>
                      </TableCell>

                      {/* Statut & Délai */}
                      <TableCell align="right">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
                          <span
                            className="font-sf"
                            style={{
                              fontSize: '11px',
                              color: row.joursRestants <= 3 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            }}
                          >
                            Échéance: {row.echeance}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action trigger */}
                      <TableCell style={{ width: '40px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          title="Voir le dossier"
                          style={{ padding: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDossier?.(row.id);
                          }}
                        >
                          <ArrowRight size={14} />
                        </button>
                      </TableCell>
                    </TableRow>

                    {/* Accordion Drawer (Revealed upon click) */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: 0,
                            backgroundColor: 'var(--color-bg)',
                            borderBottom: '2px solid var(--color-border)',
                          }}
                        >
                          <div
                            style={{
                              padding: '16px 20px',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '16px',
                            }}
                          >
                            {/* Panel 1: Anomalie & Constat d'audit */}
                            <div
                              style={{
                                padding: '12px 14px',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                                <ShieldAlert size={14} />
                                <span>Anomalie constatée à l’instruction</span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '8px', lineHeight: 1.5 }}>
                                {row.anomalieDetectee}
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                {row.tags.map((t) => (
                                  <span
                                    key={t}
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--color-surface-elevated)',
                                      color: 'var(--color-text-secondary)',
                                    }}
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Panel 2: Pièces justificatives et état d'instruction */}
                            <div
                              style={{
                                padding: '12px 14px',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                  Pièces communicables 
                                </span>
                                <span className="font-sf" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                                  {row.piecesFournies} / {row.piecesTotal} ({ratioPieces}%)
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div
                                style={{
                                  height: '6px',
                                  width: '100%',
                                  backgroundColor: 'var(--color-surface-elevated)',
                                  borderRadius: '3px',
                                  marginTop: '8px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${ratioPieces}%`,
                                    backgroundColor: ratioPieces === 100 ? 'var(--color-success)' : 'var(--color-accent)',
                                    transition: 'width 200ms ease',
                                  }}
                                />
                              </div>

                              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
                                <strong>Dernière action :</strong> {row.derniereAction}
                              </div>
                            </div>

                            {/* Panel 3: Boutons d'action rapide */}
                            <div
                              style={{
                                padding: '12px 14px',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                Actions opérationnelles
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => onOpenDossier?.(row.id)}
                                  style={{ justifyContent: 'center' }}
                                >
                                  Ouvrir l'instruction complète
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => alert(`Relance des pièces manquantes émise pour ${row.operateur}`)}
                                  style={{ justifyContent: 'center' }}
                                >
                                  Émettre une mise en demeure
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
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
