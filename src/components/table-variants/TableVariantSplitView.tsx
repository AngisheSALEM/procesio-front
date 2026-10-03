import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Shield,
  Send
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

interface TableVariantSplitViewProps {
  data: EnqueteDataRow[];
  onOpenDossier?: (id: string) => void;
}

export const TableVariantSplitView: React.FC<TableVariantSplitViewProps> = ({
  data,
  onOpenDossier,
}) => {
  const [selectedId, setSelectedId] = useState<string>(data[0]?.id || '');
  const [search, setSearch] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [notesHistory, setNotesHistory] = useState<Record<string, string[]>>({
    'row-001': [
      'Relance effectuée auprès de la banque le 22/09.',
      'Confrontation des chiffres avec le manifeste SYDONIA en cours.',
    ],
  });

  const filteredData = data.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.reference.toLowerCase().includes(q) ||
      row.operateur.toLowerCase().includes(q) ||
      row.bureau.toLowerCase().includes(q)
    );
  });

  const selectedRow = data.find((r) => r.id === selectedId) || data[0];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedRow) return;
    setNotesHistory((prev) => ({
      ...prev,
      [selectedRow.id]: [...(prev[selectedRow.id] || []), noteContent.trim()],
    }));
    setNoteContent('');
  };

  return (
    <TableContainer style={{ minHeight: '620px' }}>
      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une affaire..."
        actionsSlot={
          !isInspectorOpen && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsInspectorOpen(true)}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Afficher le volet d'instruction
            </button>
          )
        }
      />

      <div style={{ display: 'flex', flex: 1, minHeight: '520px', overflow: 'hidden' }}>
        {/* Left Side: Master Table */}
        <div style={{ flex: isInspectorOpen ? '1 1 62%' : '1 1 100%', overflowX: 'auto', borderRight: isInspectorOpen ? '1px solid var(--color-border)' : 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <TableHeadCell width="40%">Opérateur & Réf</TableHeadCell>
                <TableHeadCell width="25%">Régime / Bureau</TableHeadCell>
                <TableHeadCell width="20%" align="right">Montant USD</TableHeadCell>
                <TableHeadCell width="15%" align="right">Statut</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <TableEmptyState onReset={() => setSearch('')} />
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isSelected = isInspectorOpen && selectedId === row.id;

                  return (
                    <TableRow
                      key={row.id}
                      isSelected={isSelected}
                      onClick={() => {
                        setSelectedId(row.id);
                        if (!isInspectorOpen) setIsInspectorOpen(true);
                      }}
                    >
                      <TableCell>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                          {row.operateur}
                        </div>
                        <div className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400, marginTop: '2px' }}>
                          {row.reference.replace('DGDA/DRK/DIR-ENQ/2026/', '.../')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 400 }}>
                          {row.regime.split('—')[0]}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {row.bureau.split('(')[0]}
                        </div>
                      </TableCell>

                      <TableCell align="right" isNumeric>
                        <div style={{ fontWeight: 500, fontSize: '12px', color: 'var(--color-text-primary)' }}>
                          {row.valeurUSD.toLocaleString('fr-FR')} $
                        </div>
                        <div style={{ fontSize: '10px', color: row.tauxRisque >= 80 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                          Risque: {row.tauxRisque}%
                        </div>
                      </TableCell>

                      <TableCell align="right">
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Side: Persistent Inspection Panel */}
        {isInspectorOpen && selectedRow && (
          <div
            style={{
              flex: '0 0 38%',
              minWidth: '340px',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header of Inspector */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-surface-elevated)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="var(--color-accent)" />
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Fiche d'instruction rapide
                </h4>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setIsInspectorOpen(false)}
                style={{ padding: '2px' }}
                aria-label="Fermer le volet"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content of Inspector */}
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Dossier Title and Main Reference */}
              <div>
                <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                  {selectedRow.reference}
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  {selectedRow.operateur}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  NIF : <span className="font-sf">{selectedRow.nif}</span> • Agent : {selectedRow.inspecteur}
                </div>
              </div>

              {/* Status and Risk cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Échéance légale</div>
                  <div className="font-sf" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-danger)', marginTop: '2px' }}>
                    {selectedRow.echeance} (J-{selectedRow.joursRestants})
                  </div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Valeur SYDONIA</div>
                  <div className="font-sf" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {selectedRow.valeurUSD.toLocaleString()} $
                  </div>
                </div>
              </div>

              {/* Anomaly box */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-danger-surface)',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 90, 86, 0.25)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                  Anomalie constatée
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '4px', lineHeight: 1.4 }}>
                  {selectedRow.anomalieDetectee}
                </div>
              </div>

              {/* Internal Notes / Scratchpad for the inspector */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Notes d'instruction & audit
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  {(notesHistory[selectedRow.id] || []).map((n, i) => (
                    <div key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>• {n}</span>
                    </div>
                  ))}
                  {(!notesHistory[selectedRow.id] || notesHistory[selectedRow.id].length === 0) && (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune note pour le moment.</span>
                  )}
                </div>

                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Ajouter une observation rapide..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '11px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '6px 10px' }}>
                    <Send size={12} />
                  </button>
                </form>
              </div>

              {/* Full dossier button */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => onOpenDossier?.(selectedRow.id)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ExternalLink size={14} />
                <span>Ouvrir l'affaire dans l'application</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </TableContainer>
  );
};
