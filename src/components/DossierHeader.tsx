import React from 'react';
import {
  Calendar,
  Layers,
  Send,
  Scale,
  FolderOpen,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { DossierEnquete } from '../types';

export type DossierTabId =
  | 'vue-ensemble'
  | 'taches'
  | 'alertes'
  | 'echeances'
  | 'actions-echanges'
  | 'constats-defense'
  | 'documents';

interface DossierHeaderProps {
  dossier: DossierEnquete;
  activeTab: DossierTabId;
  onSelectTab: (tab: DossierTabId) => void;
  onBack?: () => void;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({
  dossier,
  activeTab,
  onSelectTab,
  onBack,
}) => {
  const tabs = [
    {
      id: 'vue-ensemble' as DossierTabId,
      label: 'Informations',
      icon: <Layers size={14} strokeWidth={1.8} />,
    },
    {
      id: 'taches' as DossierTabId,
      label: `Tâches (${dossier.taches?.length || 0})`,
      icon: <CheckCircle2 size={14} strokeWidth={1.8} />,
    },
    {
      id: 'alertes' as DossierTabId,
      label: `Alertes (${dossier.alertes?.length || 0})`,
      icon: <AlertTriangle size={14} strokeWidth={1.8} />,
    },
    {
      id: 'echeances' as DossierTabId,
      label: `Échéances (${dossier.echeances?.length || 0})`,
      icon: <Calendar size={14} strokeWidth={1.8} />,
    },
    {
      id: 'actions-echanges' as DossierTabId,
      label: 'Demandes ',
      icon: <Send size={14} strokeWidth={1.8} />,
    },
    {
      id: 'constats-defense' as DossierTabId,
      label: 'Constats d’observation',
      icon: <Scale size={14} strokeWidth={1.8} />,
    },
    {
      id: 'documents' as DossierTabId,
      label: 'Documents & PV',
      icon: <FolderOpen size={14} strokeWidth={1.8} />,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        paddingTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Top Metadata Row: Reference, Priority, Status, Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >

        {/* Main Dossier Title */}
          <h1
          style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1.35,
          marginBottom: '8px',
        }}
          >
        {dossier.objet}
          </h1>         
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '4px',
                transition: 'all var(--transition-fast)',
              }}
              title="Retourner à l’espace de travail"
            >
              <ArrowLeft size={13} strokeWidth={2} />
              
            </button>
          )}


      
          <span
            className="  "
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-accent)',
              letterSpacing: '0.4px',
            }}
          >
            {dossier.reference}
          </span>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {dossier.unite}
          </span>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <span style={{ fontSize: '10px', color: 'var(--color-warning)', fontWeight: 600 }}>
            Priorité {dossier.priorite}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            <Clock size={12} color="var(--color-accent)" />
            <span>Ouvert le : <strong className="" style={{ color: 'var(--color-text-secondary)' }}>{dossier.horodatageCreation || dossier.dateCreation}</strong></span>
          </div>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            <Calendar size={12} />
            <span>Échéance : <strong className="" style={{ color: 'var(--color-text-secondary)' }}>{dossier.echeance}</strong></span>
          </div>
        </div>
      </div>



      {/* Sleek Subtitle Strip (Target entity, Responsible, Next action) */}
     <br />

      {/* Ergonomic Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: isActive ? 'var(--color-bg)' : 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
