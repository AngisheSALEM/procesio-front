import React from 'react';
import {
  Calendar,
  Layers,
  Send,
  Scale,
  FolderOpen,
  Clock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import type { DossierEnquete } from '../types';

export type DossierTabId =
  | 'vue-ensemble'
  | 'taches'
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
      label: `Tâches (${dossier.taches?.filter((t) => t.statut !== 'TERMINEE').length ?? dossier.taches?.length ?? 0})`,
      icon: <CheckCircle2 size={14} strokeWidth={1.8} />,
    },
    {
      id: 'actions-echanges' as DossierTabId,
      label: 'Demande de communication',
      icon: <Send size={14} strokeWidth={1.8} />,
    },
    {
      id: 'constats-defense' as DossierTabId,
      label: 'Feuille d’observation',
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
        border: '1px solid var(--color-border)',
        paddingTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {/* Top Row: Back button, Title, Open Date and Due Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
              title="Retour aux dossiers"
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
          )}

          <h1
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {dossier.objet}
          </h1>
        </div>

        {/* Date d'ouverture et date d'échéance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <Clock size={13} color="var(--color-accent)" />
            <span>Ouvert le : <strong style={{ color: 'var(--color-text-secondary)' }}>{dossier.horodatageCreation || dossier.dateCreation}</strong></span>
          </div>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <Calendar size={13} color="var(--color-danger)" />
            <span>Échéance : <strong style={{ color: 'var(--color-text-secondary)' }}>{dossier.echeance}</strong></span>
          </div>
        </div>
      </div>

      {/* Ergonomic Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          maxWidth: '100%',
          scrollbarWidth: 'none',
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
              {/* <span
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {tab.icon}
              </span> */}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
