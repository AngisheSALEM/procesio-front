import React from 'react';
import { ArrowRight } from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail,
  RenseignementItem
} from '../../types';
import type { DossierTabId } from '../DossierHeader';

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
  const allDemandesList = Object.values(demandes).flat();
  const allFeuillesList = Object.values(feuilles).flat();
  const allObservationsList = allFeuillesList.flatMap((f) => f.observations || []);
  const allPvsList = Object.values(pvs).flat();

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

  // 6. Gestion du renseignement : savoir qui a été coté & évolution
  const renseignementsCotes = renseignements.filter((r) => Boolean(r.coteA));
  const cotesParInspecteur: Record<string, number> = {};
  renseignements.forEach((r) => {
    if (r.coteA) {
      const name = r.coteA.split('(')[0].trim();
      cotesParInspecteur[name] = (cotesParInspecteur[name] || 0) + 1;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 6 Core Axis Cards - Strictly monochrome text & surfaces */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
         
        </div>

        <div className="kpi-grid-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Card 1: Demande de communication */}
          <div
            onClick={() => onNavigateSubView('demandes')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Demandes de communication
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {totalDemandes}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    réquisitions
                  </span>
                </div>
              
              
              </div>
            </div>


          </div>

          {/* Card 2: Feuille d'observation */}
          <div
            onClick={() => onNavigateSubView('feuilles')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Feuilles d’observation
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {totalFeuilles}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    feuilles ({totalConstats} constats)
                  </span>
                </div>
               
              
              </div>
            </div>

        
          </div>

          {/* Card 3: Classement sans suite */}
          <div
            onClick={() => onNavigateSubView('classements')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Classement sans suite
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {countClassesSansSuite}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    dossiers ({Math.round((countClassesSansSuite / (dossiers.length || 1)) * 100)}% du portefeuille)
                  </span>
                </div>
               
            
              </div>
            </div>

     
          </div>

          {/* Card 4: Dossiers qui ont conduit à 1 PV */}
          <div
            onClick={() => onNavigateSubView('pv')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Dossiers ayant conduit à 1 PV
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {dossiersAvecPv.length}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    dossiers ({allPvsList.length} PV dressés)
                  </span>
                </div>
            
              </div>
            </div>

      
          </div>

          {/* Card 5: Statistiques de renseignement et les effets qu'ils ont produit */}
          <div
            onClick={() => onNavigateSubView('renseignements')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Renseignements & Effets Produits
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {totalRenseignements}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    reçus / {convertisEnEnquetes} en enquêtes
                  </span>
                </div>

              </div>
            </div>

   
          </div>

          {/* Card 6: Gestion de renseignement : savoir qui a été coté & évolution des dossiers */}
          <div
            onClick={() => onNavigateSubView('renseignements')}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'background var(--transition-fast)',
              border: '1px solid var(--color-border-subtle)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>
                    Cotations & Évolution des Dossiers
                  </span>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {renseignementsCotes.length} / {totalRenseignements}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                    cotés aux inspecteurs
                  </span>
                </div>
              
               
              </div>
            </div>

      
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Operational Health Grid */}
     

      {/* Quick Access to Recent Active Files */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-card)', padding: '20px', border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Dossiers Actifs Sous Supervision Directe du Commandement
            </h4>
           
          </div>
          <button
            onClick={() => onNavigateSubView('dossiers')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
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
                <th style={{ padding: '12px 16px' }}>Référence Dossier</th>
                <th style={{ padding: '12px 16px' }}>Opérateur Contrôlé</th>
                <th style={{ padding: '12px 16px' }}>Inspecteur Coté</th>
                <th style={{ padding: '12px 16px' }}>Statut Procédural</th>
                <th style={{ padding: '12px 16px' }}>Issue / PV</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d) => (
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
                  <td style={{ padding: '12px 16px', fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {d.reference}
                  </td>
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
                        PV Dressé (${(d.droitsEludesUSD || 0).toLocaleString()} USD)
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
      </div>
    </div>
  );
};
