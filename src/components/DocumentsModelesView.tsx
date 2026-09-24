import React from 'react';
import { Download } from 'lucide-react';

export const DocumentsModelesView: React.FC = () => {
  const modeles = [
    {
      id: 'MOD-01',
      code: 'DGDA-MOD-DC-01',
      titre: 'Modèle de Demande de communication de pièces',
      version: 'v2.1',
      statut: 'APPROUVE',
      dateApplication: '2025-01-15',
      description: 'Courrier type pour transmission aux établissements de crédit et transporteurs maritimes/aériens.',
      format: 'DOCX / PDF'
    },
    {
      id: 'MOD-02',
      code: 'DGDA-MOD-FO-02',
      titre: 'Modèle de Feuille d’observations contradictoires',
      version: 'v1.4',
      statut: 'APPROUVE',
      dateApplication: '2024-11-01',
      description: 'Canevas structuré découpé en constats atomiques O1, O2, O3 avec grille d’appréciation motivée.',
      format: 'DOCX / PDF'
    },
    {
      id: 'MOD-03',
      code: 'DGDA-MOD-PV-OP',
      titre: 'Procès-verbal de constat d’opérations sur pièces',
      version: 'v1.0',
      statut: 'APPROUVE',
      dateApplication: '2024-06-10',
      description: 'PV relatant les constatations matérielles et investigations documentaires régulières.',
      format: 'DOCX / PDF'
    },
    {
      id: 'MOD-04',
      code: 'DGDA-MOD-PV-INF',
      titre: 'Procès-verbal de constatation d’infraction douanière',
      version: 'v3.0-PROVISOIRE',
      statut: 'BROUILLON',
      dateApplication: 'En cours de validation DG',
      description: 'Modèle préparatoire pour qualification contentieuse et transmission vers GELEC.',
      format: 'DOCX'
    },
  ];

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
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Référentiel des Modèles Documentaires et Actes Types
        </h2>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Règle de gestion Procezo : Chaque modèle possède un numéro de version et une date d'application.
          Une mise à jour de modèle ne modifie jamais rétroactivement les courriers et PV déjà émis.
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th style={{ padding: '10px 16px', width: '150px' }}>Code Modèle</th>
              <th style={{ padding: '10px 16px' }}>Intitulé & Périmètre</th>
              <th style={{ padding: '10px 16px', width: '90px' }}>Version</th>
              <th style={{ padding: '10px 16px', width: '130px' }}>Statut</th>
              <th style={{ padding: '10px 16px', width: '160px' }}>Date d'application</th>
              <th style={{ padding: '10px 16px', width: '120px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modeles.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700 }} className="font-mono">
                  {m.code}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.titre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {m.description}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }} className="font-mono">
                  {m.version}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {m.statut === 'APPROUVE' ? (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-success)',
                        fontWeight: 600,
                      }}
                    >
                      Approuvé
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-warning)',
                        fontWeight: 600,
                      }}
                    >
                      Brouillon à valider
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }} className="font-mono">
                  {m.dateApplication}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => alert(`Téléchargement du canevas officiel ${m.code}`)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-accent)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Download size={12} strokeWidth={2} />
                    <span>Télécharger</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
