import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import type { DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { fetchStatisticsDetail, type ApiStatisticsDetail } from '../../api/client';
import { TablePagination } from '../common/TablePagination';

interface SupervisionClassementsViewProps {
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
  unit?: string;
  start?: string;
  end?: string;
}

export const SupervisionClassementsView: React.FC<SupervisionClassementsViewProps> = ({
  dossiers,
  onOpenDossier,
  onBack,
  unit,
  start,
  end,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [detailData, setDetailData] = useState<ApiStatisticsDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unit || !start || !end) return;
    let active = true;
    setLoading(true);
    fetchStatisticsDetail('cases.classified', unit, start, end)
      .then((data) => {
        if (active) {
          setDetailData(data);
          setCurrentPage(1);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement détails classements:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [unit, start, end]);

  // Fallback to local closed dossiers if backend not loaded
  const closedLocalDossiers = dossiers
    .filter((d) => d.decisionCloture === 'CLASSE_SANS_SUITE')
    .map((d) => ({
      id: d.id,
      url: `/api/v1/dossiers/${d.id}/`,
      reference: d.reference,
      title: d.motifClassement || d.objet || d.entiteControlee.nom,
      date: d.dateCloture || d.dateCreation || '',
      case_id: d.id,
      case_reference: d.reference,
    }));

  const totalCount = detailData ? detailData.count : closedLocalDossiers.length;
  const items = detailData ? detailData.results : closedLocalDossiers;

  const filtered = items.filter((row) => {
    const q = search.toLowerCase();
    const ref = (row.reference || '').toLowerCase();
    const title = (row.title || '').toLowerCase();
    return ref.includes(q) || title.includes(q);
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Supervision Header */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Retour à la synthèse"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Dossiers d’Enquête Classés Sans Suite
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Famille "classifications" · Indicateur "cases.classified"
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-surface-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              fontSize: '12px',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <CheckCircle2 size={15} color="var(--color-accent)" />
            <span>Décision de classement validée courante</span>
          </div>
        </div>

        {/* Metric summary card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="var(--color-accent)" />
            <span>
              Définition backend : Un dossier par décision de classement validée courante, selon sa date de validation sur la période.
            </span>
          </div>
          <div>
            Total arrêté : <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>{loading ? '...' : totalCount}</strong>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-surface-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border-subtle)',
              width: '320px',
            }}
          >
            <Search size={14} color="var(--color-text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrer par référence, motif..."
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Affichage de {paginated.length} sur {filtered.length} dossiers classés
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-muted)',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <th style={{ padding: '12px 18px' }}>Référence Dossier</th>
                <th style={{ padding: '12px 18px' }}>Objet / Motif de classement</th>
                <th style={{ padding: '12px 18px' }}>Date de validation</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Chargement des dossiers classés sans suite...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun dossier classé sans suite validé sur la période sélectionnée.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {row.reference || String(row.id).slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                      {row.title || 'Classement sans suite validé'}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {row.date || '—'}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onOpenDossier(row.case_id || row.id, 'vue-ensemble')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-muted)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-accent)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Consulter dossier</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)' }}>
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default SupervisionClassementsView;
