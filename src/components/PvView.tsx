import React, { useState } from 'react';
import {
  Download,
  Plus,
  X,
  CheckCircle,
  Scale,
  Printer,
  ArrowLeft,
  Eye
} from 'lucide-react';
import type { DossierEnquete, FeuilleObservation, UserAccount, DocumentItem, PvDetail } from '../types';
import type { DossierTabId } from './DossierHeader';
import { formatDate } from '../utils/dateUtils';
import { ModalPortal } from './common/ModalPortal';
import { PdfPreviewModal } from './common/PdfPreviewModal';

interface PvViewProps {
  dossier: DossierEnquete;
  pvs?: PvDetail[];
  initialPv?: PvDetail | null;
  feuille?: FeuilleObservation | null;
  currentUser?: UserAccount;
  documents?: DocumentItem[];
  onNavigateTab?: (tab: DossierTabId) => void;
  onUpdatePv?: (pvData: PvDetail) => void;
  onAddPv?: (pvData: PvDetail) => void;
}

export const PvView: React.FC<PvViewProps> = ({
  dossier,
  pvs,
  initialPv,
  feuille,
  currentUser,
  documents = [],
  onNavigateTab,
  onUpdatePv,
  onAddPv,
}) => {
  const defaultAuteur = currentUser
    ? `${currentUser.prenom} ${currentUser.nom}`
    : (feuille?.inspecteurs?.[0]?.replace(/^(Inspecteur|Contrôleur|Directeur|Chef de Bureau)\s+/i, '') || 'Marc Kabamba');

  // PV par défaut synthétisé si la feuille d'observation a un PV GLEC
  const fallbackPvs: PvDetail[] = feuille?.pvInfractionGlec ? [{
    id: 'pv-01',
    reference: feuille.pvInfractionGlec.reference,
    dossierId: dossier.id,
    datePv: feuille.pvInfractionGlec.date,
    typePv: 'Procès-verbal d’infraction',
    inspecteurs: feuille.pvInfractionGlec.inspecteurs,
    destinataire: feuille.destinataire || dossier.entiteControlee.nom,
    objet: feuille.objetControle || dossier.objet,
    cadreLegal: feuille.cadreLegal,
    infractions: feuille.pvInfractionGlec.infractions,
    droitsEludesUSD: 0,
    droitsEludesCDF: 0,
    amendeUSD: 0,
    destinationContentieuse: 'Transmission à la Division Contentieuse DRK Lubumbashi & Parquet près le Tribunal de Grande Instance',
    statutPv: 'TRANSMIS_CONTENTIEUX',
    pdfNom: 'PV_Infraction_Douaniere_Officiel.pdf',
    pdfTaille: '1.2 Mo',
  }] : [];

  const pvsList: PvDetail[] = (pvs && pvs.length > 0)
    ? pvs
    : (initialPv ? [initialPv] : fallbackPvs);

  // null = vue cartes (liste), string = id du PV affiché en détail
  const [selectedPvId, setSelectedPvId] = useState<string | null>(null);

  const activePv: PvDetail | null = selectedPvId
    ? (pvsList.find((p) => p.id === selectedPvId) || null)
    : null;

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [previewPdfData, setPreviewPdfData] = useState<{
    title: string;
    metadata?: any;
    documentContent?: any;
    file?: File;
    fileUrl?: string;
  } | null>(null);

  // Formulaire modal avec référence, date, type, objet, inspecteurs, infractions, destination
  const [modalForm, setModalForm] = useState({
    reference: `DGDA/DRK/PV-INF/${new Date().getFullYear()}/089`,
    date: new Date().toISOString().split('T')[0],
    typePv: 'Procès-verbal d’infraction',
    objet: dossier.objet || '',
    inspecteurs: defaultAuteur,
    infractions: 'Minoration de la valeur en douane taxable et carence de justificatifs probants (Articles 356 et 357 du Code des douanes)',
    destination: 'Transmission à la Division Contentieuse DRK Lubumbashi & Parquet près le Tribunal de Grande Instance',
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.reference.trim() || !modalForm.inspecteurs.trim() || !modalForm.objet.trim()) {
      alert('Veuillez remplir les informations obligatoires.');
      return;
    }

    const updatedInfractions = modalForm.infractions
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const inspArray = modalForm.inspecteurs.split(',').map((s) => s.trim()).filter(Boolean);

    if (modalMode === 'create') {
      const newId = `pv-${Date.now()}`;
      const newPv: PvDetail = {
        id: newId,
        reference: modalForm.reference,
        dossierId: dossier.id,
        datePv: modalForm.date,
        typePv: modalForm.typePv || 'Procès-verbal d’infraction',
        destinataire: dossier.entiteControlee.nom,
        inspecteurs: inspArray.length > 0 ? inspArray : [defaultAuteur],
        objet: modalForm.objet.trim(),
        cadreLegal: 'Articles 356, 357, 398 et 402 du Code des douanes (Loi n° 10/002)',
        infractions: updatedInfractions.length > 0 ? updatedInfractions : ['Minoration de la valeur en douane taxable'],
        droitsEludesUSD: 0,
        droitsEludesCDF: 0,
        amendeUSD: 0,
        destinationContentieuse: modalForm.destination,
        statutPv: 'DRESSE',
        pdfNom: 'PV_Infraction_Douaniere_Officiel.pdf',
        pdfTaille: '1.2 Mo',
      };

      if (onAddPv) {
        onAddPv(newPv);
      } else if (onUpdatePv) {
        onUpdatePv(newPv);
      }
      setSelectedPvId(newId);
      setShowEditModal(false);
      showToast('Nouveau procès-verbal dressé avec succès.');
    } else {
      if (!activePv) return;
      const updated: PvDetail = {
        ...activePv,
        reference: modalForm.reference,
        datePv: modalForm.date,
        typePv: modalForm.typePv || activePv.typePv || 'Procès-verbal d’infraction',
        objet: modalForm.objet.trim() || activePv.objet,
        inspecteurs: inspArray.length > 0 ? inspArray : activePv.inspecteurs,
        infractions: updatedInfractions.length > 0 ? updatedInfractions : activePv.infractions,
        destinationContentieuse: modalForm.destination,
      };

      onUpdatePv?.(updated);
      setShowEditModal(false);
      showToast('Procès-verbal mis à jour avec succès.');
    }
  };

  const renderModal = () => (
    <ModalPortal>
      <div
        className="modal-backdrop-responsive"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
        }}
      >
      <div
        className="modal-card-responsive"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {modalMode === 'create' ? 'Dresser un nouveau procès-verbal' : 'Modifier les éléments du procès-verbal'}
            </h3>
            {/* <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {modalMode === 'create' ? 'Enregistrement officiel de la qualification des infractions douanières' : 'Ajustement des mentions officielles et des qualifications d\'infraction'}
            </div> */}
          </div>
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleModalSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>


          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Date de verbalisation *
            </label>
            <input
              type="date"
              required
              value={modalForm.date}
              onChange={(e) => setModalForm((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Type de procès-verbal *
            </label>
            <select
              value={modalForm.typePv}
              onChange={(e) => setModalForm((prev) => ({ ...prev, typePv: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="Procès-verbal d’infraction">Procès-verbal d’infraction</option>
              <option value="Procès-verbal de constat">Procès-verbal de constat</option>
              <option value="Procès-verbal de saisie">Procès-verbal de saisie</option>
              <option value="Procès-verbal d’audition">Procès-verbal d’audition</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Objet du procès-verbal *
            </label>
            <input
              type="text"
              required
              value={modalForm.objet}
              onChange={(e) => setModalForm((prev) => ({ ...prev, objet: e.target.value }))}
              placeholder="Ex: Infraction constatée aux opérations de dédouanement..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Inspecteurs verbalisateurs *
            </label>
            <input
              type="text"
              required
              value={modalForm.inspecteurs}
              onChange={(e) => setModalForm((prev) => ({ ...prev, inspecteurs: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Infractions constatées (1 par ligne) *
            </label>
            <textarea
              rows={3}
              required
              value={modalForm.infractions}
              onChange={(e) => setModalForm((prev) => ({ ...prev, infractions: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Destination contentieuse & Mesures
            </label>
            <input
              type="text"
              value={modalForm.destination}
              onChange={(e) => setModalForm((prev) => ({ ...prev, destination: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowEditModal(false)}
              style={{ fontSize: '12px' }}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>
              {modalMode === 'create' ? 'Dresser le PV' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );

  // =========================================================================
  // 1. PAGE DES CARTES : AFFICHAGE EN CARTES DE TOUS LES PV
  // =========================================================================
  if (!activePv) {
    return (
      <div key="pv-cards-list" className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Toast Notification */}
        {notification && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-card)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 9999,
            }}
          >
            <CheckCircle size={16} color="var(--color-accent)" />
            <span>{notification}</span>
          </div>
        )}

        {/* En-tête de la page des cartes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '8px',
          }}
        >
          <div>
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Procès-verbaux (PV)
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {pvsList.length} au total
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Qualifications des infractions douanières et transmissions contentieuses
            </p> */}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setModalMode('create');
              setModalForm({
                reference: `DGDA/DRK/PV-INF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
                date: new Date().toISOString().split('T')[0],
                typePv: 'Procès-verbal d’infraction',
                objet: dossier.objet || '',
                inspecteurs: defaultAuteur,
                infractions: 'Minoration de la valeur en douane taxable et carence de justificatifs probants (Articles 356 et 357 du Code des douanes)',
                destination: 'Transmission à la Division Contentieuse DRK Lubumbashi & Parquet près le Tribunal de Grande Instance',
              });
              setShowEditModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '8px 16px',
            }}
          >
            <Plus size={14} />
            <span>Dresser un nouveau PV</span>
          </button>
        </div>

        {/* Grille des cartes des PV */}
        {pvsList.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <p style={{ fontSize: '13px', margin: 0 }}>Aucun procès-verbal dressé pour ce dossier.</p>
          </div>
        ) : (
          <div className="cards-grid-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pvsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPvId(item.id)}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'border-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Destinataire
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                        {item.destinataire || dossier.entiteControlee.nom}
                      </div>
                    </div>

                  
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Infraction constatée
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.4,
                        margin: '2px 0 0 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.infractions[0] || 'Infraction douanière constatée'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>
                      Type : <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.typePv || 'Procès-verbal d’infraction'}</strong>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span>
                    Verbalisé le : <span className="font-sf" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(item.datePv)}</span>
                  </span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                    Consulter →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showEditModal && renderModal()}
      </div>
    );
  }

  // =========================================================================
  // 2. PAGE DÉTAIL D'UN PROCÈS-VERBAL SÉLECTIONNÉ
  // =========================================================================
  const pvData = {
    id: activePv.id,
    reference: activePv.reference,
    date: activePv.datePv,
    typePv: activePv.typePv || 'Procès-verbal d’infraction',
    destinataire: activePv.destinataire,
    inspecteurs: activePv.inspecteurs.join(', '),
    motif: activePv.objet,
    cadreLegal: activePv.cadreLegal,
    infractions: activePv.infractions,
    droitsEludesUSD: activePv.droitsEludesUSD,
    droitsEludesCDF: activePv.droitsEludesCDF,
    amendeUSD: activePv.amendeUSD,
    destination: activePv.destinationContentieuse,
    statutTransmission: activePv.statutPv || 'TRANSMIS_CONTENTIEUX',
    pdfNom: activePv.pdfNom || 'PV_Infraction_Douaniere_Officiel.pdf',
    pdfTaille: activePv.pdfTaille || '1.2 Mo',
  };

  return (
    <div key={`pv-detail-${activePv.id}`} className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-card)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <CheckCircle size={16} color="var(--color-accent)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Retour vers la page des cartes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => setSelectedPvId(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 0',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Retour à tous les procès-verbaux</span>
        </button>
      </div>

      {/* =========================================================================
          PAGE INFO ÉPURÉE : PROCÈS-VERBAL SÉLECTIONNÉ
          ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* En-tête de la Page Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '16px',
          }}
        >
          <div>
            {/* Type de PV */}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              {pvData.typePv}
            </div>

            {/* Destinataire : Nom de l'entreprise en GRAS */}
            <p
              style={{
                color: 'var(--color-text-primary)',
                marginTop: '6px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Destinataire :
              </span>{' '}
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                {pvData.destinataire}
              </span>
            </p>

            {/* Inspecteurs verbalisateurs : SANS ICÔNE */}
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>
                Inspecteurs verbalisateurs :
              </span>{' '}
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                {pvData.inspecteurs}
              </span>
            </div>

            {/* Référence directoristrative du PV */}
            {/* <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              <span>Référence officielle : </span>
              <span className="font-sf" style={{ fontWeight: 400 }}>{pvData.reference}</span>
            </div> */}
          </div>

          {/* Action Modifier le PV & Statut sobre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {pvData.statutTransmission === 'TRANSMIS_CONTENTIEUX' ? 'Transmis GLEC' : 'Dressé'}
            </span>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setModalMode('edit');
                setModalForm({
                  reference: pvData.reference,
                  date: pvData.date,
                  typePv: pvData.typePv,
                  objet: pvData.motif,
                  inspecteurs: pvData.inspecteurs,
                  infractions: pvData.infractions.join('\n'),
                  destination: pvData.destination,
                });
                setShowEditModal(true);
              }}
              style={{ fontSize: '12px', padding: '6px 14px' }}
              title="Modifier les éléments du PV"
            >
              <span>Modifier le PV</span>
            </button>
          </div>
        </div>

        {/* Corps simplifié de la Page Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Objet & Motifs du procès-verbal */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Objet & motifs du procès-verbal
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {pvData.motif}
            </p>
            
          </div>

          {/* 2. Chronologie de la procédure */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              padding: '12px 14px',
              backgroundColor: 'transparent',
              borderRadius: '6px',
              border: 'none',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Procès-verbal dressé le :{' '}
              <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {formatDate(pvData.date)}
              </strong>
            </div>

            {feuille?.dateReunionCloturePrevue && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Audition contradictoire passée le :{' '}
                <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {formatDate(feuille.dateReunionCloturePrevue)}
                </strong>
              </div>
            )}
          </div>

          {/* 3. Document PDF officiel du PV */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Document officiel du procès-verbal
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {pvData.pdfNom}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {pvData.pdfTaille} 
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() =>
                    setPreviewPdfData({
                      title: pvData.pdfNom || 'PV_Infraction_Douaniere_Officiel.pdf',
                      metadata: {
                        reference: pvData.reference,
                        auteur: Array.isArray(pvData.inspecteurs) ? pvData.inspecteurs.join(', ') : pvData.inspecteurs,
                        date: pvData.date,
                        taille: pvData.pdfTaille || '1.2 Mo',
                        entite: pvData.destinataire,
                      },
                      documentContent: {
                        type: 'PROCÈS-VERBAL D’INFRACTION DOUANIÈRE OFFICIEL',
                        destinataire: pvData.destinataire,
                        objet: pvData.motif,
                        constats: pvData.infractions,
                        observations: [
                          `Droits éludés / compromis : ${pvData.droitsEludesUSD ? `${pvData.droitsEludesUSD.toLocaleString('fr-FR')} USD` : ''} ${pvData.droitsEludesCDF ? `${pvData.droitsEludesCDF.toLocaleString('fr-FR')} CDF` : ''}`,
                          `Amende légale encourue : ${pvData.amendeUSD ? `${pvData.amendeUSD.toLocaleString('fr-FR')} USD` : 'Calcul légal en cours'}`,
                          `Destination contentieuse : ${pvData.destination || 'Parquet près le TGI'}`,
                        ],
                        conclusions:
                          'Acté contradictoirement par les verbalisateurs soussignés pour transmission aux instances compétentes.',
                      },
                    })
                  }
                  title="Consulter et prévisualiser le PV officiel PDF"
                >
                  <Eye size={13} />
                  <span>Consulter</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  onClick={() => showToast('Téléchargement du procès-verbal d’infraction...')}
                  title="Télécharger le PV officiel"
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--color-text-muted)' }}
                  onClick={() => window.print()}
                  title="Imprimer le PV"
                >
                  <Printer size={13} />
                </button>
              </div>
            </div>

            {documents && documents.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Pièces procédurales annexées ({documents.length}) :
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {documents.map((doc) => (
                    <span
                      key={doc.id}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {doc.reference} — {doc.titre}
                    </span>
                  ))}
                </div> */}
              </div>
            )}
          </div>

          {/* 4. Infractions constatées & Chiffrage douanier */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '8px' }}>
              Infractions constatées ({pvData.infractions.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pvData.infractions.map((inf, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '6px',
                    border: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Chef d’infraction n°{idx + 1}
                    </span>
                    
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {inf}
                  </p>
                </div>
              ))}
            </div>


          </div>

          {/* 5. Orientation contentieuse & Juridiction */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Orientation contentieuse
            </div>
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {pvData.destination}
                </div>
               
              </div>

            
            </div>
          </div>

          {/* 6. Actions d'instruction simples */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {/* <button
              type="button"
              className="btn-primary"
              onClick={() => {
                showToast('Bordereau de transmission GELEC généré et validé.');
              }}
              style={{ fontSize: '12px' }}
            >
              <Send size={14} />
              <span>Confirmer le relais GELEC</span>
            </button> */}

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setModalMode('edit');
                setModalForm({
                  reference: pvData.reference,
                  date: pvData.date,
                  typePv: pvData.typePv,
                  objet: pvData.motif,
                  inspecteurs: pvData.inspecteurs,
                  infractions: pvData.infractions.join('\n'),
                  destination: pvData.destination,
                });
                setShowEditModal(true);
              }}
              style={{ fontSize: '12px' }}
            >
              <Scale size={13} />
              <span>Modifier les éléments du PV</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onNavigateTab('constats-defense')}
                style={{
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Scale size={13} />
                <span>Consulter la feuille d’observation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modale d'édition / création */}
      {showEditModal && renderModal()}

      {/* Modale de prévisualisation PDF */}
      {previewPdfData && (
        <PdfPreviewModal
          isOpen={Boolean(previewPdfData)}
          onClose={() => setPreviewPdfData(null)}
          title={previewPdfData.title}
          fileUrl={previewPdfData.fileUrl}
          file={previewPdfData.file}
          metadata={previewPdfData.metadata}
          documentContent={previewPdfData.documentContent}
        />
      )}
    </div>
  );
};
