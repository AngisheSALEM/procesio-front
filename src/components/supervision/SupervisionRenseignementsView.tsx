import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeft,
  Radio,
  Link as LinkIcon,
  Info,
  Lock
} from 'lucide-react';
import type { RenseignementItem, DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { fetchStatisticsDetail, type ApiStatisticsDetail } from '../../api/client';
import { TablePagination } from '../common/TablePagination';

interface SupervisionRenseignementsViewProps {
  renseignements: RenseignementItem[];
  dossiers?: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
  unit?: string;
  start?: string;
  end?: string;
}

export const SupervisionRenseignementsView: React.FC<SupervisionRenseignementsViewProps> = ({
  renseignements,
  dossiers: _dossiers,
  onOpenDossier: _onOpenDossier,
  onBack,
  unit,
  start,
  end,
}) => {
  const [search, setSearch] = useState('');
  const [activeMetric, setActiveMetric] = useState<'intelligence.received' | 'intelligence.linked_cases'>('intelligence.received');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [detailData, setDetailData] = useState<ApiStatisticsDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unit || !start || !end) return;
    let active = true;
    setLoading(true);
    fetchStatisticsDetail(activeMetric, unit, start, end)
      .then((data) => {
        if (active) {
          setDetailData(data);
          setCurrentPage(1);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement détails renseignements:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeMetric, unit, start, end]);

  // Fallback to local list if backend stats not loaded
  const allLocal = renseignements.map((r) => ({
    id: r.id,
    url: `/api/v1/renseignements/${r.id}/`,
    reference: r.reference,
    title: r.objet || r.resume,
    date: r.dateReception || '',
    extra: r.origine,
  }));

  const totalCount = detailData ? detailData.count : allLocal.length;
  const items = detailData ? detailData.results : allLocal;

  const filtered = items.filter((row) => {
    const q = search.toLowerCase();
    const ref = (row.reference || '').toLowerCase();
    const title = (row.title || '').toLowerCase();
    const extra = (row.extra || '').toLowerCase();
    return ref.includes(q) || title.includes(q) || extra.includes(q);
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Header */}
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
                Supervision des Renseignements Douaniers
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Famille "intelligence" · Décompte par date d’enregistrement et suites documentées
              </div>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-btn)',
              padding: '3px',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMetric('intelligence.received')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: activeMetric === 'intelligence.received' ? 700 : 500,
                backgroundColor: activeMetric === 'intelligence.received' ? 'var(--color-surface-elevated)' : 'transparent',
                color: activeMetric === 'intelligence.received' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Radio size={14} />
              <span>Renseignements enregistrés</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('intelligence.linked_cases')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: activeMetric === 'intelligence.linked_cases' ? 700 : 500,
                backgroundColor: activeMetric === 'intelligence.linked_cases' ? 'var(--color-surface-elevated)' : 'transparent',
                color: activeMetric === 'intelligence.linked_cases' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <LinkIcon size={14} />
              <span>Liés à un dossier</span>
            </button>
          </div>
        </div>

        {/* Masked indicator notice (intelligence.effects) */}
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--color-text-primary)',
          }}
        >
          <Lock size={15} color="var(--color-warning, #eab308)" />
          <div>
            <strong>Indicateur "intelligence.effects" (Effets obtenus) :</strong> Masqué par la DGDA —{' '}
            <em>Les catégories et preuves d'effet doivent être définies par la DGDA ; un dossier ouvert n'est qu'une suite documentée.</em>
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
              {activeMetric === 'intelligence.received'
                ? "Définition : Un renseignement par date d'enregistrement, même s'il est lié à plusieurs dossiers."
                : "Définition : Un renseignement enregistré dans la période et lié à au moins un dossier visible ; cette suite ne prouve pas un effet métier."}
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
              placeholder="Filtrer par référence, objet, provenance..."
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
            Affichage de {paginated.length} sur {filtered.length} renseignements correspondants
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
                <th style={{ padding: '12px 18px' }}>Référence</th>
                <th style={{ padding: '12px 18px' }}>Objet</th>
                <th style={{ padding: '12px 18px' }}>Provenance</th>
                <th style={{ padding: '12px 18px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Chargement des renseignements depuis le serveur...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun renseignement correspondant sur cette période.
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
                      {row.title || 'Renseignement douanier'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-muted)',
                          fontSize: '11px',
                          color: 'var(--color-text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {row.extra || 'Non spécifiée'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {row.date || '—'}
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

export default SupervisionRenseignementsView;
