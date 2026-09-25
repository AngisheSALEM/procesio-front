import React from 'react';
import {
  Building2,
  ExternalLink,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import type { DossierEnquete } from '../types';
import { mockDemandesParDossier, mockFeuillesParDossier } from '../data/mockData';

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 2-Column Top Section: Target Entity & Customs Declarations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '16px' }}>
        {/* Entity Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '18px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={15} strokeWidth={1.8} />
            <span>Fiche de l'opérateur économique contrôlé</span>
          </div>

          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {dossier.entiteControlee.nom}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Identifiant NIF</div>
              <div className="  " style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' }}>
                {dossier.entiteControlee.nif}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Registre de Commerce (RCCM)</div>
              <div className="  " style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                {dossier.entiteControlee.rccm}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Adresse d'exploitation</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {dossier.entiteControlee.adresse}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Contact légal : {dossier.entiteControlee.contact}
            </div>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <span>Rôle : <strong>{dossier.entiteControlee.roleDansDossier}</strong></span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span>Forme : <strong>{dossier.entiteControlee.typeEntite}</strong></span>
          </div>
        </div>

        {/* Customs Operations SYDONIA Table */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '18px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={15} strokeWidth={1.8} />
              <span>Opérations douanières SYDONIA rattachées</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Source : SydoniaWorld DGDA
            </span>
          </div>

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
                <th style={{ padding: '6px 8px' }}>Réf. Déclaration</th>
                <th style={{ padding: '6px 8px' }}>Bureau / Date</th>
                <th style={{ padding: '6px 8px' }}>Régime</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valeur CAF (USD)</th>
              </tr>
            </thead>
            <tbody>
              {dossier.operationsDouanieres.map((op) => (
                <tr
                  key={op.referenceSydonia}
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 600 }} className="  ">
                    {op.referenceSydonia}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ color: 'var(--color-text-primary)' }}>{op.bureau}</div>
                    <div className="  " style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {op.dateDeclaration}
                    </div>
                  </td>
                  <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                    {op.regime}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }} className="  ">
                    {op.valeurDeclareeUSD.toLocaleString()} $
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Team & Linked Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Equipe chargée du dossier */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
            Composition de l'équipe d'enquête
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dossier.equipe.map((agent, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  border: 'none',
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
        </div>

        {/* Renseignements initiaux liés */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
            Renseignements initiaux rattachés (Traçabilité)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dossier.renseignementsLiesIds.map((rId) => (
              <div
                key={rId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color="var(--color-accent)" />
                  <span className="  " style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {rId}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Exploité en ouverture d'enquête
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      {(() => {
        const demande = mockDemandesParDossier[dossier.id];
        const feuille = mockFeuillesParDossier[dossier.id];
        const piecesCount = demande ? demande.elementsDemandes.length : 0;
        const manquantesCount = demande
          ? demande.elementsDemandes.filter((e) => e.statutRemise === 'MANQUANT' || e.statutRemise === 'EN_ATTENTE').length
          : 0;
        const constatsCount = feuille ? feuille.observations.length : 0;

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div
              onClick={onGoToDemandes}
              className="card-interactive"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}>
                  Demandes de communication  
                </div>
                <ExternalLink size={15} color="var(--color-accent)" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {demande
                  ? `${demande.reference} • Destinataire : ${demande.destinataire.nom} • ${piecesCount} pièces requises (${manquantesCount} en attente)`
                  : 'Aucune demande active émise'}
              </div>
            </div>

            <div
              onClick={onGoToObservations}
              className="card-interactive"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)' }}>
                  Feuille d’observation contradictoire
                </div>
                <ExternalLink size={15} color="var(--color-accent)" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {feuille
                  ? `${feuille.reference} • ${constatsCount} constat${constatsCount > 1 ? 's' : ''} formulé${constatsCount > 1 ? 's' : ''} (${feuille.observations.map(o => o.code).join(', ')}) • Statut : ${feuille.statutFeuille}`
                  : 'Aucune feuille d’observation rédigée'}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
