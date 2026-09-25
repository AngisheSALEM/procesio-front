import React, { useState, useRef } from 'react';
import {
  Building2,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Users,
  FileText
} from 'lucide-react';
import type { DossierEnquete } from '../types';
import { mockDemandesParDossier, mockFeuillesParDossier } from '../data/mockData';
import { useCleanUI } from '../hooks/useCleanUI';

interface VueEnsembleTabProps {
  dossier: DossierEnquete;
  onGoToDemandes: () => void;
  onGoToObservations: () => void;
}

export const VueEnsembleTab: React.FC<VueEnsembleTabProps> = ({
  dossier,
  onGoToDemandes,
  onGoToObservations,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useCleanUI('VueEnsembleTab', containerRef);

  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    entite: true,
    operations: true,
    equipe: true,
    renseignements: true,
    actes: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const demande = mockDemandesParDossier[dossier.id];
  const feuille = mockFeuillesParDossier[dossier.id];

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Opérateur & Opérations SYDONIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        
        {/* Section Collapsible: Opérateur */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => toggleSection('entite')}
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: 'var(--color-surface)',
              borderBottom: openSections.entite ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Opérateur économique contrôlé
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-sf" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)' }}>
                {dossier.entiteControlee.nif}
              </span>
              {openSections.entite ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {openSections.entite && (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {dossier.entiteControlee.nom}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>NIF</span>
                  <span className="font-sf" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>
                    {dossier.entiteControlee.nif}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>RCCM</span>
                  <span className="font-sf" style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                    {dossier.entiteControlee.rccm}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Adresse & Contact</span>
                <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {dossier.entiteControlee.adresse}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {dossier.entiteControlee.contact}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <span>Rôle : <strong>{dossier.entiteControlee.roleDansDossier}</strong></span>
                <span>•</span>
                <span>Type : <strong>{dossier.entiteControlee.typeEntite}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Section Collapsible: Opérations douanières SYDONIA */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => toggleSection('operations')}
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: 'var(--color-surface)',
              borderBottom: openSections.operations ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Déclarations douanières ({dossier.operationsDouanieres.length})
              </h3>
            </div>
            {openSections.operations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {openSections.operations && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                      textAlign: 'left',
                      fontSize: '11px',
                    }}
                  >
                    <th style={{ padding: '8px 12px' }}>Réf. Déclaration</th>
                    <th style={{ padding: '8px 12px' }}>Bureau / Date</th>
                    <th style={{ padding: '8px 12px' }}>Régime</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Valeur CAF</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.operationsDouanieres.map((op) => (
                    <tr
                      key={op.referenceSydonia}
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }} className="font-sf">
                        {op.referenceSydonia}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ color: 'var(--color-text-primary)' }}>{op.bureau}</div>
                        <div className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {op.dateDeclaration}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                        {op.regime}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }} className="font-sf">
                        {op.valeurDeclareeUSD.toLocaleString()} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 2. Equipe d'enquête & Renseignements liés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        
        {/* Section Collapsible: Equipe */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => toggleSection('equipe')}
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: 'var(--color-surface)',
              borderBottom: openSections.equipe ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Équipe d'enquête ({dossier.equipe.length})
              </h3>
            </div>
            {openSections.equipe ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {openSections.equipe && (
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dossier.equipe.map((agent, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: i === 0 ? 'var(--color-accent)' : 'var(--color-info)',
                    }}
                  />
                  <span>{agent}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Collapsible: Renseignements */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => toggleSection('renseignements')}
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              backgroundColor: 'var(--color-surface)',
              borderBottom: openSections.renseignements ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Renseignements rattachés ({dossier.renseignementsLiesIds.length})
              </h3>
            </div>
            {openSections.renseignements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {openSections.renseignements && (
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dossier.renseignementsLiesIds.map((rId) => (
                <div
                  key={rId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span className="font-sf" style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                    {rId}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Exploité en ouverture
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Section Collapsible: Actes de procédure rattachés */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => toggleSection('actes')}
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            backgroundColor: 'var(--color-surface)',
            borderBottom: openSections.actes ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--color-accent)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Actes de procédure rattachés
            </h3>
          </div>
          {openSections.actes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {openSections.actes && (
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div
              onClick={onGoToDemandes}
              className="card-interactive"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-accent)' }}>
                  Demandes de communication
                </strong>
                <ExternalLink size={14} color="var(--color-accent)" />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {demande
                  ? `${demande.reference} • ${demande.destinataire.nom}`
                  : 'Aucune demande active'}
              </div>
            </div>

            <div
              onClick={onGoToObservations}
              className="card-interactive"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-accent)' }}>
                  Feuille d’observation contradictoire
                </strong>
                <ExternalLink size={14} color="var(--color-accent)" />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {feuille
                  ? `${feuille.reference} • ${feuille.observations.length} constats • ${feuille.statutFeuille}`
                  : 'Aucune feuille rédigée'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
