import React, { useState } from 'react';
import { History } from 'lucide-react';
import type { AuditLogEntry } from '../types';

interface HistoriqueTabProps {
  logs?: AuditLogEntry[];
}

export const HistoriqueTab: React.FC<HistoriqueTabProps> = ({ logs: propLogs }) => {
  const defaultLogs: AuditLogEntry[] = [
    {
      id: 'LOG-006',
      date: '2026-09-18',
      heure: '15:42',
      auteur: 'Insp. Principal Salem Mukendi',
      action: 'Enregistrement des moyens de défense et appréciation O3',
      details: 'Contestation de l’assujetti examinée. Constat O3 maintenu avec proposition de qualification d’infraction.',
      categorie: 'PROCEDURE',
    },
    {
      id: 'LOG-005',
      date: '2026-09-10',
      heure: '11:15',
      auteur: 'Insp. Adjoint Mireille Kabamba',
      action: 'Examen de la défense sur l’observation O1 (Fret)',
      details: 'Note de débit Maersk authentifiée. Point O1 clos et régularisé (redressement 4 182 USD).',
      categorie: 'PROCEDURE',
    },
    {
      id: 'LOG-004',
      date: '2026-09-02',
      heure: '09:30',
      auteur: 'Greffe DRK / Insp. Salem Mukendi',
      action: 'Enregistrement réponse partielle TMB réf. 789',
      details: 'Messages SWIFT MT103 reçus (580 000 USD). Contrats de Credoc manquants signalés.',
      categorie: 'DOCUMENT',
    },
    {
      id: 'LOG-003',
      date: '2026-08-28',
      heure: '14:00',
      auteur: 'Insp. Principal Salem Mukendi',
      action: 'Émission de la feuille d’observations contradictoires FO/2026/018',
      details: 'Notification des 3 chefs de redressement (O1, O2, O3) selon la procédure contradictoire.',
      categorie: 'PROCEDURE',
    },
    {
      id: 'LOG-002',
      date: '2026-08-20',
      heure: '16:20',
      auteur: 'Jean-Paul Tshilombo (Directeur Provincial)',
      action: 'Signature et émission de la Demande de communication DC/2026/042',
      details: 'Signé par autorité de commandement à destination de la banque TMB.',
      categorie: 'DECISION',
    },
    {
      id: 'LOG-001',
      date: '2026-08-12',
      heure: '10:00',
      auteur: 'Albert Mwamba (Chef de Division Enquêtes)',
      action: 'Ouverture du dossier et affectation à Salem Mukendi',
      details: 'Rapprochement automatisé SYDONIA suite aux renseignements RN-2026-0312 et RN-2026-0419.',
      categorie: 'PROCEDURE',
    },
  ];

  const [logs] = useState<AuditLogEntry[]>(propLogs || defaultLogs);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: 'none',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            Journal d’audit et chaîne de traçabilité procédurale
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Enregistrement inaltérable des actions, consultations et décisions selon les normes DGDA
          </div>
        </div>
        <span className="  " style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {logs.length} événements consignés
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: 'none',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                flexShrink: 0,
              }}
            >
              <History size={16} strokeWidth={1.8} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {log.action}
                </div>
                <div className="  " style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {log.date} à {log.heure}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {log.details}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Auteur : <strong>{log.auteur}</strong>
                </span>
                <span style={{ color: 'var(--color-border)' }}>•</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Catégorie : {log.categorie}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
