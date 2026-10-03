import React, { useState, useRef } from 'react';
import {
  Download,
  Send,
  CheckCircle2,
  Eye,
  Upload,
  AlertCircle
} from 'lucide-react';
import { PdfPreviewModal } from './common/PdfPreviewModal';
import { uploadFile, type ApiDocument } from '../api/client';

export interface DocumentItem {
  id: string;
  reference: string;
  titre: string;
  type: 'PV_OPERATIONS' | 'PV_INFRACTION' | 'DEMANDE_COMMUNICATION' | 'FEUILLE_OBSERVATION' | 'BORDEREAU_GELEC' | 'PIECE_JOINTE';
  format: 'PDF' | 'DOCX' | 'SCAN_SIGNE' | 'XLSX' | 'PNG' | 'JPEG';
  statutValidation: 'BROUILLON' | 'VALIDE_INTERNE' | 'SIGNE_OFFICIEL' | 'TRANSMIS';
  dateCreation: string;
  auteur: string;
  signataire?: string;
  relaisGelec: boolean;
  scanState?: string;
  fileUrl?: string;
  rawFile?: File;
}

interface DocumentsTabProps {
  documents?: DocumentItem[];
  caseId?: string;
  apiDocuments?: ApiDocument[];
  onRefresh?: () => Promise<unknown>;
  canWrite?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents: propDocuments,
  caseId,
  apiDocuments,
  onRefresh,
  canWrite = true,
}) => {
  const defaultDocs: DocumentItem[] = [
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
      scanState: 'accepted',
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
      scanState: 'accepted',
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
      scanState: 'accepted',
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
      scanState: 'accepted',
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
      scanState: 'accepted',
    },
  ];

  // Si des documents API sont fournis, on les convertit en DocumentItem pour harmoniser la vue
  const convertedApiDocs: DocumentItem[] = (apiDocuments || []).map((ad) => ({
    id: ad.id,
    reference: ad.id.slice(0, 8).toUpperCase(),
    titre: ad.original_name,
    type: 'PIECE_JOINTE',
    format: ad.content_type.includes('pdf')
      ? 'PDF'
      : ad.content_type.includes('png')
      ? 'PNG'
      : ad.content_type.includes('jpeg') || ad.content_type.includes('jpg')
      ? 'JPEG'
      : 'PDF',
    statutValidation: ad.state === 'accepted' ? 'SIGNE_OFFICIEL' : 'BROUILLON',
    dateCreation: new Date(ad.uploaded_at).toLocaleDateString('fr-FR'),
    auteur: 'Système / Dépositaire',
    signataire: ad.state === 'accepted' ? 'Validé antivirus' : 'En quarantaine',
    relaisGelec: false,
    scanState: ad.state,
    fileUrl: `/api/v1/documents/${ad.id}/telecharger/`,
  }));

  const initialList = propDocuments && propDocuments.length > 0
    ? propDocuments
    : convertedApiDocs.length > 0
    ? convertedApiDocs
    : defaultDocs;

  const [documents, setDocuments] = useState<DocumentItem[]>(initialList);
  const [relaisStatut, setRelaisStatut] = useState<'NON_TRANSMIS' | 'PROPOSE' | 'TRANSMIS' | 'RECEPTIONNE'>('PROPOSE');

  // État de la prévisualisation PDF
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // État de dépôt de fichier
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleOpenPdf = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadBusy(true);
    setStatusMessage(null);

    try {
      if (caseId) {
        // Envoi au backend Django si un caseId est présent
        const uploaded = await uploadFile(file, { case: caseId });
        const newDocItem: DocumentItem = {
          id: uploaded.id,
          reference: uploaded.id.slice(0, 8).toUpperCase(),
          titre: uploaded.original_name,
          type: 'PIECE_JOINTE',
          format: 'PDF',
          statutValidation: uploaded.state === 'accepted' ? 'VALIDE_INTERNE' : 'BROUILLON',
          dateCreation: new Date().toLocaleDateString('fr-FR'),
          auteur: 'Agent instructeur',
          signataire: uploaded.state === 'accepted' ? 'Antivirus OK' : 'En cours d’analyse',
          relaisGelec: false,
          scanState: uploaded.state,
          fileUrl: `/api/v1/documents/${uploaded.id}/telecharger/`,
          rawFile: file,
        };
        setDocuments((prev) => [newDocItem, ...prev]);
        if (onRefresh) await onRefresh();
        setStatusMessage({ text: `Document « ${file.name} » déposé avec succès.`, type: 'success' });
      } else {
        // Mode autonome
        const localDocItem: DocumentItem = {
          id: `DOC-${Date.now()}`,
          reference: `DGDA/PIECE/${Date.now().toString().slice(-4)}`,
          titre: file.name,
          type: 'PIECE_JOINTE',
          format: 'PDF',
          statutValidation: 'VALIDE_INTERNE',
          dateCreation: new Date().toLocaleDateString('fr-FR'),
          auteur: 'Agent instructeur',
          signataire: 'Inspecteur en charge',
          relaisGelec: false,
          scanState: 'accepted',
          rawFile: file,
        };
        setDocuments((prev) => [localDocItem, ...prev]);
        setStatusMessage({ text: `Pièce justificative « ${file.name} » ajoutée au dossier.`, type: 'success' });
      }
    } catch (err) {
      console.error('[DocumentsTab] Erreur upload:', err);
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Échec du dépôt de document.',
        type: 'error',
      });
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Relais Contentieux GELEC Card (Conserve le design originel) */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--radius-card)',
          padding: '18px 20px',
          display: 'none',
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
      </div>

      {/* Barre d'action supérieure avec bouton Déposer une pièce */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Pièces et Actes de la Procédure
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            Consultez, prévisualisez en direct et téléchargez l'ensemble des pièces probantes scannées ou notifiées.
          </div>
        </div>

        {canWrite && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={uploadBusy}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={uploadBusy}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Upload size={14} />
              <span>{uploadBusy ? 'Dépôt en cours…' : 'Verser un document PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-btn)',
            backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger, #ef4444)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Documents Table avec le design exact de Salem */}
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
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
              <th style={{ padding: '10px 16px', width: '170px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune pièce procédurale enregistrée dans ce dossier.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{doc.titre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Créé par {doc.auteur} • le <span>{doc.dateCreation}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {doc.reference}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {/* Bouton pour VOIR ce qui se passe dans le PDF */}
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(doc)}
                        title="Consulter et prévisualiser le document PDF"
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-accent)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '5px 9px',
                          color: 'var(--color-accent)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Eye size={13} strokeWidth={2} />
                        <span>Consulter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPdf(doc)}
                        title={`Télécharger ${doc.reference}`}
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '5px 7px',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <Download size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modale de prévisualisation PDF interactive */}
      {previewDoc && (
        <PdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={previewDoc.titre}
          fileUrl={previewDoc.fileUrl}
          file={previewDoc.rawFile}
          metadata={{
            reference: previewDoc.reference,
            auteur: previewDoc.auteur,
            date: previewDoc.dateCreation,
            statut: previewDoc.statutValidation,
            scanState: previewDoc.scanState || 'accepted',
          }}
          mockContent={{
            type: previewDoc.titre,
            objet: `Pièce d’instruction contradictoire enregistrée sous la référence ${previewDoc.reference}`,
            destinataire: 'Opérateur économique contrôlé',
            constats: [
              'Examen de la conformité douanière des déclarations d’importation et des titres de transport.',
              'Contrôle de concordance entre les valeurs déclarées en douane et les bordereaux bancaires certifiés.',
              'Vérification matérielle des quittances et des droits de douane liquidés.',
            ],
            conclusions:
              'La présente pièce est versée au dossier d’enquête douanière pour servir et valoir ce que de droit.',
          }}
        />
      )}
    </div>
  );
};
