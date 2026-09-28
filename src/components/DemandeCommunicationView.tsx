import React, { useState } from 'react';
import {
  Download,
  Upload,
  Plus,
  X,
  CheckCircle,
  Scale,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import type { DemandeCommunication, FeuilleObservation, UserAccount } from '../types';
import { formatDate } from '../utils/dateUtils';
import { ModalPortal } from './common/ModalPortal';

interface DemandeCommunicationViewProps {
  demandes?: DemandeCommunication[];
  initialDemande?: DemandeCommunication | null;
  currentUser?: UserAccount;
  dossierNom?: string;
  onGoToFeuilleObservation?: () => void;
  onUpdateDemande?: (demande: DemandeCommunication) => void;
  onAddDemande?: (demande: DemandeCommunication) => void;
  onCancelDemande?: (demandeId: string) => void;
  onCreateFeuille?: (feuille: FeuilleObservation) => void;
  onCloturerSansSuite?: (motif: string) => void;
  onRevirementJugement?: (motif: string, docNom?: string) => void;
  hasFeuille?: boolean;
  hasPv?: boolean;
}

export const DemandeCommunicationView: React.FC<DemandeCommunicationViewProps> = ({
  demandes,
  initialDemande,
  currentUser,
  dossierNom,
  onGoToFeuilleObservation,
  onUpdateDemande,
  onAddDemande,
  onCancelDemande,
  onCreateFeuille,
  onCloturerSansSuite,
  onRevirementJugement,
  hasFeuille = false,
  hasPv = false,
}) => {
  const demandesList = (demandes && demandes.length > 0)
    ? demandes
    : (initialDemande ? [initialDemande] : []);

  // null = vue cartes (liste), string = id de la demande affichée en détail
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null);

  const demande = selectedDemandeId
    ? (demandesList.find((d) => d.id === selectedDemandeId) || null)
    : null;

  const defaultAuteur = currentUser
    ? `${currentUser.prenom} ${currentUser.nom}`
    : (demande?.auteur?.replace(/^(Inspecteur|Contrôleur|Directeur|Chef de Bureau)\s+/i, '') || demande?.redacteur?.replace(/^(Inspecteur|Contrôleur|Directeur|Chef de Bureau)\s+/i, '') || 'Marc Kabamba');

  // Formulaire de création / remplacement demande
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulaire de création de la feuille d'observation
  const [showFeuilleModal, setShowFeuilleModal] = useState(false);

  // Formulaire de satisfaction & classement sans suite
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [satisfactionForm, setSatisfactionForm] = useState({
    inspecteur: defaultAuteur,
    dateDecision: new Date().toISOString().split('T')[0],
    motif: 'Les pièces comptables et justificatifs transmis justifient la conformité intégrale des opérations. Absence d’irrégularité douanière ou fiscale constatée.',
    decision: 'CLASSE_SANS_SUITE' as const,
    recommandations: 'Archivage du dossier au rang des affaires régulières avec visa de conformité de la hiérarchie.',
  });

  const handleSatisfactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!satisfactionForm.motif.trim()) {
      alert('Veuillez renseigner le motif de satisfaction.');
      return;
    }
    if (demande) {
      const updated: DemandeCommunication = {
        ...demande,
        statut: 'REPONSE_COMPLETE',
        evaluationReponse: 'SATISFAISANTE',
        motifSatisfaction: satisfactionForm.motif,
      };
      onUpdateDemande?.(updated);
    }
    onCloturerSansSuite?.(satisfactionForm.motif);
    setShowSatisfactionModal(false);
    showToast('Demande marquée satisfaite — Dossier classé sans suite avec succès.');
  };

  // Modale de revirement sur le jugement
  const [showRevirementModal, setShowRevirementModal] = useState(false);
  const [revirementForm, setRevirementForm] = useState({
    inspecteur: defaultAuteur,
    dateRevirement: new Date().toISOString().split('T')[0],
    motif: '',
    documentNom: '',
    pdfFile: null as { name: string; size: string } | null,
  });

  const handleRevirementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revirementForm.motif.trim()) {
      alert('Veuillez renseigner le motif du revirement de situation.');
      return;
    }
    const docName = revirementForm.pdfFile?.name || revirementForm.documentNom || 'Nouvelle pièce probante';
    if (demande) {
      const updated: DemandeCommunication = {
        ...demande,
        evaluationReponse: undefined,
        motifSatisfaction: undefined,
        revirementJugement: {
          date: revirementForm.dateRevirement,
          motif: revirementForm.motif,
          documentNom: docName,
          documentTaille: revirementForm.pdfFile?.size || '540 Ko',
          inspecteur: revirementForm.inspecteur,
        },
      };
      onUpdateDemande?.(updated);
    }
    onRevirementJugement?.(revirementForm.motif, docName);
    setShowRevirementModal(false);
    showToast('Revirement de situation acté. Vous pouvez réévaluer la demande.');
  };

  // Formulaire d'enregistrement de la réponse de l'opérateur (STRICTEMENT 5 CHAMPS)
  const [showReponseModal, setShowReponseModal] = useState(false);
  const [reponseForm, setReponseForm] = useState({
    dateReception: new Date().toISOString().split('T')[0],
    reference: '',
    auteur: initialDemande?.destinataire?.nom || 'Direction Générale',
    commentaire: '',
    pdfFile: null as { name: string; size: string } | null,
  });

  // État du formulaire épuré : champs avec qualification de cible et adresse
  const [createForm, setCreateForm] = useState({
    auteur: defaultAuteur,
    destinataire: demande?.destinataire?.nom || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
    typeCible: 'Entreprise commerciale',
    pourLeCompteDe: '',
    adresse: demande?.destinataire?.adresse || '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
    echeance: demande?.echeanceReponse || '2026-10-15',
    objet: demande?.objet || 'Communication des manifestes de fret maritime et factures CIF Kasumbalesa',
    pdfFile: null as { name: string; size: string } | null,
  });

  // Formulaire Feuille d'observation
  const [feuilleForm, setFeuilleForm] = useState({
    inspecteur: defaultAuteur,
    destinataire: demande?.destinataire?.nom || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
    typeCible: 'Entreprise commerciale',
    pourLeCompteDe: '',
    adresse: demande?.destinataire?.adresse || '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
    objet: `Constatations contradictoires suite au défaut de communication : ${demande?.objet || ''}`,
    auditionPrevue: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    pdfFile: null as { name: string; size: string } | null,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.destinataire.trim() || !createForm.objet.trim()) {
      alert('Veuillez remplir le destinataire et l’objet de la demande.');
      return;
    }

    const newId = `demande-${Date.now()}`;
    const newDemande: DemandeCommunication = {
      id: newId,
      reference: `DGDA/DRK/ENQ/DC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      dossierId: demande?.dossierId || '',
      auteur: createForm.auteur,
      redacteur: createForm.auteur,
      dateEmission: new Date().toISOString().split('T')[0],
      echeanceReponse: createForm.echeance,
      objet: createForm.objet,
      destinataire: {
        nom: createForm.destinataire,
        qualite: createForm.typeCible,
        typeCible: createForm.typeCible,
        pourLeCompteDe: createForm.pourLeCompteDe.trim() || undefined,
        adresse: createForm.adresse.trim(),
      },
      statut: 'EMISE',
      signataireHabilite: 'Salem Mukendi (Directeur Provincial)',
      gradeSignataire: 'Commandement de Division',
      baseLegale: 'Droit de communication et contrôle douanier (Code des douanes, Article 46)',
      elementsDemandes: [
        {
          id: `EL-${Date.now()}`,
          libelle: createForm.objet,
          periodeConcernee: 'Exercice sous contrôle',
          motifExigence: 'Vérification de la valeur en douane',
          statutRemise: 'EN_ATTENTE',
        },
      ],
      reponsesRecues: [],
      modaliteRemise: 'Transmission électronique et dépôt physique',
      commentairesInternes: 'Demande officielle notifiée',
      pdfSourceNom: createForm.pdfFile ? createForm.pdfFile.name : 'Requisition_Officielle_Art46.pdf',
    };

    if (onAddDemande) {
      onAddDemande(newDemande);
    } else {
      onUpdateDemande?.(newDemande);
    }
    setSelectedDemandeId(newId);
    setShowCreateModal(false);
    showToast('Nouvelle demande de communication créée avec succès.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateForm((prev) => ({
        ...prev,
        pdfFile: {
          name: file.name,
          size: `${Math.round(file.size / 1024)} Ko`,
        },
      }));
    }
  };

  const handleFeuilleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeuilleForm((prev) => ({
        ...prev,
        pdfFile: {
          name: file.name,
          size: `${Math.round(file.size / 1024)} Ko`,
        },
      }));
    }
  };

  const handleFeuilleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feuilleForm.destinataire.trim() || !feuilleForm.objet.trim()) {
      alert('Veuillez renseigner le destinataire et l’objet du contrôle.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newFeuille: FeuilleObservation = {
      id: `fo-${Date.now()}`,
      reference: `DGDA/DRK/FO/${now.getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      dossierId: demande?.dossierId || '',
      dateRedaction: dateStr,
      inspecteurs: [feuilleForm.inspecteur],
      destinataire: feuilleForm.destinataire,
      typeCible: feuilleForm.typeCible,
      pourLeCompteDe: feuilleForm.pourLeCompteDe.trim() || undefined,
      adresse: feuilleForm.adresse.trim(),
      objetControle: feuilleForm.objet,
      cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49) portant réglementation des contrôles a posteriori en RDC',
      statutFeuille: 'NOTIFIEE',
      dateReunionCloturePrevue: feuilleForm.auditionPrevue,
      observations: [
        {
          code: 'O1',
          titre: 'Défaut de justification et pièces non satisfaisantes',
          faitsConstates: `L’opérateur n’a pas transmis les justificatifs probants requis au titre de la réquisition ${demande?.reference || ''}. Constat d’obstacle aux vérifications douanières et carence de pièces requises.`,
          justificatifsAssocies: ['Réquisition administrative', 'Avis de mise en demeure'],
          referencesJuridiques: 'Code des douanes, Article 46 et Article 49',
          questionsAssujetti: 'Fournir sous 14 jours les pièces justificatives manquantes ou explications écrites contradictoires.',
          statutConstat: 'OUVERT',
          analyseMotivee: 'Réponse jugée non satisfaisante. Ouverture formelle de la feuille d’observation contradictoire.',
        },
      ],
      pdfSourceNom: feuilleForm.pdfFile ? feuilleForm.pdfFile.name : 'Feuille_Observation_Notifiee.pdf',
    };

    onCreateFeuille?.(newFeuille);
    setShowFeuilleModal(false);
    showToast('Feuille d’observation créée avec succès. L’onglet "Feuille d’observation" est désormais accessible.');
  };

  const handleReponseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReponseForm((prev) => ({
        ...prev,
        pdfFile: {
          name: file.name,
          size: `${Math.round(file.size / 1024)} Ko`,
        },
      }));
    }
  };

  const handleReponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demande) return;

    const fileName = reponseForm.pdfFile ? reponseForm.pdfFile.name : 'Reponse_Operateur_Art46.pdf';
    const fileSize = reponseForm.pdfFile ? reponseForm.pdfFile.size : '820 Ko';
    const refCourrier = reponseForm.reference.trim() || `REP-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    const updated: DemandeCommunication = {
      ...demande,
      statut: 'REPONSE_COMPLETE',
      reponsePdfNom: fileName,
      reponsePdfDate: reponseForm.dateReception,
      reponsePdfTaille: fileSize,
      reponsePdfAuteur: reponseForm.auteur,
      reponsePdfRef: refCourrier,
      reponsesRecues: [
        {
          id: `REP-${Date.now()}`,
          dateReception: reponseForm.dateReception,
          referenceCourrier: refCourrier,
          auteur: reponseForm.auteur,
          elementsFournisIds: demande.elementsDemandes?.map((el) => el.id) || [],
          elementsManquantsIds: [],
          piecesJointes: [fileName],
          analyseEnqueteur: reponseForm.commentaire || 'Pièces justificatives produites par l’opérateur',
          appreciation: 'SATISFAISANTE',
          prochaineAction: 'Examiner les pièces produites',
        },
        ...(demande.reponsesRecues || []),
      ],
    };

    onUpdateDemande?.(updated);
    setShowReponseModal(false);
    showToast('Réponse à la demande de communication enregistrée.');
  };

  const handleAnnulerDemande = () => {
    if (window.confirm('Confirmez-vous l’annulation de cette demande de communication ?')) {
      if (demande && onCancelDemande) {
        onCancelDemande(demande.id);
      } else if (demande) {
        const updated: DemandeCommunication = {
          ...demande,
          statut: 'ANNULEE',
        };
        onUpdateDemande?.(updated);
      }
      showToast('Demande de communication annulée.');
    }
  };

  const renderCreateModal = () => (
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
          zIndex: 1000,
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
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Nouvelle Demande de Communication
          </h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowCreateModal(false)}
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Auteur de la demande
            </label>
            <input
              type="text"
              required
              value={createForm.auteur}
              onChange={(e) => setCreateForm({ ...createForm, auteur: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Destinataire (Entreprise / Opérateur)
            </label>
            <input
              type="text"
              required
              placeholder="Ex : CONGO MINING & CHEMICAL LOGISTICS SAS"
              value={createForm.destinataire}
              onChange={(e) => setCreateForm({ ...createForm, destinataire: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Échéance légale de réponse
            </label>
            <input
              type="date"
              required
              value={createForm.echeance}
              onChange={(e) => setCreateForm({ ...createForm, echeance: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Objet de la demande
            </label>
            <textarea
              rows={3}
              required
              placeholder="Précisez la nature des pièces requises..."
              value={createForm.objet}
              onChange={(e) => setCreateForm({ ...createForm, objet: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Document PDF joint
            </label>
            <label
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <Upload size={14} color="var(--color-text-muted)" />
              <span style={{ fontSize: '12px', color: createForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {createForm.pdfFile ? `${createForm.pdfFile.name} (${createForm.pdfFile.size})` : 'Cliquer pour choisir un document PDF...'}
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </label>
            {createForm.pdfFile && (
              <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '4px' }}>
                Document prêt : {createForm.pdfFile.name} ({createForm.pdfFile.size})
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer la demande
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );

  // =========================================================================
  // 1. PAGE DES CARTES : AFFICHAGE EN CARTES DE TOUTES LES DEMANDES
  // =========================================================================
  if (!demande) {
    return (
      <div key="demande-cards-list" className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
                Demandes de communication
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
                {demandesList.length} au total
              </span>
            </div> */}

          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCreateForm({
                auteur: defaultAuteur,
                destinataire: dossierNom || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
                typeCible: 'Entreprise commerciale',
                pourLeCompteDe: '',
                adresse: '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
                echeance: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
                objet: '',
                pdfFile: null,
              });
              setShowCreateModal(true);
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
            <span>Nouvelle demande</span>
          </button>
        </div>

        {/* Grille des cartes des demandes */}
        {demandesList.length === 0 ? (
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
            <p style={{ fontSize: '13px', margin: 0 }}>Aucune demande de communication enregistrée pour ce dossier.</p>
          </div>
        ) : (
          <div className="cards-grid-auto">
            {demandesList.map((item) => {
              const hasRep = Boolean(
                item.reponsePdfNom ||
                (item.reponsesRecues && item.reponsesRecues.length > 0 && (
                  Boolean(item.reponsesRecues[0].piecesJointes?.length) ||
                  Boolean(item.reponsesRecues[0].referenceCourrier)
                ))
              );

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDemandeId(item.id)}
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
                          {item.destinataire?.nom || dossierNom || 'Entreprise contrôlée'}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hasRep ? 'Réponse reçue' : 'En attente'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Objet
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
                        {item.objet}
                      </p>
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
                      Échéance : <span className="font-sf" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(item.echeanceReponse)}</span>
                    </span>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                      Consulter →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && renderCreateModal()}
      </div>
    );
  }

  // =========================================================================
  // 2. PAGE DÉTAIL D'UNE DEMANDE SÉLECTIONNÉE
  // =========================================================================
  const hasReponse = Boolean(
    Boolean(demande.reponsePdfNom) ||
    (demande.reponsesRecues && demande.reponsesRecues.length > 0 && (
      (demande.reponsesRecues[0].piecesJointes && demande.reponsesRecues[0].piecesJointes.length > 0) ||
      Boolean(demande.reponsesRecues[0].referenceCourrier)
    ))
  );

  const reponsePdfNom =
    demande.reponsePdfNom ||
    demande.reponsesRecues?.[0]?.piecesJointes?.[0] ||
    'Reponse_Operateur_Signee.pdf';

  const reponseDate =
    demande.reponsePdfDate ||
    demande.reponsesRecues?.[0]?.dateReception;

  const reponseRef =
    demande.reponsePdfRef ||
    demande.reponsesRecues?.[0]?.referenceCourrier;

  return (
    <div key={`demande-detail-${demande.id}`} className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
          onClick={() => setSelectedDemandeId(null)}
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
          <span>Retour à toutes les demandes</span>
        </button>
      </div>

      {/* =========================================================================
          PAGE INFO ÉPURÉE : DEMANDE DE COMMUNICATION SÉLECTIONNÉE
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
            // borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '16px',
          }}
        >
          <div>
            {/* Référence administrative : JAMAIS en gras, JAMAIS en couleur accent */}
            {/* <div
              className="font-sf"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                fontWeight: 400,
              }}
            >
              {demande.reference}
            </div> */}

            {/* Nom de l'entreprise : SEULE CHOSE EN GRAS */}
            <p
              style={{
                
                color: 'var(--color-text-primary)',
                marginTop: '6px',
                marginBottom: '4px',
              }}
            >
             <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Destinataire :</span> <span  style={{fontSize: '14px',
                fontWeight: 700,}}>{demande.destinataire.nom}</span>
            </p>

            {/* Type de cible & Pour le compte de : SANS BORDER, SANS BACKGROUND COLOR, SANS ICÔNE */}
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Type de cible : </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {demande.destinataire.typeCible || demande.destinataire.qualite || 'Entreprise commerciale'}
              </span>
              {demande.destinataire.pourLeCompteDe && (
                <span style={{ marginLeft: '6px', color: 'var(--color-text-muted)' }}>
                  (Agissant pour le compte de : <span style={{ color: 'var(--color-text-primary)' }}>{demande.destinataire.pourLeCompteDe}</span>)
                </span>
              )}
            </div>

            {/* Adresse : SANS BORDER, SANS BACKGROUND COLOR, SANS ICÔNE */}
            {demande.destinataire.adresse && (
              <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Adresse : </span>
                <span style={{ color: 'var(--color-text-primary)' }}>{demande.destinataire.adresse}</span>
              </div>
            )}

            {/* Enquêteur rédacteur : SANS ICÔNE */}
            <div style={{ fontSize: '12px',  marginTop: '4px' }}>
             <span style={{color: 'var(--color-text-muted)'}}>Rédacteur :</span>  <span style={{fontSize: '14px',
                fontWeight: 700,}}>{demande.auteur || demande.redacteur || defaultAuteur}</span>
            </div>
          </div>

          {/* Statut sobre monochromatic */}
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
              {hasReponse ? 'Réponse reçue' : 'En attente'}
            </span>
          </div>
        </div>

        {/* Corps simplifié de la Page Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Objet de la réquisition */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Objet de la demande
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {demande.objet}
            </p>
          </div>

          {/* 2. Échéance légale */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              // borderRadius: '6px',
              // border: '1px solid var(--color-border-subtle)',
            }}
          >
            
           
          </div>

          {/* 3. Document PDF joint officiel */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Document officiel notifié
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '6px',
                border: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {demande.pdfSourceNom || 'Requisition_Officielle_Art46.pdf'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {demande.pdfSourceTaille || '940 Ko'} 
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => showToast('Téléchargement du document officiel...')}
                title="Télécharger le document notifié"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* 4. Réponse à la demande de communication (PDF ou Pas de réponse) */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Réponse à la demande de communication
            </div>

            {hasReponse ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '6px',
                  border: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {reponsePdfNom}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {reponseDate ? `Reçue le ${formatDate(reponseDate)}` : 'Document PDF certifié'}
                      {reponseRef ? ` — Réf : ${reponseRef}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => showToast('Téléchargement de la réponse...')}
                    title="Télécharger la réponse"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--color-text-muted)' }}
                    onClick={() => setShowReponseModal(true)}
                    title="Mettre à jour le fichier"
                  >
                    <Upload size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '6px',
                  border: '1px dashed var(--color-border)',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Pas de réponse
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowReponseModal(true)}
                  style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={12} />
                  <span>Ajouter la réponse</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Actions d'instruction simples */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            {!hasReponse ? (
              /* TANT QU'IL N'Y A PAS DE RÉPONSE */
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAnnulerDemande}
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span>Annuler la demande de communication</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowReponseModal(true)}
                  style={{ fontSize: '12px' }}
                >
                  <Upload size={14} />
                  <span>Ajouter la réponse</span>
                </button>
              </div>
            ) : (
              /* DÈS QU'IL Y A UNE RÉPONSE UPLOADÉE */
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {!demande.evaluationReponse && (
                  <>
                    {!hasPv && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setSatisfactionForm((prev) => ({
                            ...prev,
                            inspecteur: defaultAuteur,
                            motif: demande.motifSatisfaction || prev.motif,
                          }));
                          setShowSatisfactionModal(true);
                        }}
                        style={{ fontSize: '12px' }}
                      >
                        <CheckCircle size={14} />
                        <span>Marquer comme satisfait</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const updated: DemandeCommunication = {
                          ...demande,
                          statut: 'TERMINEE',
                          evaluationReponse: 'NON_SATISFAISANTE',
                        };
                        onUpdateDemande?.(updated);
                        setFeuilleForm({
                          inspecteur: defaultAuteur,
                          destinataire: demande.destinataire?.nom || 'Entreprise contrôlée',
                          typeCible: demande.destinataire?.typeCible || demande.destinataire?.qualite || 'Entreprise commerciale',
                          pourLeCompteDe: demande.destinataire?.pourLeCompteDe || '',
                          adresse: demande.destinataire?.adresse || '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
                          objet: `Constatations contradictoires suite au défaut de communication : ${demande.objet}`,
                          auditionPrevue: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                          pdfFile: null,
                        });
                        setShowFeuilleModal(true);
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      <span>Non satisfait</span>
                    </button>
                  </>
                )}

                {demande.evaluationReponse === 'NON_SATISFAISANTE' && !hasFeuille && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setFeuilleForm({
                        inspecteur: defaultAuteur,
                        destinataire: demande.destinataire?.nom || 'Entreprise contrôlée',
                        typeCible: demande.destinataire?.typeCible || demande.destinataire?.qualite || 'Entreprise commerciale',
                        pourLeCompteDe: demande.destinataire?.pourLeCompteDe || '',
                        adresse: demande.destinataire?.adresse || '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
                        objet: `Constatations contradictoires suite au défaut de communication : ${demande.objet}`,
                        auditionPrevue: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                        pdfFile: null,
                      });
                      setShowFeuilleModal(true);
                    }}
                    style={{
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={13} />
                    <span>Rédiger la feuille d’observation</span>
                  </button>
                )}

                {hasFeuille && onGoToFeuilleObservation && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={onGoToFeuilleObservation}
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
                  {demande.evaluationReponse && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setRevirementForm({
                        inspecteur: defaultAuteur,
                        dateRevirement: new Date().toISOString().split('T')[0],
                        motif: '',
                        documentNom: '',
                        pdfFile: null,
                      });
                      setShowRevirementModal(true);
                    }}
                    title="Revenir sur l'évaluation initiale suite à de nouveaux éléments"
                    style={{
                      fontSize: '11px',
                      padding: '5px 10px',
                      color: 'var(--color-text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-btn)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Revenir sur le jugement</span>
                  </button>
                )}

              

                {demande.evaluationReponse === 'SATISFAISANTE' && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-muted)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      <CheckCircle size={14} color="var(--color-text-primary)" />
                      <span>Demande satisfaite — Dossier classé sans suite</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Motif de satisfaction : </span>
                      {demande.motifSatisfaction || 'Les pièces transmises justifient la conformité douanière des opérations contrôlées.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>Échéance :</span>
              <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {formatDate(demande.echeanceReponse)}
              </strong>
            </div>
          </div>
          
        </div>
      </div>

      {/* =========================================================================
          MODALE DE CRÉATION : STRICTEMENT 5 CHAMPS
          1. Auteur de la demande
          2. Destinataire
          3. Échéance
          4. Objet de la demande
          5. Fichier PDF
          ========================================================================= */}
      {showCreateModal && (
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
            zIndex: 1000,
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
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Créer une Demande de Communication
              </h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Champ 1 : Auteur de la demande */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Auteur de la demande
                </label>
                <input
                  type="text"
                  required
                  value={createForm.auteur}
                  onChange={(e) => setCreateForm({ ...createForm, auteur: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 2 : Destinataire */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Destinataire (Entreprise / Opérateur)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : CONGO MINING & CHEMICAL LOGISTICS SAS"
                  value={createForm.destinataire}
                  onChange={(e) => setCreateForm({ ...createForm, destinataire: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 2b : Type de cible */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Type de cible
                  </label>
                  <select
                    value={createForm.typeCible}
                    onChange={(e) => setCreateForm({ ...createForm, typeCible: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Entreprise commerciale">Entreprise commerciale</option>
                    <option value="Commissionnaire en douane">Commissionnaire en douane</option>
                    <option value="Organisation non gouvernementale">Organisation non gouvernementale</option>
                    <option value="Autre catégorie validée">Autre catégorie validée</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Pour le compte de (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Si commissionnaire ou déclarant..."
                    value={createForm.pourLeCompteDe}
                    onChange={(e) => setCreateForm({ ...createForm, pourLeCompteDe: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Champ 2c : Adresse de l'opérateur */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Adresse géographique de l'entité
                </label>
                <input
                  type="text"
                  placeholder="Ex : 04 Avenue des Métaux, Quartier Industriel, Lubumbashi"
                  value={createForm.adresse}
                  onChange={(e) => setCreateForm({ ...createForm, adresse: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 3 : Échéance */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Échéance légale de réponse
                </label>
                <input
                  type="date"
                  required
                  value={createForm.echeance}
                  onChange={(e) => setCreateForm({ ...createForm, echeance: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 4 : Objet de la demande */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Objet de la demande
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Précisez la nature des pièces requises..."
                  value={createForm.objet}
                  onChange={(e) => setCreateForm({ ...createForm, objet: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Champ 5 : Fichier PDF */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Document PDF joint
                </label>
                <label
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Upload size={14} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '12px', color: createForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {createForm.pdfFile ? `${createForm.pdfFile.name} (${createForm.pdfFile.size})` : 'Cliquer pour choisir un document PDF...'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </label>
                {createForm.pdfFile && (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Document prêt : {createForm.pdfFile.name} ({createForm.pdfFile.size})
                  </div>
                )}
              </div>

              {/* Boutons d'action du formulaire */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* =========================================================================
          MODALE DE CRÉATION : FEUILLE D'OBSERVATION (STRICTEMENT 5 CHAMPS)
          1. Inspecteur vérificateur
          2. Destinataire ou entreprise cible
          3. Audition contradictoire prévue
          4. Objet du contrôle
          5. Document PDF joint
          ========================================================================= */}
      {showFeuilleModal && (
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
            zIndex: 1000,
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
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Créer une Feuille d'Observation
              </h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowFeuilleModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFeuilleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Champ 1 : Inspecteur vérificateur */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Inspecteur vérificateur
                </label>
                <input
                  type="text"
                  required
                  value={feuilleForm.inspecteur}
                  onChange={(e) => setFeuilleForm({ ...feuilleForm, inspecteur: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 2 : Destinataire */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Destinataire ou entreprise cible
                </label>
                <input
                  type="text"
                  required
                  value={feuilleForm.destinataire}
                  onChange={(e) => setFeuilleForm({ ...feuilleForm, destinataire: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 2b : Type de cible */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Type de cible
                  </label>
                  <select
                    value={feuilleForm.typeCible}
                    onChange={(e) => setFeuilleForm({ ...feuilleForm, typeCible: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Entreprise commerciale">Entreprise commerciale</option>
                    <option value="Commissionnaire en douane">Commissionnaire en douane</option>
                    <option value="Organisation non gouvernementale">Organisation non gouvernementale</option>
                    <option value="Autre catégorie validée">Autre catégorie validée</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Pour le compte de (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Si commissionnaire ou déclarant..."
                    value={feuilleForm.pourLeCompteDe}
                    onChange={(e) => setFeuilleForm({ ...feuilleForm, pourLeCompteDe: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Champ 2c : Adresse de l'entité */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Adresse de l'entité
                </label>
                <input
                  type="text"
                  placeholder="Ex : 04 Avenue des Métaux, Quartier Industriel, Lubumbashi"
                  value={feuilleForm.adresse}
                  onChange={(e) => setFeuilleForm({ ...feuilleForm, adresse: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 3 : Date d'audition contradictoire */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Audition contradictoire prévue (Date)
                </label>
                <input
                  type="date"
                  required
                  value={feuilleForm.auditionPrevue}
                  onChange={(e) => setFeuilleForm({ ...feuilleForm, auditionPrevue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Champ 4 : Objet du contrôle */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Objet du contrôle
                </label>
                <textarea
                  rows={3}
                  required
                  value={feuilleForm.objet}
                  onChange={(e) => setFeuilleForm({ ...feuilleForm, objet: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Champ 5 : Fichier PDF */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Document PDF des observations notifiées
                </label>
                <label
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Upload size={14} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '12px', color: feuilleForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {feuilleForm.pdfFile ? `${feuilleForm.pdfFile.name} (${feuilleForm.pdfFile.size})` : 'Cliquer pour choisir un document PDF...'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFeuilleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </label>
                {feuilleForm.pdfFile && (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Document prêt : {feuilleForm.pdfFile.name} ({feuilleForm.pdfFile.size})
                  </div>
                )}
              </div>

              {/* Boutons d'action du formulaire */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowFeuilleModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer la feuille d’observation
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* =========================================================================
          MODALE : ENREGISTRER LA RÉPONSE DE L'OPÉRATEUR (STRICTEMENT 5 CHAMPS)
          1. Fichier PDF de la réponse
          2. Date de réception
          3. Référence du courrier opérateur
          4. Signataire / Représentant
          5. Observations de l'enquêteur
          ========================================================================= */}
      {showReponseModal && (
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
            zIndex: 1000,
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
                  Enregistrer la réponse à la demande de communication
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Téléversement des pièces justificatives transmises par l'opérateur
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReponseModal(false)}
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

            <form onSubmit={handleReponseSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Champ 1 : Fichier PDF */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Fichier PDF de la réponse transmise *
                </label>
                <div
                  style={{
                    border: '1px dashed var(--color-border)',
                    borderRadius: '6px',
                    padding: '14px',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-bg)',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('file-upload-reponse')?.click()}
                >
                  <input
                    id="file-upload-reponse"
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleReponseFileChange}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Upload size={18} color="var(--color-accent)" />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {reponseForm.pdfFile ? reponseForm.pdfFile.name : 'Sélectionner le PDF de la réponse'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {reponseForm.pdfFile ? reponseForm.pdfFile.size : 'Format PDF certifié (max 25 Mo)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Champ 2 : Date de réception */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Date de réception *
                </label>
                <input
                  type="date"
                  value={reponseForm.dateReception}
                  onChange={(e) => setReponseForm((prev) => ({ ...prev, dateReception: e.target.value }))}
                  required
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

             

              {/* Champ 4 : Auteur / Représentant */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Auteur ou représentant de l'entreprise
                </label>
                <input
                  type="text"
                  value={reponseForm.auteur}
                  onChange={(e) => setReponseForm((prev) => ({ ...prev, auteur: e.target.value }))}
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

              {/* Champ 5 : Observations de l'inspecteur */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Observations préliminaires de l'inspecteur
                </label>
                <textarea
                  value={reponseForm.commentaire}
                  onChange={(e) => setReponseForm((prev) => ({ ...prev, commentaire: e.target.value }))}
                  rows={2}
                  placeholder="Ex : Transmission des pièces comptables et manifestes demandés..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowReponseModal(false)}
                  style={{ fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>
                  <Upload size={13} />
                  <span>Enregistrer la réponse</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* =========================================================================
          MODALE DE SATISFACTION & CLASSEMENT SANS SUITE DU DOSSIER
          Permet de motiver pourquoi les pièces reçues sont satisfaisantes
          et d'enregistrer ce motif pour classer le dossier sans suite.
          ========================================================================= */}
      {showSatisfactionModal && (
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
            zIndex: 1000,
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
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Modal Header */}
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
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Satisfaction de la Demande & Classement sans Suite
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Définir le motif de conformité qui justifie le classement sans suite de l’enquête
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowSatisfactionModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSatisfactionSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Champ 1 : Motif de satisfaction & Classement sans suite */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Motif de satisfaction & Justification du classement sans suite *
                </label>
                <textarea
                  required
                  rows={4}
                  value={satisfactionForm.motif}
                  onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, motif: e.target.value }))}
                  placeholder="Détailler précisément les motifs de conformité (ex: pièces probantes, quittances régularisées, absence d'infraction)..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    lineHeight: 1.4,
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Ce motif figurera officiellement dans le registre des dossiers classés sans suite.
                </div>
              </div>

              
              {/* Champ 3 : Inspecteur & Date */}
              <div className="form-grid-2col" style={{ gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                    Inspecteur vérificateur
                  </label>
                  <input
                    type="text"
                    required
                    value={satisfactionForm.inspecteur}
                    onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, inspecteur: e.target.value }))}
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
                    Date de décision
                  </label>
                  <input
                    type="date"
                    required
                    value={satisfactionForm.dateDecision}
                    onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, dateDecision: e.target.value }))}
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
              </div>

              {/* Champ 4 : Recommandations ou visa d'archivage */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Recommandations finales ou visa d’archivage
                </label>
                <input
                  type="text"
                  value={satisfactionForm.recommandations}
                  onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, recommandations: e.target.value }))}
                  placeholder="Ex : Visa du Directeur provincial pour archivage..."
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

              {/* Boutons d'action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSatisfactionModal(false)}
                  style={{ fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>
                  <CheckCircle size={14} />
                  <span>Valider et classer sans suite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* =========================================================================
          MODALE DE REVIREMENT SUR LE JUGEMENT (DEMANDE DE COMMUNICATION)
          Permet de motiver pourquoi l'évaluation initiale est révisée
          et de joindre la pièce justificative associée à ce revirement.
          ========================================================================= */}
      {showRevirementModal && (
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
            zIndex: 1000,
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
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Modal Header */}
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
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Revenir sur le Jugement de la Demande
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Enregistrer le motif et le document officiel justifiant ce revirement de situation
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowRevirementModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRevirementSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Champ 1 : Motif du revirement */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Motif associé à ce revirement de situation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={revirementForm.motif}
                  onChange={(e) => setRevirementForm((prev) => ({ ...prev, motif: e.target.value }))}
                  placeholder="Détailler les nouveaux éléments, la régularisation spontanée ou la contestation juridique qui motive ce revirement..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    lineHeight: 1.4,
                  }}
                />
              </div>

              {/* Champ 2 : Document / Justificatif associé */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Document associé au revirement de situation *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    value={revirementForm.documentNom}
                    onChange={(e) => setRevirementForm((prev) => ({ ...prev, documentNom: e.target.value }))}
                    placeholder="Intitulé ou référence de la pièce (ex: Attestation bancaire complémentaire, Arrêté DGDA)..."
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
                  <label
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      border: '1px dashed var(--color-border)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-bg)',
                      cursor: 'pointer',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <Upload size={14} color="var(--color-text-muted)" />
                    <span style={{ fontSize: '12px', color: revirementForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {revirementForm.pdfFile ? `${revirementForm.pdfFile.name} (${revirementForm.pdfFile.size})` : 'Cliquer pour joindre un justificatif...'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setRevirementForm((prev) => ({
                            ...prev,
                            documentNom: prev.documentNom || file.name,
                            pdfFile: { name: file.name, size: `${Math.round(file.size / 1024)} Ko` },
                          }));
                        }
                      }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>

              {/* Champ 3 : Inspecteur & Date */}
              <div className="form-grid-2col" style={{ gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                    Inspecteur rapporteur
                  </label>
                  <input
                    type="text"
                    required
                    value={revirementForm.inspecteur}
                    onChange={(e) => setRevirementForm((prev) => ({ ...prev, inspecteur: e.target.value }))}
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
                    Date de revirement
                  </label>
                  <input
                    type="date"
                    required
                    value={revirementForm.dateRevirement}
                    onChange={(e) => setRevirementForm((prev) => ({ ...prev, dateRevirement: e.target.value }))}
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
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRevirementModal(false)}
                  style={{ fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>
                  <RotateCcw size={13} />
                  <span>Acter le revirement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}
    </div>
  );
};
