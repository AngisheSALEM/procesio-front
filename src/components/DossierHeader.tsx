import React from 'react';
import {
  Building2,
  Calendar,
  Layers,
  Send,
  Scale,
  FolderOpen,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';
import type { DossierEnquete } from '../types';

export type DossierTabId =
  | 'vue-ensemble'
  | 'actions-echanges'
  | 'constats-defense'
  | 'documents'
  | 'historique';

interface DossierHeaderProps {
  dossier: DossierEnquete;
  activeTab: DossierTabId;
  onSelectTab: (tab: DossierTabId) => void;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({
  dossier,
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    {
      id: 'vue-ensemble' as DossierTabId,
      label: 'Vue d’ensemble',
      icon: <Layers size={15} strokeWidth={1.8} />,
    },
    {
      id: 'actions-echanges' as DossierTabId,
      label: 'Demandes & Échanges',
      icon: <Send size={15} strokeWidth={1.8} />,
    },
    {
      id: 'constats-defense' as DossierTabId,
      label: 'Constats d’observation',
      icon: <Scale size={15} strokeWidth={1.8} />,
    },
    {
      id: 'documents' as DossierTabId,
      label: 'Documents & PV',
      icon: <FolderOpen size={15} strokeWidth={1.8} />,
    },
    {
      id: 'historique' as DossierTabId,
      label: 'Historique & Traçabilité',
      icon: <History size={15} strokeWidth={1.8} />,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-accent)',
              letterSpacing: '0.4px',
            }}
          >
            {dossier.reference}
          </span>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {dossier.unite}
          </span>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <span style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: 600 }}>
            Priorité {dossier.priorite}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>
            <Clock size={14} />
            <span>En cours d'investigation</span>
          </div>
          <span style={{ color: 'var(--color-border-subtle)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <Calendar size={13} />
            <span>Échéance : <strong className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{dossier.echeance}</strong></span>
          </div>
        </div>
      </div>

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

      {/* Sleek Subtitle Strip (Target entity, Responsible, Next action) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-bg)',
          marginBottom: '14px',
          fontSize: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
          <Building2 size={14} color="var(--color-accent)" />
          <span>Opérateur : <strong>{dossier.entiteControlee.nom}</strong></span>
          <span className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            ({dossier.entiteControlee.nif})
          </span>
        </div>

        <span style={{ color: 'var(--color-border)' }}>|</span>

        <div style={{ color: 'var(--color-text-secondary)' }}>
          Chef de mission : <strong>{dossier.responsable}</strong>
        </div>

        <span style={{ color: 'var(--color-border)' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', flex: 1, minWidth: '220px' }}>
          <ArrowRight size={13} color="var(--color-accent)" />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Action : <span style={{ color: 'var(--color-text-primary)' }}>{dossier.prochaineAction}</span>
          </span>
        </div>
      </div>

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
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
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
