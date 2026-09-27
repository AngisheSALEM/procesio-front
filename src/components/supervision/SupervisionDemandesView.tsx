import React, { useState } from 'react';
import {
  ArrowLeft,
  Search
} from 'lucide-react';
import type { DemandeCommunication, DossierEnquete } from '../../types';
import type { DossierTabId } from '../DossierHeader';

interface SupervisionDemandesViewProps {
  demandes: Record<string, DemandeCommunication[]>;
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionDemandesView: React.FC<SupervisionDemandesViewProps> = ({
  demandes,
  dossiers,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');

  // Flatten all demandes
  const allDemandes = Object.entries(demandes).flatMap(([dossierId, list]) => {
    const dossier = dossiers.find((d) => d.id === dossierId);
    return list.map((d) => ({
      demande: d,
      dossier,
    }));
  });

  // Calculate statistics
  const total = allDemandes.length;
  const completes = allDemandes.filter((x) => x.demande.statut === 'REPONSE_COMPLETE').length;
  const partielles = allDemandes.filter((x) => x.demande.statut === 'REPONSE_PARTIELLE').length;
  const enAttente = allDemandes.filter((x) => x.demande.statut === 'EMISE' || x.demande.statut === 'A_VALIDER').length;
  const tauxReponse = total > 0 ? Math.round(((completes + partielles) / total) * 100) : 0;

  // Filter
  const filtered = allDemandes.filter(({ demande, dossier }) => {
    const q = search.toLowerCase();
    const matchSearch =
      demande.reference.toLowerCase().includes(q) ||
      demande.destinataire.nom.toLowerCase().includes(q) ||
      (demande.objet && demande.objet.toLowerCase().includes(q)) ||
      (dossier && dossier.reference.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterStatut === 'COMPLETE') return demande.statut === 'REPONSE_COMPLETE';
    if (filterStatut === 'PARTIELLE') return demande.statut === 'REPONSE_PARTIELLE';
    if (filterStatut === 'ATTENTE') return demande.statut === 'EMISE' || demande.statut === 'A_VALIDER';

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Supervision Counters */}
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
                Supervision des Demandes de Communication 
              </h3>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards - Same style as SupervisionOverviewTab */}
        <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Total Demandes Émises
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Taux de réponse : {tauxReponse}%
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Réponses Complètes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {completes}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Toutes pièces requises fournies
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Réponses Partielles
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {partielles}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Relance ou astreinte requise
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              En Attente de Réponse
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {enAttente}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Dans les délais légaux
            </div>
          </div>
        </div>

        {/* Filters and Search - Monochrome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'TOUS', label: `Toutes (${total})` },
              { id: 'COMPLETE', label: `Complètes (${completes})` },
              { id: 'PARTIELLE', label: `Partielles (${partielles})` },
              { id: 'ATTENTE', label: `En attente (${enAttente})` },
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
              placeholder="Rechercher par référence, banque..."
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

      {/* Table of Demandes */}
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
              <th style={{ padding: '12px 16px' }}>Destinataire Réquisitionné</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Dossier Lié & Entité</th>
              <th style={{ padding: '12px 16px' }}>Échéance</th>
              <th style={{ padding: '12px 16px' }}>Pièces Réclamées</th>
              <th style={{ padding: '12px 16px' }}>Statut Réponse</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune demande de communication trouvée.
                </td>
              </tr>
            ) : (
              filtered.map(({ demande, dossier }) => {
                const totalElements = demande.elementsDemandes.length;
                const fournis = demande.elementsDemandes.filter((e) => e.statutRemise === 'FOURNI').length;

                return (
                  <tr
                    key={demande.id}
                    onClick={() => onOpenDossier(demande.dossierId || (dossier ? dossier.id : ''), 'actions-echanges')}
                    className="card-interactive"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {/* Destinataire: Anchor */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {demande.destinataire.nom}
                      </div>
                    </td>

                    {/* Référence / Date */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {demande.dateEmission || '20/08/2026'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        {dossier ? dossier.entiteControlee.nom : demande.dossierId}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {demande.echeanceReponse}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {fournis} / {totalElements} pièces remises
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {demande.statut === 'REPONSE_COMPLETE'
                          ? 'Complète'
                          : demande.statut === 'REPONSE_PARTIELLE'
                          ? 'Partielle'
                          : demande.statut === 'EMISE'
                          ? 'Émise'
                          : demande.statut === 'A_VALIDER'
                          ? 'À valider'
                          : demande.statut.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
