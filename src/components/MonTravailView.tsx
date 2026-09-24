import React from 'react';
import {
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import type { DossierEnquete } from '../types';

interface MonTravailViewProps {
  onOpenDossier: () => void;
  dossier: DossierEnquete;
}

export const MonTravailView: React.FC<MonTravailViewProps> = ({
  onOpenDossier,
  dossier,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Mon Espace de Travail — Inspecteur Principal Salem Mukendi
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Direction des Recherches et Enquêtes Douanières (DRK) — Portefeuille d’affaires actives
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-warning)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning)',
              }}
            />
            3 actions immédiates à traiter
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Dossiers sous ma responsabilité</div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
            4
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Dont 1 prioritaire (Katanga)
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>Réponses bancaires à examiner</div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            2
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            TMB (Demande DC-042 reçue)
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-info)' }}>Observations en attente de moyens</div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-info)', marginTop: '4px' }}>
            1
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Observation O2 (Justificatif 95k USD)
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>Actes validés cette semaine</div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            3
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Procès-verbal d’opérations certifié
          </div>
        </div>
      </div>

      {/* Priority Actions List */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            Tâches et échéances à traiter en priorité
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Ordre chronologique d’échéance
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Item 1 */}
          <div
            onClick={onOpenDossier}
            className="card-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: 'none',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--color-warning-surface)',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} strokeWidth={2} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>
                    {dossier.reference}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {dossier.entiteControlee.nom}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Examiner les justificatifs bancaires reçus sur la demande DC-042 (relevés SWIFT MT103 vs facture déclarée)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--color-warning)',
                  fontWeight: 600,
                }}
              >
                <Clock size={13} strokeWidth={2} />
                Échéance : 15/10/2026
              </span>
              <button
                className="btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                }}
              >
                <span>Ouvrir</span>
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Item 2 */}
          <div
            onClick={onOpenDossier}
            className="card-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: 'none',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-btn)',
                  backgroundColor: 'var(--color-info-surface)',
                  color: 'var(--color-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={16} strokeWidth={2} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>
                    FO/2026/018
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Préparation de la réunion de clôture contradictoire
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Confrontation des arguments sur l’observation O3 (redevances offshore) avec le conseil de la société
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--color-info)',
                  fontWeight: 600,
                }}
              >
                <Calendar size={13} strokeWidth={2} />
                Fixée au 08/10/2026
              </span>
              <button
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                }}
              >
                Voir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
