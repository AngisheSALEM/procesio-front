import React, { useState } from 'react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  PvDetail,
  RenseignementItem
} from '../types';
import type { DossierTabId } from './DossierHeader';
import {
  mockDossiers,
  mockDemandesParDossier,
  mockFeuillesParDossier,
  mockPvsParDossier,
  mockRenseignements
} from '../data/mockData';
import { SupervisionOverviewTab } from './supervision/SupervisionOverviewTab';
import { SupervisionDossiersView } from './supervision/SupervisionDossiersView';
import { SupervisionDemandesView } from './supervision/SupervisionDemandesView';
import { SupervisionFeuillesView } from './supervision/SupervisionFeuillesView';
import { SupervisionClassementsView } from './supervision/SupervisionClassementsView';
import { SupervisionPvView } from './supervision/SupervisionPvView';
import { SupervisionRenseignementsView } from './supervision/SupervisionRenseignementsView';

export type SupervisionTabId =
  | 'overview'
  | 'dossiers'
  | 'demandes'
  | 'feuilles'
  | 'classements'
  | 'pv'
  | 'renseignements';

interface RapportsStatsViewProps {
  onOpenDossier: (dossierId?: string, tab?: DossierTabId) => void;
  dossiers?: DossierEnquete[];
  demandesParDossier?: Record<string, DemandeCommunication[]>;
  feuillesParDossier?: Record<string, FeuilleObservation[]>;
  pvsParDossier?: Record<string, PvDetail[]>;
  renseignements?: RenseignementItem[];
}

export const RapportsStatsView: React.FC<RapportsStatsViewProps> = ({
  onOpenDossier,
  dossiers = mockDossiers,
  demandesParDossier = {
    'dossier-0842': [mockDemandesParDossier['dossier-0842']],
    'dossier-0843': [mockDemandesParDossier['dossier-0843']],
    'dossier-0844': [mockDemandesParDossier['dossier-0844']],
    'dossier-0845': [mockDemandesParDossier['dossier-0845']],
    'dossier-0846': [mockDemandesParDossier['dossier-0846']],
    'dossier-0847': [mockDemandesParDossier['dossier-0847']],
  },
  feuillesParDossier = {
    'dossier-0842': [mockFeuillesParDossier['dossier-0842']],
    'dossier-0843': [mockFeuillesParDossier['dossier-0843']],
    'dossier-0844': [mockFeuillesParDossier['dossier-0844']],
    'dossier-0845': [mockFeuillesParDossier['dossier-0845']],
    'dossier-0846': [mockFeuillesParDossier['dossier-0846']],
    'dossier-0847': [mockFeuillesParDossier['dossier-0847']],
  },
  pvsParDossier = mockPvsParDossier,
  renseignements = mockRenseignements,
}) => {
  const [activeTab, setActiveTab] = useState<SupervisionTabId>('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Institutional Supervision Top Header */}
      {/* <div
        style={{
          backgroundColor: 'transparent',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      > */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Direction des Recherches & Enquêtes Douanières
            </h2>
            
          </div>
        </div> */}

        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-surface-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-btn)',
              fontSize: '12px',
            }}
          >
            <Calendar size={14} color="var(--color-text-muted)" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="2026-T3">Exercice 2026 — Trimestre 3 (En cours)</option>
              <option value="2026-T2">Exercice 2026 — Trimestre 2</option>
              <option value="2026-T1">Exercice 2026 — Trimestre 1</option>
              <option value="2026-ANNUEL">Exercice 2026 — Année complète</option>
            </select>
          </div>

         
          <button
            onClick={() => {
              alert('Génération du rapport consolidé de supervision au format PDF en cours...');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            <span>Rapport Consolidé PDF</span>
          </button>
        </div> */}
      {/* </div> */}

 

      {/* Active Tab View Rendering */}
      <div key={activeTab} className="view-transition">
        {activeTab === 'overview' && (
          <SupervisionOverviewTab
            onNavigateSubView={(viewId) => setActiveTab(viewId)}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            dossiers={dossiers}
            renseignements={renseignements}
            demandes={demandesParDossier}
            feuilles={feuillesParDossier}
            pvs={pvsParDossier}
          />
        )}

        {activeTab === 'dossiers' && (
          <SupervisionDossiersView
            dossiers={dossiers}
            demandes={demandesParDossier}
            feuilles={feuillesParDossier}
            pvs={pvsParDossier}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'demandes' && (
          <SupervisionDemandesView
            demandes={demandesParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'feuilles' && (
          <SupervisionFeuillesView
            feuilles={feuillesParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'classements' && (
          <SupervisionClassementsView
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'pv' && (
          <SupervisionPvView
            pvs={pvsParDossier}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'renseignements' && (
          <SupervisionRenseignementsView
            renseignements={renseignements}
            dossiers={dossiers}
            onOpenDossier={(dId, tab) => onOpenDossier(dId, tab)}
            onBack={() => setActiveTab('overview')}
          />
        )}
      </div>
    </div>
  );
};

export default RapportsStatsView;
