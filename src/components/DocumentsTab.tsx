import React, { useState } from 'react';
import {
  Download,
  Send,
  CheckCircle2
} from 'lucide-react';

interface DocumentItem {
  id: string;
  reference: string;
  titre: string;
  type: 'PV_OPERATIONS' | 'PV_INFRACTION' | 'DEMANDE_COMMUNICATION' | 'FEUILLE_OBSERVATION' | 'BORDEREAU_GELEC';
  format: 'PDF' | 'DOCX' | 'SCAN_SIGNE' | 'XLSX';
  statutValidation: 'BROUILLON' | 'VALIDE_INTERNE' | 'SIGNE_OFFICIEL' | 'TRANSMIS';
  dateCreation: string;
  auteur: string;
  signataire?: string;
  relaisGelec: boolean;
}

export const DocumentsTab: React.FC = () => {
  const [documents] = useState<DocumentItem[]>([
    {
      id: 'DOC-01',
      reference: 'DGDA/DRK/FO/2026/018',
      titre: 'Feuille d’observation contradictoire provisoire (O1, O2, O3)',
      type: 'FEUILLE_OBSERVATION',
      format: 'PDF',
      statutValidation: 'VALIDE_INTERNE',
      dateCreation: '2026-08-28',
      auteur: 'Insp. Principal Salem Mukendi',
      signataire: 'Inspecteur Principal Salem Mukendi',
      relaisGelec: true,
    },
    {
      id: 'DOC-02',
      reference: 'DGDA/DRK/ENQ/DC/2026/042',
      titre: 'Demande de communication de pièces bancaires',
      type: 'DEMANDE_COMMUNICATION',
      format: 'SCAN_SIGNE',
      statutValidation: 'SIGNE_OFFICIEL',
      dateCreation: '2026-08-20',
      auteur: 'Insp. Principal Salem Mukendi',
      signataire: 'Jean-Paul Tshilombo (Directeur Provincial)',
      relaisGelec: true,
    },
    {
      id: 'DOC-03',
      reference: 'DGDA/DRK/PV-OP/2026/091',
      titre: 'Procès-verbal de constat d’opérations sur pièces',
      type: 'PV_OPERATIONS',
      format: 'PDF',
      statutValidation: 'VALIDE_INTERNE',
      dateCreation: '2026-09-05',
      auteur: 'Insp. Adjoint Mireille Kabamba',
      signataire: 'Mireille Kabamba & Salem Mukendi',
      relaisGelec: true,
    },
    {
      id: 'DOC-04',
      reference: 'DGDA/DRK/PROJET-PV-INF/2026/014',
      titre: 'Projet de Procès-verbal d’infraction douanière',
      type: 'PV_INFRACTION',
      format: 'DOCX',
      statutValidation: 'BROUILLON',
      dateCreation: '2026-09-20',
      auteur: 'Insp. Principal Salem Mukendi',
      relaisGelec: true,
    },
    {
      id: 'DOC-05',
      reference: 'DGDA/DRK/TAB-STAT/2026/008',
      titre: 'Bordereau chiffré des droits compromis et pénalités calculées',
      type: 'BORDEREAU_GELEC',
      format: 'XLSX',
      statutValidation: 'VALIDE_INTERNE',
      dateCreation: '2026-09-22',
      auteur: 'Contrôleur Éric Tshimanga',
      relaisGelec: true,
    },
  ]);

  const [relaisStatut, setRelaisStatut] = useState<'NON_TRANSMIS' | 'PROPOSE' | 'TRANSMIS' | 'RECEPTIONNE'>('PROPOSE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Relais Contentieux GELEC Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Préparation du bordereau de transmission vers GELEC
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Transfert tracé vers la Direction du Contentieux Douanier (GELEC)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '12px',
                color:
                  relaisStatut === 'PROPOSE'
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
                fontWeight: 600,
              }}
            >
              Statut : {relaisStatut === 'PROPOSE' ? 'Proposé pour transmission' : 'Transmis et consigné'}
            </span>

            <button
              onClick={() => {
                setRelaisStatut('TRANSMIS');
                alert('Bordereau de transmission GELEC généré et horodaté sous référence TR-GELEC-2026-0842.');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <Send size={13} strokeWidth={2} />
              <span>Générer le bordereau GELEC</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          Le paquet de transmission vers GELEC inclut le rapport de synthèse de l'enquête, la copie certifiée de la feuille
          d'observation n° FO/2026/018, les constats maintenus sur l'observation O3 (redevances non déclarées), et les
          pièces probantes (extraits SWIFT et contrats de licence). Les sources protégées et renseignements d'aviseurs
          sont automatiquement filtrés du dossier de transmission.
        </div>
      </div>

      {/* Documents Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            Pièces procédurales et documents générés dans ce dossier
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
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
            {documents.map((doc) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.titre}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Créé par {doc.auteur} • le <span className="font-mono">{doc.dateCreation}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }} className="font-mono">
                  {doc.reference}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span
                    className="font-mono"
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
                  {doc.statutValidation === 'SIGNE_OFFICIEL' && (
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
                  {doc.statutValidation === 'VALIDE_INTERNE' && (
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
                  {doc.statutValidation === 'BROUILLON' && (
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
                  {doc.signataire || 'Non signé'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => alert(`Téléchargement de ${doc.reference}`)}
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
                    <span>Consulter</span>
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
