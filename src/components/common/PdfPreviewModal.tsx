import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export interface PdfPreviewMetadata {
  reference?: string;
  auteur?: string;
  date?: string;
  taille?: string;
  statut?: string;
  scanState?: string;
  entite?: string;
}

export interface DocumentPreviewContent {
  type?: string;
  destinataire?: string;
  objet?: string;
  articles?: string[];
  constats?: string[];
  observations?: string[];
  conclusions?: string;
}

export interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl?: string | null;
  file?: File | null;
  metadata?: PdfPreviewMetadata;
  documentContent?: DocumentPreviewContent;
  mockContent?: DocumentPreviewContent;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  file,
  metadata,
  documentContent,
  mockContent,
}) => {
  const content = documentContent || mockContent;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Gestion des touches Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Préparation de l'URL blob (soit depuis le File, soit depuis fileUrl API)
  useEffect(() => {
    if (!isOpen) {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      return;
    }

    setFetchError(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (fileUrl) {
      if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
        setObjectUrl(fileUrl);
        return;
      }

      setLoading(true);
      fetch(fileUrl, { credentials: 'same-origin' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
        })
        .catch((err) => {
          console.warn('[PdfPreviewModal] Impossible de charger le flux binaire, bascule sur aperçu document :', err);
          setFetchError(err.message);
        })
        .finally(() => setLoading(false));

      return () => {
        if (objectUrl && objectUrl.startsWith('blob:')) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }
  }, [isOpen, file, fileUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (objectUrl) {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal>
      <div
        className="modal-backdrop-responsive"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: isFullScreen ? '0' : '20px',
        }}
      >
        <div
          className="modal-card-responsive"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: isFullScreen ? 0 : 'var(--radius-lg, 16px)',
            width: isFullScreen ? '100vw' : '94vw',
            maxWidth: isFullScreen ? '100vw' : '1100px',
            height: isFullScreen ? '100vh' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header de la visionneuse */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-surface-elevated)',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {metadata?.reference && <span>Réf : {metadata.reference}</span>}
                  {metadata?.date && <span>Émis le : {metadata.date}</span>}
                  {metadata?.taille && <span>{metadata.taille}</span>}
                  {metadata?.scanState && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: metadata.scanState === 'accepted' ? '#10b981' : '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      <ShieldCheck size={12} />
                      {metadata.scanState === 'accepted' ? 'Contrôle antivirus validé' : metadata.scanState}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Barre d'actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
                title="Zoom arrière"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', minWidth: '40px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
                title="Zoom avant"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <ZoomIn size={14} />
              </button>

              <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrint}
                title="Imprimer le document"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <Printer size={14} />
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleDownload}
                title="Télécharger le fichier PDF"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Télécharger</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsFullScreen((f) => !f)}
                title={isFullScreen ? 'Quitter le plein écran' : 'Plein écran'}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                title="Fermer"
                style={{ padding: '6px 10px', fontSize: '12px', marginLeft: '6px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Corps de visualisation du document */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--color-bg-deep, #161618)',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              position: 'relative',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div
                  style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    border: '3px solid var(--color-border)',
                    borderTopColor: 'var(--color-accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '12px',
                  }}
                />
                <div>Chargement du fichier PDF sécurisé...</div>
              </div>
            ) : objectUrl && !fetchError ? (
              /* Affichage interactif avec iframe / embed natif du navigateur */
              <div
                style={{
                  width: `${zoomLevel}%`,
                  height: '100%',
                  maxWidth: '1000px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'width var(--transition-fast)',
                }}
              >
                <iframe
                  src={`${objectUrl}#toolbar=1&navpanes=0`}
                  title={title}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            ) : (
              /* Visualiseur synthétique DGDA Procezo haute fidélité */
              <div
                style={{
                  width: `${zoomLevel}%`,
                  maxWidth: '840px',
                  minHeight: '750px',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a',
                  padding: '48px 56px',
                  borderRadius: '6px',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  position: 'relative',
                  transition: 'width var(--transition-fast)',
                }}
              >
                {/* Filigrane discret officiel */}
                <div
                  style={{
                    position: 'absolute',
                    top: '45%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-35deg)',
                    fontSize: '64px',
                    fontWeight: 900,
                    color: 'rgba(0, 0, 0, 0.04)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    letterSpacing: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </div>

                {/* En-tête officiel DGDA */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid #000',
                    paddingBottom: '16px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px' }}>
                      RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>MINISTÈRE DES FINANCES</div>
                    <div style={{ fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>
                      DIRECTION GÉNÉRALE DES DOUANES ET ACCISES (DGDA)
                    </div>
                    <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '2px' }}>
                      Direction des Enquêtes Douanières
                    </div>
                  </div>

                  <img
                    src="/Logo-dgda.png"
                    alt="Armoiries DGDA"
                    style={{ width: '54px', height: '54px', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div style={{ textAlign: 'right', fontSize: '11px' }}>
                    <div><strong>Réf :</strong> {metadata?.reference || 'DGDA/DRK/ENQ/2026/0842'}</div>
                    <div><strong>Date :</strong> {metadata?.date || new Date().toLocaleDateString('fr-FR')}</div>
                    <div><strong>Lieu :</strong> Lubumbashi, Haut-Katanga</div>
                  </div>
                </div>

                {/* Titre officiel de l'acte */}
                <div style={{ textAlign: 'center', margin: '24px 0 20px 0' }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      textDecoration: 'underline',
                    }}
                  >
                    {content?.type || title.replace(/\.pdf$/i, '').replace(/_/g, ' ')}
                  </div>
                  {metadata?.entite && (
                    <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>
                      Entité concernée : {metadata.entite}
                    </div>
                  )}
                </div>

                {/* Corps de document */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {content?.objet && (
                    <div>
                      <strong>OBJET : </strong>
                      <span>{content.objet}</span>
                    </div>
                  )}

                  {content?.destinataire && (
                    <div>
                      <strong>DESTINATAIRE : </strong>
                      <span>{content.destinataire}</span>
                    </div>
                  )}

                  <div>
                    <strong>BASE LÉGALE & DISPOSITIONS DOUANIÈRES :</strong>
                    <p style={{ margin: '4px 0 0 0', textAlign: 'justify' }}>
                      Vu la Loi n° 10/002 portant Code des Douanes en République Démocratique du Congo, notamment en ses
                      articles 46 (droit de communication des documents et registres), 356, 357, 398 et 402 relatifs aux
                      pouvoirs de constatation des agents verbalisateurs des douanes et à la répression des infractions.
                    </p>
                  </div>

                  {content?.constats && content.constats.length > 0 && (
                    <div>
                      <strong>CONSTATATIONS MATÉRIELLES DES ENQUÊTEURS :</strong>
                      <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                        {content.constats.map((c, idx) => (
                          <li key={idx} style={{ marginBottom: '4px', textAlign: 'justify' }}>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content?.observations && content.observations.length > 0 && (
                    <div>
                      <strong>OBSERVATIONS ET ÉLÉMENTS DE RÉPONSE RECUEILLIS :</strong>
                      <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                        {content.observations.map((obs, idx) => (
                          <li key={idx} style={{ marginBottom: '4px', textAlign: 'justify' }}>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <strong>CONCLUSION OPÉRATIONNELLE :</strong>
                    <p style={{ margin: '4px 0 0 0', textAlign: 'justify' }}>
                      {content?.conclusions ||
                        "Le présent document fait foi des constatations opérées dans le cadre strict de la mission d'enquête douanière. Toute omission ou fausse déclaration expose le contrevenant aux peines prévues par la législation douanière en vigueur."}
                    </p>
                  </div>
                </div>

                {/* Signatures & Sceau */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '48px',
                    paddingTop: '20px',
                  }}
                >
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>L'Agent Enquêteur / Verbalisateur</div>
                    <div style={{ marginTop: '28px', fontSize: '12px', fontWeight: 700 }}>
                      {metadata?.auteur || 'Inspecteur des Douanes'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#555' }}>Direction des Enquêtes</div>
                  </div>

                  {/* Sceau officiel simulé */}
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      border: '2px dashed #004085',
                      color: '#004085',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 800,
                      textAlign: 'center',
                      transform: 'rotate(-12deg)',
                      opacity: 0.85,
                    }}
                  >
                    <span>★ DGDA ★</span>
                    <span style={{ fontSize: '7px' }}>SCEAU OFFICIEL</span>
                    <span style={{ fontSize: '6px' }}>LUBUMBASHI</span>
                  </div>

                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>Le Chef de Division / Directeur</div>
                    <div style={{ marginTop: '28px', fontSize: '12px', fontWeight: 700 }}>
                      Salem Mukendi
                    </div>
                    <div style={{ fontSize: '10px', color: '#555' }}>Commandement de Brigade</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
