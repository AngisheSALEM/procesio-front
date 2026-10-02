import React from 'react';
import {
  Download,
  CheckCircle2
} from 'lucide-react';

import type { DocumentItem } from '../types';

interface DocumentsTabProps {
  documents?: DocumentItem[];
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents: propDocuments }) => {
  const documents = propDocuments ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Documents Table */}
      <div
        className="responsive-table-container"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            Pièces procédurales et documents générés dans ce dossier
          </h3>
        </div>

        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
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
              <th style={{ padding: '10px 16px' }}>Nature & Titre de l'acte</th>
              <th style={{ padding: '10px 16px', width: '180px' }}>Référence</th>
              <th style={{ padding: '10px 16px', width: '90px', textAlign: 'center' }}>Format</th>
              <th style={{ padding: '10px 16px', width: '160px' }}>Validation</th>
              <th style={{ padding: '10px 16px', width: '140px' }}>Signataire</th>
              <th style={{ padding: '10px 16px', width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Aucune pièce enregistrée pour ce dossier.
              </td></tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.titre}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Créé par {doc.auteur} • le <span className="  ">{doc.dateCreation}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }} className="  ">
                  {doc.reference}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span
                    className="  "
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 700,
                    }}
                  >
                    {doc.format}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {doc.type === 'PIECE_JOINTE' ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {doc.statutValidation === 'VALIDE_INTERNE' ? 'Fichier contrôlé' : 'Analyse en attente'}
                    </span>
                  ) : doc.statutValidation === 'SIGNE_OFFICIEL' && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-success)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={13} /> Signé officiel
                    </span>
                  )}
                  {doc.type !== 'PIECE_JOINTE' && doc.statutValidation === 'VALIDE_INTERNE' && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-info)',
                        fontWeight: 600,
                      }}
                    >
                      Validé enquête
                    </span>
                  )}
                  {doc.type !== 'PIECE_JOINTE' && doc.statutValidation === 'BROUILLON' && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Projet / Brouillon
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {doc.type === 'PIECE_JOINTE' ? '—' : doc.signataire || 'Non signé'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    disabled title="Téléchargement indisponible dans ce parcours"
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <Download size={12} strokeWidth={2} />
                    <span>Indisponible</span>
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
