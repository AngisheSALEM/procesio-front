import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  FileCheck,
  ShieldAlert,
  ExternalLink,
  Info,
  Lock
} from 'lucide-react';
import type { FeuilleObservation, DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { fetchStatisticsDetail, type ApiStatisticsDetail } from '../../api/client';
import { TablePagination } from '../common/TablePagination';

interface SupervisionFeuillesViewProps {
  feuilles: Record<string, FeuilleObservation[]>;
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
  unit?: string;
  start?: string;
  end?: string;
}

export const SupervisionFeuillesView: React.FC<SupervisionFeuillesViewProps> = ({
  feuilles,
  dossiers,
  onOpenDossier,
  onBack,
  unit,
  start,
  end,
}) => {
  const [search, setSearch] = useState('');
  const [activeMetric, setActiveMetric] = useState<'sheets.created' | 'sheets.defenses'>('sheets.created');
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
        console.error('Erreur chargement détails feuilles:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeMetric, unit, start, end]);

  // Fallback to local list if backend stats not loaded
  const allLocalFeuilles = Object.entries(feuilles).flatMap(([dossierId, list]) => {
    const dossier = dossiers.find((d) => d.id === dossierId);
    return list.map((f) => ({
      id: f.id,
      url: `/api/v1/feuilles/${f.id}/`,
      reference: f.reference,
      title: f.observations?.[0]?.titre || f.observations?.[0]?.faitsConstates || f.destinataire,
      date: f.dateRedaction || '',
      case_id: dossierId,
      case_reference: dossier?.reference || dossierId,
    }));
  });

  const totalCount = detailData ? detailData.count : allLocalFeuilles.length;
  const items = detailData ? detailData.results : allLocalFeuilles;

  const filtered = items.filter((row) => {
    const q = search.toLowerCase();
    const ref = (row.reference || '').toLowerCase();
    const title = (row.title || '').toLowerCase();
    const caseRef = (row.case_reference || '').toLowerCase();
    return ref.includes(q) || title.includes(q) || caseRef.includes(q);
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
                Supervision des Feuilles d’Observation
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Famille "sheets" · Feuilles créées, défenses reçues et indicateurs sous réserve DGDA
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
              onClick={() => setActiveMetric('sheets.created')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: activeMetric === 'sheets.created' ? 700 : 500,
                backgroundColor: activeMetric === 'sheets.created' ? 'var(--color-surface-elevated)' : 'transparent',
                color: activeMetric === 'sheets.created' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <FileCheck size={14} />
              <span>Feuilles créées (sheets.created)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('sheets.defenses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: activeMetric === 'sheets.defenses' ? 700 : 500,
                backgroundColor: activeMetric === 'sheets.defenses' ? 'var(--color-surface-elevated)' : 'transparent',
                color: activeMetric === 'sheets.defenses' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ShieldAlert size={14} />
              <span>Défenses reçues (sheets.defenses)</span>
            </button>
          </div>
        </div>

        {/* Masked indicator notice (sheets.issued) */}
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
            <strong>Indicateur "sheets.issued" (Feuilles émises ou notifiées) :</strong> Masqué par la DGDA —{' '}
            <em>Aucun constat d'émission ou de notification de feuille n'est enregistré.</em>
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
              {activeMetric === 'sheets.created'
                ? "Définition : Une feuille par date d'enregistrement du brouillon sur la période."
                : "Définition : Un courrier ou complément de défense enregistré par date réelle de réception."}
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
              placeholder="Filtrer par référence, objet, dossier..."
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
            Affichage de {paginated.length} sur {filtered.length} résultats correspondants
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
                <th style={{ padding: '12px 18px' }}>Faits / Objet</th>
                <th style={{ padding: '12px 18px' }}>Date</th>
                <th style={{ padding: '12px 18px' }}>Dossier associé</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Chargement des enregistrements depuis le serveur...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Aucun enregistrement ne correspond aux critères sur cette période.
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
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                      {row.title || 'Feuille d’observation'}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {row.date || '—'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {row.case_reference ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-surface-muted)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {row.case_reference}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      {row.case_id && (
                        <button
                          type="button"
                          onClick={() => onOpenDossier(row.case_id!, 'constats-defense')}
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
                          <span>Ouvrir dossier</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
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

export default SupervisionFeuillesView;
