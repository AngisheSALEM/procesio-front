import React, { useState } from 'react';
import {
  ArrowLeft,
  Search
} from 'lucide-react';
import type { FeuilleObservation, DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { TablePagination } from '../common/TablePagination';

interface SupervisionFeuillesViewProps {
  feuilles: Record<string, FeuilleObservation[]>;
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionFeuillesView: React.FC<SupervisionFeuillesViewProps> = ({
  feuilles,
  dossiers,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Flatten observations across all observation sheets
  const allObservations = Object.entries(feuilles).flatMap(([dossierId, fList]) => {
    const dossier = dossiers.find((d) => d.id === dossierId);
    return fList.flatMap((f) =>
      (f.observations || []).map((obs) => ({
        feuille: f,
        observation: obs,
        dossier,
      }))
    );
  });

  // Calculate statistics
  const totalConstats = allObservations.length;
  const regularises = allObservations.filter((x) => x.observation.statutConstat === 'CLOS_REGULARISE').length;
  const enCours = allObservations.filter(
    (x) =>
      x.observation.statutConstat === 'OUVERT' ||
      x.observation.statutConstat === 'EN_ATTENTE_REPONSE' ||
      x.observation.statutConstat === 'REPONSE_RECUE'
  ).length;
  const contentieux = allObservations.filter((x) => x.observation.statutConstat === 'MAINTENU_CONTENTIEUX').length;

  // Filter
  const filtered = allObservations.filter(({ feuille, observation, dossier }) => {
    const q = search.toLowerCase();
    const matchSearch =
      feuille.reference.toLowerCase().includes(q) ||
      observation.titre.toLowerCase().includes(q) ||
      observation.code.toLowerCase().includes(q) ||
      feuille.destinataire.toLowerCase().includes(q) ||
      (dossier && dossier.reference.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterStatut === 'REGULARISE') return observation.statutConstat === 'CLOS_REGULARISE';
    if (filterStatut === 'EN_COURS')
      return (
        observation.statutConstat === 'OUVERT' ||
        observation.statutConstat === 'EN_ATTENTE_REPONSE' ||
        observation.statutConstat === 'REPONSE_RECUE'
      );
    if (filterStatut === 'CONTENTIEUX') return observation.statutConstat === 'MAINTENU_CONTENTIEUX';

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & KPI Counters */}
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
                Supervision des Feuilles d’Observation
              </h3>
            </div>
          </div>
        </div>

        {/* 4 Metric Badges - Same style as SupervisionOverviewTab */}
        <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total Constats Notifiés
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {totalConstats}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Sur {Object.values(feuilles).flat().length} feuilles d’observation
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Clos & Régularisés
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {regularises}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Régularisation spontanée ou preuve
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Phase Contradictoire En Cours
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {enCours}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Défense reçue ou réunion fixée
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Maintenus Contentieux (PV)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {contentieux}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Infraction avérée transmise
            </div>
          </div>
        </div>

        {/* Filters and Search - Monochrome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'TOUS', label: `Tous les constats (${totalConstats})` },
              { id: 'REGULARISE', label: `Régularisés (${regularises})` },
              { id: 'EN_COURS', label: `Contradictoire en cours (${enCours})` },
              { id: 'CONTENTIEUX', label: `Maintenus Contentieux (${contentieux})` },
            ].map((tab) => {
              const isSelected = filterStatut === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatut(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: isSelected ? 'var(--color-surface-elevated)' : 'var(--color-surface-muted)',
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
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
              placeholder="Rechercher constat, feuille..."
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

      {/* Observations Table */}
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
              <th style={{ padding: '12px 16px' }}>Entreprise</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Constat</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune observation trouvée pour les critères spécifiés.
                </td>
              </tr>
            ) : (
              filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(({ feuille, observation, dossier }) => (
                  <tr
                    key={`${feuille.id}-${observation.code}`}
                    onClick={() => onOpenDossier(feuille.dossierId || (dossier ? dossier.id : ''), 'constats-defense')}
                    className="card-interactive"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {/* Entreprise: Bold per DESIGN.md */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {dossier ? dossier.entiteControlee.nom : feuille.destinataire}
                      </div>
                    </td>

                    {/* Code & Réf: Muted per DESIGN.md */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Rédigée le {feuille.dateRedaction}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '12px' }}>
                        {observation.titre}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {observation.statutConstat === 'CLOS_REGULARISE'
                          ? 'Régularisé'
                          : observation.statutConstat === 'MAINTENU_CONTENTIEUX'
                          ? 'Contentieux'
                          : observation.statutConstat === 'EN_ATTENTE_REPONSE'
                          ? 'En attente'
                          : observation.statutConstat === 'REPONSE_RECUE'
                          ? 'Réponse reçue'
                          : observation.statutConstat === 'OUVERT'
                          ? 'Ouvert'
                          : String(observation.statutConstat || 'Autre')}
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
          itemLabel="constats"
        />
      </div>
    </div>
  );
};
