import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Send
} from 'lucide-react';
import type { DossierEnquete, PvDetail } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { TablePagination } from '../common/TablePagination';

interface SupervisionPvViewProps {
  pvs: Record<string, PvDetail[]>;
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionPvView: React.FC<SupervisionPvViewProps> = ({
  pvs,
  dossiers,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Flatten PVs across all dossiers
  const allPvItems = Object.entries(pvs).flatMap(([dossierId, pList]) => {
    const dossier = dossiers.find((d) => d.id === dossierId);
    return pList.map((p) => ({
      pv: p,
      dossier,
    }));
  });


  // Filter
  const filtered = allPvItems.filter(({ pv, dossier }) => {
    const q = search.toLowerCase();
    return (
      pv.reference.toLowerCase().includes(q) ||
      pv.destinataire.toLowerCase().includes(q) ||
      pv.objet.toLowerCase().includes(q) ||
      (dossier && dossier.reference.toLowerCase().includes(q))
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
                Dossiers Ayant Conduit à l’Établissement d’un Procès-Verbal 
              </h3>
            </div>
          </div>
        </div>

        {/* 4 Cards - Same style as SupervisionOverviewTab */}


        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Registre des Procès-Verbaux d’Infraction Douanière
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
              placeholder="Rechercher par PV, entreprise..."
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
              <th style={{ padding: '12px 16px' }}>Dossier Lié & Entité</th>
              <th style={{ padding: '12px 16px' }}>Inspecteurs Verbalisateurs</th>
              <th style={{ padding: '12px 16px' }}>Type de PV</th>
              <th style={{ padding: '12px 16px' }}>Destination Contentieuse</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun procès-verbal ne correspond à la recherche.
                </td>
              </tr>
            ) : (
              filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(({ pv, dossier }) => (
                  <tr
                    key={pv.id}
                    onClick={() => onOpenDossier(pv.dossierId || (dossier ? dossier.id : ''), 'documents')}
                    className="card-interactive"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {pv.destinataire}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {pv.inspecteurs.join(', ')}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                        {pv.typePv || 'Procès-verbal d’infraction'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        <Send size={12} color="var(--color-text-muted)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pv.destinationContentieuse}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Dressé le {pv.datePv}
                      </div>
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
          itemLabel="procès-verbaux"
        />
      </div>
    </div>
  );
};
