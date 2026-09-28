import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Calendar
} from 'lucide-react';
import type { DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { TablePagination } from '../common/TablePagination';

interface SupervisionClassementsViewProps {
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionClassementsView: React.FC<SupervisionClassementsViewProps> = ({
  dossiers,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter dossiers that are closed without action / classés sans suite
  const closedDossiers = dossiers.filter(
    (d) => d.decisionCloture === 'CLASSE_SANS_SUITE' || d.statut === 'CLOTURE'
  );

  const filtered = closedDossiers.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.reference.toLowerCase().includes(q) ||
      d.entiteControlee.nom.toLowerCase().includes(q) ||
      d.responsable.toLowerCase().includes(q) ||
      (d.motifClassement && d.motifClassement.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'none',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {onBack && (
                <button
                  onClick={onBack}
                  title="Retour à la synthèse"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Supervision des Dossiers Classés Sans Suite
              </h3>
            </div>
          </div>
        </div>

        {/* Metric Cards - Same style as SupervisionOverviewTab */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total Dossiers Classés Sans Suite
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {closedDossiers.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {Math.round((closedDossiers.length / (dossiers.length || 1)) * 100)}% de l’ensemble des dossiers instruits
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Motif Principal : Justificatifs Probants
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              100%
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Listing des décisions motivées de classement
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-surface-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              width: '260px',
            }}
          >
            <Search size={14} color="var(--color-text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par référence, entreprise..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="responsive-table-container" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Référence & Date Clôture</th>
              <th style={{ padding: '12px 16px' }}>Entreprise Contrôlée</th>
              <th style={{ padding: '12px 16px' }}>Inspecteur Instructeur</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun dossier classé sans suite ne correspond à la recherche.
                </td>
              </tr>
            ) : (
              filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => onOpenDossier(d.id, 'vue-ensemble')}
                    className="card-interactive"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {d.reference}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        <Calendar size={11} />
                        <span>Clôturé le {d.dateCloture || '14/09/2026'}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {d.entiteControlee.nom}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {d.responsable}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Classé sans suite
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        {/* Pagination discrète */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="dossiers classés"
        />
      </div>
    </div>
  );
};
