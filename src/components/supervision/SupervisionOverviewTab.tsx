import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail,
  RenseignementItem
} from '../../types';
import type { DossierTabId } from '../DossierHeader';
import { ProgressionRenseignementsPvChart } from './ProgressionRenseignementsPvChart';

interface SupervisionOverviewTabProps {
  onNavigateSubView: (tab: 'dossiers' | 'demandes' | 'feuilles' | 'classements' | 'pv' | 'renseignements') => void;
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  dossiers: DossierEnquete[];
  renseignements: RenseignementItem[];
  demandes: Record<string, DemandeCommunication[]>;
  feuilles: Record<string, FeuilleObservation[]>;
  pvs: Record<string, PvDetail[]>;
}

export const SupervisionOverviewTab: React.FC<SupervisionOverviewTabProps> = ({
  onNavigateSubView,
  onOpenDossier,
  dossiers,
  renseignements,
  demandes,
  feuilles,
  pvs,
}) => {
  // Aggregate KPIs dynamically
  const allDemandesList = useMemo(() => Object.values(demandes).flat(), [demandes]);
  const allFeuillesList = useMemo(() => Object.values(feuilles).flat(), [feuilles]);
  const allObservationsList = useMemo(() => allFeuillesList.flatMap((f) => f.observations || []), [allFeuillesList]);
  const allPvsList = useMemo(() => Object.values(pvs).flat(), [pvs]);

  // 1. Demandes de communication
  const totalDemandes = allDemandesList.length;

  // 2. Feuilles d'observation
  const totalFeuilles = allFeuillesList.length;
  const totalConstats = allObservationsList.length;

  // 3. Classement sans suite
  const dossiersClasses = dossiers.filter((d) => d.statut === 'CLOTURE' || d.decisionCloture === 'CLASSE_SANS_SUITE');
  const countClassesSansSuite = dossiersClasses.length;

  // 4. Dossiers qui ont conduit à 1 ou plusieurs PV
  const dossiersAvecPv = dossiers.filter((d) => d.hasPv || (pvs[d.id] && pvs[d.id].length > 0));

  // 5. Statistiques de renseignement & effets produits
  const totalRenseignements = renseignements.length;
  const convertisEnEnquetes = renseignements.filter((r) => r.effetProduit === 'ENQUETE_OUVERTE_AVEC_PV' || r.effetProduit === 'ENQUETE_EN_COURS').length;

  // 4 derniers dossiers
  const recentDossiers = useMemo(() => {
    return [...dossiers]
      .sort((a, b) => (b.horodatageCreation || b.dateCreation || '').localeCompare(a.horodatageCreation || a.dateCreation || ''))
      .slice(0, 4);
  }, [dossiers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Section KPI : Disposition type Dashboard moderne (1 Grande carte à gauche + 3 Cartes empilées à droite) */}
      <div className="supervision-kpi-layout">
        {/* Grande Carte Principale : Renseignements */}
        <div
          onClick={() => onNavigateSubView('renseignements')}
          className="card-interactive"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--color-border-subtle)',
            transition: 'background var(--transition-fast)',
            minHeight: '260px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Renseignements
              </span>
              <ArrowRight size={14} color="var(--color-text-muted)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {totalRenseignements}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                  {convertisEnEnquetes} convertis en enquêtes ({Math.round((convertisEnEnquetes / (totalRenseignements || 1)) * 100)}%)
                </div>
              </div>

              {/* Sparkline discrète fidèle à la maquette */}
              <div style={{ width: '130px', height: '36px', opacity: 0.85 }}>
                <svg width="100%" height="100%" viewBox="0 0 130 36" fill="none">
                  <path
                    d="M 2 28 Q 20 20, 35 24 T 70 14 T 100 18 T 124 6"
                    fill="none"
                    stroke="var(--color-text-secondary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="124" cy="6" r="3" fill="var(--color-text-primary)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Section inférieure discrète avec sous-métriques (dont classement sans suite) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)',
              marginTop: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Enquêtes ouvertes
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {convertisEnEnquetes}
              </div>
            </div>

            {/* Classements sans suite intégrés discrètement */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Classés sans suite
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {countClassesSansSuite}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                  dossiers
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                En qualification
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {Math.max(0, totalRenseignements - convertisEnEnquetes)}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Cartes empilées à droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
          {/* Carte 1 : Demandes de communication */}
          <div
            onClick={() => onNavigateSubView('demandes')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
              flex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Demandes de communication
              </span>
              <ArrowRight size={14} color="var(--color-text-muted)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {totalDemandes}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                réquisitions émises
              </div>
            </div>
          </div>

          {/* Carte 2 : Feuilles d’observation */}
          <div
            onClick={() => onNavigateSubView('feuilles')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
              flex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Feuilles d’observation
              </span>
              <ArrowRight size={14} color="var(--color-text-muted)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {totalFeuilles}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {totalConstats} constats rédigés
              </div>
            </div>
          </div>

          {/* Carte 3 : Dossiers ayant conduit à 1 PV */}
          <div
            onClick={() => onNavigateSubView('pv')}
            className="card-interactive"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
              flex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                Dossiers ayant conduit à un PV
              </span>
              <ArrowRight size={14} color="var(--color-text-muted)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {dossiersAvecPv.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {allPvsList.length} PV dressés
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique statistique : Évolution des actes procéduraux */}
      <ProgressionRenseignementsPvChart
        renseignements={renseignements}
        dossiers={dossiers}
        pvs={pvs}
        demandes={demandes}
        feuilles={feuilles}
      />

      {/* Tableau des 4 derniers dossiers sous supervision */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Dossiers Récents Sous Supervision
            </h4>

          </div>
          <button
            type="button"
            onClick={() => onNavigateSubView('dossiers')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-btn)',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Voir tous les dossiers ({dossiers.length}) →
          </button>
        </div>

        <div className="responsive-table-container" style={{ overflowX: 'auto' }}>
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
                
                <th style={{ padding: '12px 16px' }}>Opérateur Contrôlé</th>
                <th style={{ padding: '12px 16px' }}>Inspecteur Coté</th>
                <th style={{ padding: '12px 16px' }}>Statut Procédural</th>
                <th style={{ padding: '12px 16px' }}>Issue / PV</th>
              </tr>
            </thead>
            <tbody>
              {recentDossiers.map((d) => (
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
                  
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    {d.entiteControlee.nom}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {d.responsable}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {d.decisionCloture === 'CLASSE_SANS_SUITE'
                        ? 'Classé sans suite'
                        : d.statut === 'EN_COURS'
                        ? 'En cours'
                        : d.statut === 'A_VALIDER'
                        ? 'À valider'
                        : d.statut.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {d.hasPv ? (
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        PV Dressé 
                      </span>
                    ) : d.decisionCloture === 'CLASSE_SANS_SUITE' ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Classé sans suite
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>En instruction</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau discret */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <span></span>
          <button
            type="button"
            onClick={() => onNavigateSubView('dossiers')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Afficher la liste complète ({dossiers.length})
          </button>
        </div>
      </div>
    </div>
  );
};
