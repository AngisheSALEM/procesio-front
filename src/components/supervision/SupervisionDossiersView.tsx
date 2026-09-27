import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowLeft,
  X
} from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail
} from '../../types';
import type { DossierTabId } from '../DossierHeader';

interface SupervisionDossiersViewProps {
  dossiers: DossierEnquete[];
  demandes: Record<string, DemandeCommunication[]>;
  feuilles: Record<string, FeuilleObservation[]>;
  pvs: Record<string, PvDetail[]>;
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onBack?: () => void;
}

export const SupervisionDossiersView: React.FC<SupervisionDossiersViewProps> = ({
  dossiers,
  demandes,
  feuilles,
  pvs,
  onOpenDossier,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'TOUS' | 'AVEC_PV' | 'CLASSE_SANS_SUITE' | 'EN_COURS' | 'CONTENTIEUX'>('TOUS');
  const [selectedInspector, setSelectedInspector] = useState<string>('TOUS');

  // Collect inspectors
  const inspecteurs = Array.from(new Set(dossiers.map((d) => d.responsable).filter(Boolean)));

  // Filter dossiers
  const filtered = dossiers.filter((d) => {
    // Search
    const q = search.toLowerCase();
    const matchSearch =
      d.reference.toLowerCase().includes(q) ||
      d.entiteControlee.nom.toLowerCase().includes(q) ||
      d.objet.toLowerCase().includes(q) ||
      d.responsable.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Filter Inspector
    if (selectedInspector !== 'TOUS' && d.responsable !== selectedInspector) {
      return false;
    }

    // Filter Statut
    if (filterStatut === 'AVEC_PV') {
      return d.hasPv || (pvs[d.id] && pvs[d.id].length > 0);
    }
    if (filterStatut === 'CLASSE_SANS_SUITE') {
      return d.decisionCloture === 'CLASSE_SANS_SUITE' || d.statut === 'CLOTURE';
    }
    if (filterStatut === 'EN_COURS') {
      return d.statut === 'EN_COURS' || d.statut === 'EN_ATTENTE';
    }
    if (filterStatut === 'CONTENTIEUX') {
      return d.statut === 'RELAIS_CONTENTIEUX' || d.statut === 'A_VALIDER';
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Filter Pills & Search */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
              Supervision Générale de Tous les Dossiers d’Enquête
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-surface-muted)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-btn)',
                width: '260px',
              }}
            >
              <Search size={14} color="var(--color-text-muted)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dossier, entreprise..."
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  width: '100%',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} color="var(--color-text-muted)" />
                </button>
              )}
            </div>

            {/* Inspector Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--color-text-muted)" />
              <select
                value={selectedInspector}
                onChange={(e) => setSelectedInspector(e.target.value)}
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-btn)',
                  padding: '8px 12px',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="TOUS">Tous les inspecteurs</option>
                {inspecteurs.map((insp) => (
                  <option key={insp} value={insp}>
                    {insp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Badges - Monochrome pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'TOUS', label: `Tous les dossiers (${dossiers.length})` },
            { id: 'AVEC_PV', label: `Dossiers avec PV (${dossiers.filter((d) => d.hasPv || (pvs[d.id] && pvs[d.id].length > 0)).length})` },
            { id: 'CLASSE_SANS_SUITE', label: `Classés sans suite (${dossiers.filter((d) => d.decisionCloture === 'CLASSE_SANS_SUITE' || d.statut === 'CLOTURE').length})` },
            { id: 'EN_COURS', label: `En instruction (${dossiers.filter((d) => d.statut === 'EN_COURS' || d.statut === 'EN_ATTENTE').length})` },
            { id: 'CONTENTIEUX', label: `Relais Contentieux (${dossiers.filter((d) => d.statut === 'RELAIS_CONTENTIEUX' || d.statut === 'A_VALIDER').length})` },
          ].map((tab) => {
            const isSelected = filterStatut === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatut(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: isSelected ? 'var(--color-surface-elevated)' : 'var(--color-surface-muted)',
                  color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dossiers Table */}
      <div
        className="responsive-table-container"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          overflowX: 'auto',
        }}
      >
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
              <th style={{ padding: '12px 16px' }}>Entreprise Contrôlée</th>
              <th style={{ padding: '12px 16px' }}>Référence & Date</th>
              <th style={{ padding: '12px 16px' }}>Inspecteur Coté</th>
              <th style={{ padding: '12px 16px' }}>Actes Procéduraux</th>
              <th style={{ padding: '12px 16px' }}>Statut & Issue</th>
              <th style={{ padding: '12px 16px' }}>Échéance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun dossier ne correspond aux critères sélectionnés.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const dDemandes = demandes[d.id] || [];
                const dFeuilles = feuilles[d.id] || [];
                const dPvs = pvs[d.id] || [];

                return (
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
                    {/* Entreprise: Bold anchor per DESIGN.md */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {d.entiteControlee.nom}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        NIF: {d.entiteControlee.nif} • {d.entiteControlee.typeEntite}
                      </div>
                    </td>

                    {/* Référence: Muted & regular font per DESIGN.md */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {d.reference}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Ouvert le {d.dateCreation}
                      </div>
                    </td>

                    {/* Inspecteur */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {d.responsable}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {d.unite.replace('Direction des Recherches et Enquêtes Douanières', 'DRED')}
                      </div>
                    </td>

                    {/* Actes Procéduraux */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          • {dDemandes.length} Demande(s) de communication
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          • {dFeuilles.length} Feuille(s) d’observation
                        </div>
                      </div>
                    </td>

                    {/* Statut & Issue */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {d.hasPv || dPvs.length > 0
                          ? `PV Dressé (${dPvs[0]?.reference || 'DGDA/PV'})`
                          : d.decisionCloture === 'CLASSE_SANS_SUITE' || d.statut === 'CLOTURE'
                          ? 'Classé sans suite'
                          : d.statut === 'EN_COURS'
                          ? 'En cours'
                          : d.statut === 'A_VALIDER'
                          ? 'À valider'
                          : d.statut.replace('_', ' ')}
                      </span>
                      {(d.hasPv || dPvs.length > 0) && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          ${(d.droitsEludesUSD || dPvs[0]?.droitsEludesUSD || 0).toLocaleString()} USD éludés
                        </div>
                      )}
                    </td>

                    {/* Échéance */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {d.echeance}
                      </div>
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
