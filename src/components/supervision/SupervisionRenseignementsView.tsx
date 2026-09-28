import React, { useState } from 'react';
import {
  Search,
  ArrowLeft
} from 'lucide-react';
import type { RenseignementItem, DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { TablePagination } from '../common/TablePagination';

interface SupervisionRenseignementsViewProps {
  renseignements: RenseignementItem[];
  dossiers?: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionRenseignementsView: React.FC<SupervisionRenseignementsViewProps> = ({
  renseignements,
  dossiers: _dossiers,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [selectedInspector, setSelectedInspector] = useState<string>('TOUS');
  const [selectedEffet, setSelectedEffet] = useState<string>('TOUS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Extract distinct inspectors from cotations
  const inspecteursCotes = Array.from(
    new Set(renseignements.map((r) => r.coteA).filter(Boolean))
  ) as string[];

  // Statistical aggregates
  const total = renseignements.length;
  const enquetesOuvertes = renseignements.filter(
    (r) => r.effetProduit === 'ENQUETE_OUVERTE_AVEC_PV' || r.effetProduit === 'ENQUETE_EN_COURS'
  ).length;
  const avecPv = renseignements.filter((r) => r.effetProduit === 'ENQUETE_OUVERTE_AVEC_PV').length;
  const classesSansSuite = renseignements.filter((r) => r.effetProduit === 'CLASSE_SANS_SUITE').length;

  // Filter
  const filtered = renseignements.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.reference.toLowerCase().includes(q) ||
      r.objet.toLowerCase().includes(q) ||
      r.origine.toLowerCase().includes(q) ||
      (r.coteA && r.coteA.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (selectedInspector !== 'TOUS' && r.coteA !== selectedInspector) {
      return false;
    }

    if (selectedEffet === 'AVEC_PV' && r.effetProduit !== 'ENQUETE_OUVERTE_AVEC_PV') {
      return false;
    }
    if (selectedEffet === 'EN_COURS' && r.effetProduit !== 'ENQUETE_EN_COURS') {
      return false;
    }
    if (selectedEffet === 'CLASSE' && r.effetProduit !== 'CLASSE_SANS_SUITE') {
      return false;
    }

    return true;
  });

  const getRenseignementStatut = (ren: RenseignementItem) => {
    const linkedDossierId = ren.dossiersLies?.[0];
    const linkedDossier = linkedDossierId && _dossiers ? _dossiers.find((d) => d.id === linkedDossierId) : null;

    if (!linkedDossier) {
      if (ren.effetProduit === 'CLASSE_SANS_SUITE') return 'Classé sans suite';
      if (ren.effetProduit === 'ENQUETE_OUVERTE_AVEC_PV') return 'PV établi';
      if (ren.dossiersLies && ren.dossiersLies.length > 0) return 'Demande de communication';
      return 'En attente d’enquête';
    }

    if (linkedDossier.hasPv || ren.pvGenereRef || ren.effetProduit === 'ENQUETE_OUVERTE_AVEC_PV') {
      return 'PV établi';
    }
    if (linkedDossier.hasFeuille) {
      return 'Feuille d’observation';
    }
    if (linkedDossier.hasDemande || (ren.dossiersLies && ren.dossiersLies.length > 0)) {
      return 'Demande de communication';
    }
    if (linkedDossier.decisionCloture === 'CLASSE_SANS_SUITE' || ren.effetProduit === 'CLASSE_SANS_SUITE') {
      return 'Classé sans suite';
    }
    return 'Dossier d’enquête ouvert';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Supervision Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  title="Retour à la vue d'ensemble"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border-subtle)',
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
                Gestion du Renseignement : Cotations, Effets Produits & Évolution des Dossiers
              </h3>
            </div>
          </div>
        </div>

        {/* 4 Cards: Measuring Effects and Cotations - Same style as SupervisionOverviewTab */}
        <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Renseignements Reçus & Cotés
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {total}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Convertis en Enquêtes Ouvertes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {enquetesOuvertes}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Ayant Conduit à un PV
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {avecPv}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Vérifiés & Classés Sans Suite
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {classesSansSuite}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar - Strict Monochrome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'TOUS', label: `Tous les renseignements (${total})` },
              { id: 'AVEC_PV', label: `Ayant conduit à 1 PV (${avecPv})` },
              { id: 'EN_COURS', label: `Enquêtes en cours (${enquetesOuvertes - avecPv})` },
              { id: 'CLASSE', label: `Classés sans suite (${classesSansSuite})` },
            ].map((tab) => {
              const isSelected = selectedEffet === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedEffet(tab.id)}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Inspector Filter ("Savoir qui a été coté") */}
            <select
              value={selectedInspector}
              onChange={(e) => setSelectedInspector(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                padding: '6px 12px',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="TOUS">Qui a été coté : Tous les inspecteurs</option>
              {inspecteursCotes.map((insp) => (
                <option key={insp} value={insp}>
                  {insp}
                </option>
              ))}
            </select>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-surface-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-btn)',
                width: '240px',
              }}
            >
              <Search size={14} color="var(--color-text-muted)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher renseignement..."
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
      </div>

      {/* Table: Cotation & Effets */}
      <div className="responsive-table-container" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Origine</th>
              <th style={{ padding: '12px 16px' }}>Affectation</th>
              <th style={{ padding: '12px 16px' }}>Statut de la procédure</th>
             
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun renseignement trouvé pour les filtres sélectionnés.
                </td>
              </tr>
            ) : (
              filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((ren) => (
                  <tr
                    key={ren.id}
                    onClick={() => onOpenDossier(ren.dossiersLies?.[0] || 'dossier-0842', 'vue-ensemble')}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Reçu le {ren.dateReception}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '12px' }}>
                        {ren.origine}
                      </div>
                     
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        <span>{ren.coteA || 'Non coté'}</span>
                      </div>
                 
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {getRenseignementStatut(ren)}
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
          itemLabel="renseignements"
        />
      </div>
    </div>
  );
};
