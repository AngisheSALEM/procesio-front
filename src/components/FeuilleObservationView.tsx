import React, { useState } from 'react';
import {
  Download,
  Upload,
  Plus,
  X,
  CheckCircle,
  Scale,
  FolderOpen,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import type { FeuilleObservation, UserAccount } from '../types';
import type { DossierTabId } from './DossierHeader';
import { formatDate } from '../utils/dateUtils';
import { ModalPortal } from './common/ModalPortal';

const fileSizeLabel = (file: File) => `${Math.round(file.size / 1024)} Ko`;

interface FeuilleObservationViewProps {
  dossierId?: string;
  feuilles?: FeuilleObservation[];
  initialFeuille?: FeuilleObservation | null;
  currentUser?: UserAccount;
  dossierNom?: string;
  onNavigateTab?: (tab: DossierTabId) => void;
  onSaveFeuille?: (feuille: FeuilleObservation, file?: File) => Promise<void>;
  onAddFeuille?: (feuille: FeuilleObservation, file?: File) => Promise<void>;
  onLancerPv?: (pvData: { reference: string; date: string; motif: string; infractions: string[] }) => void;
  onCloturerSansSuite?: (motif: string) => void;
  onRevirementJugement?: (motif: string, docNom?: string) => void;
  hasPv?: boolean;
}

export const FeuilleObservationView: React.FC<FeuilleObservationViewProps> = ({
  dossierId,
  feuilles,
  initialFeuille,
  currentUser,
  dossierNom,
  onNavigateTab,
  onSaveFeuille,
  onAddFeuille,
  hasPv = false,
}) => {
  const feuillesList = (feuilles && feuilles.length > 0)
    ? feuilles
    : (initialFeuille ? [initialFeuille] : []);

  // null = vue cartes (liste), string = id de la feuille affichée en détail
  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [faitsObservation, setFaitsObservation] = useState('');

  const feuille = selectedFeuilleId
    ? (feuillesList.find((f) => f.id === selectedFeuilleId) || null)
    : null;

  const defaultAuteur = currentUser
    ? `${currentUser.prenom} ${currentUser.nom}`
    : (feuille?.inspecteurs?.[0]?.replace(/^(Inspecteur|Contrôleur|Directeur|Chef de Bureau)\s+/i, '') || '');

  // Modale de création feuille d'observation
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modale pour dresser un PV d'infraction
  const [showPvModal, setShowPvModal] = useState(false);

  // Modale de satisfaction & clôture sans suite
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [satisfactionForm, setSatisfactionForm] = useState({
    inspecteur: defaultAuteur,
    dateDecision: new Date().toISOString().split('T')[0],
    motif: 'Les justifications complémentaires et quittances authentiques présentées lors de l’audition contradictoire dissipent les présomptions d’infraction. Déclarations reconnues conformes.',
    decision: 'CLASSE_SANS_SUITE' as const,
    recommandations: 'Rapport contradictoire de clôture sans suite validé. Clôture définitive et archivage sans poursuite.',
  });

  const handleSatisfactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('Le classement exige une décision proposée et validée dans l’API.');
  };

  // Modale de revirement sur le jugement (Feuille d'observation)
  const [showRevirementModal, setShowRevirementModal] = useState(false);
  const [revirementForm, setRevirementForm] = useState({
    inspecteur: defaultAuteur,
    dateRevirement: new Date().toISOString().split('T')[0],
    motif: '',
    documentNom: '',
    pdfFile: null as File | null,
  });

  const handleRevirementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('La révision du jugement n’est pas disponible dans ce parcours.');
  };

  // État du formulaire épuré : avec type de cible, agissant pour le compte de et adresse
  const [createForm, setCreateForm] = useState({
    inspecteur: defaultAuteur,
    destinataire: feuille?.destinataire || dossierNom || '',
    typeCible: 'Entreprise commerciale',
    pourLeCompteDe: '',
    adresse: feuille?.adresse || '',
    objet: feuille?.objetControle || '',
    auditionPrevue: feuille?.dateReunionCloturePrevue || '2026-10-20',
    pdfFile: null as File | null,
  });

  // Formulaire PV d'infraction : STRICTEMENT 5 champs
  const [pvForm, setPvForm] = useState({
    reference: `DGDA/DRK/PV-INF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    inspecteurs: feuille?.inspecteurs?.join(', ') || defaultAuteur,
    infractions: 'Minoration de la valeur en douane taxable et carence de justificatifs probants (Articles 356 et 357 du Code des douanes)',
    destination: 'Transmission à la Division Contentieuse et Parquet près le Tribunal de Grande Instance',
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.destinataire.trim() || !createForm.objet.trim() || !faitsObservation.trim() || !dossierId || isSaving) {
      setActionError('Renseignez le destinataire, l’objet et les faits observés.');
      return;
    }

    const newId = `fo-${Date.now()}`;
    const newFeuille: FeuilleObservation = {
      id: newId,
      dossierId,
      dateRedaction: new Date().toISOString().split('T')[0],
      statutFeuille: 'BROUILLON',
      reference: `DGDA/DRK/FO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      inspecteurs: [createForm.inspecteur],
      destinataire: createForm.destinataire,
      typeCible: createForm.typeCible,
      pourLeCompteDe: createForm.pourLeCompteDe.trim() || undefined,
      adresse: createForm.adresse.trim(),
      objetControle: createForm.objet,
      cadreLegal: feuille?.cadreLegal || 'Code des douanes - Contrôle différé et a posteriori',
      observations: [{
        code: 'O1',
        titre: createForm.objet.trim(),
        faitsConstates: faitsObservation.trim(),
        justificatifsAssocies: [],
        referencesJuridiques: '',
        questionsAssujetti: '',
        statutConstat: 'OUVERT',
        analyseMotivee: '',
      }],
      dateReunionCloturePrevue: createForm.auditionPrevue,
      pdfSourceNom: createForm.pdfFile?.name,
    };
    setIsSaving(true);
    setActionError(null);
    try {
      if (onAddFeuille) await onAddFeuille(newFeuille, createForm.pdfFile || undefined);
      else if (onSaveFeuille) await onSaveFeuille(newFeuille, createForm.pdfFile || undefined);
      else throw new Error('Création de feuille indisponible.');
      setShowCreateModal(false);
      setFaitsObservation('');
      showToast('Projet de feuille d’observation enregistré.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateForm((prev) => ({
        ...prev,
        pdfFile: file,
      }));
    }
  };

  const handlePvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('La création d’un PV officiel n’est pas prise en charge par cette API.');
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
            Nouvelle Feuille d'Observation
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
              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Inspecteur vérificateur
            </label>
            <input
              type="text"
              required
              value={createForm.inspecteur}
              onChange={(e) => setCreateForm({ ...createForm, inspecteur: e.target.value })}
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

          {/* Type de cible & Pour le compte de */}
          <div className="form-grid-2col" style={{ gap: '12px' }}>
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

          {/* Adresse de l'entité */}
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

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Objet du contrôle
            </label>
            <textarea
              rows={3}
              required
              placeholder="Précisez l'objet des vérifications..."
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
              Faits observés *
            </label>
            <textarea required rows={3} value={faitsObservation} onChange={(e) => setFaitsObservation(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '12px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-btn)', color: 'var(--color-text-primary)', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Réunion contradictoire prévue
            </label>
            <input
              type="date"
              required
              value={createForm.auditionPrevue}
              onChange={(e) => setCreateForm({ ...createForm, auditionPrevue: e.target.value })}
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
              Document PDF associé au projet
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
                {createForm.pdfFile ? `${createForm.pdfFile.name} (${fileSizeLabel(createForm.pdfFile)})` : 'Cliquer pour choisir un document PDF...'}
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
                Document prêt : {createForm.pdfFile.name} ({fileSizeLabel(createForm.pdfFile)})
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
            <button type="submit" disabled={isSaving} className="btn-primary">
              Créer la feuille d’observation
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );

  // =========================================================================
  // 1. PAGE DES CARTES : AFFICHAGE EN CARTES DE TOUTES LES FEUILLES D'OBSERVATION
  // =========================================================================
  if (!feuille) {
    return (
      <div key="feuille-cards-list" className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
                Feuilles d'observation
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
                {feuillesList.length} au total
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Phase contradictoire et formulation des constats d'infraction
            </p> */}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCreateForm({
                inspecteur: defaultAuteur,
                destinataire: dossierNom || '',
                typeCible: 'Entreprise commerciale',
                pourLeCompteDe: '',
                adresse: '04 Avenue des Métaux, Quartier Industriel, Lubumbashi',
                objet: '',
                auditionPrevue: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
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
            <span>Nouvelle feuille</span>
          </button>
        </div>

        {/* Grille des cartes des feuilles d'observation */}
        {feuillesList.length === 0 ? (
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
            <p style={{ fontSize: '13px', margin: 0 }}>Aucune feuille d'observation enregistrée pour ce dossier.</p>
          </div>
        ) : (
          <div className="cards-grid-auto">
            {feuillesList.map((item) => {
              const hasPvAttached = Boolean(item.pvInfractionGlec || item.decisionFinale === 'PV_INFRACTION_GLEC');

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeuilleId(item.id)}
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
                          {item.destinataire || dossierNom || 'Entreprise contrôlée'}
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
                        {hasPvAttached ? 'PV dressé' : 'Contradictoire en cours'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Objet du contrôle
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
                        {item.objetControle}
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
                      Audition prévue : <span className="font-sf" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(item.dateReunionCloturePrevue)}</span>
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
  // 2. PAGE DÉTAIL D'UNE FEUILLE D'OBSERVATION SÉLECTIONNÉE
  // =========================================================================
  const isPvLance = Boolean(hasPv || feuille.decisionFinale === 'PV_INFRACTION_GLEC' || feuille.pvInfractionGlec);

  return (
    <div key={`feuille-detail-${feuille.id}`} className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
          onClick={() => setSelectedFeuilleId(null)}
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
          <span>Retour à toutes les feuilles d'observation</span>
        </button>
      </div>

      {/* =========================================================================
          PAGE INFO ÉPURÉE : FEUILLE D'OBSERVATION SÉLECTIONNÉE
          ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* En-tête de la Page Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '10px',
          }}
        >
          <div>
            {/* Destinataire : Nom de l'entreprise en GRAS */}
            <p
              style={{
                color: 'var(--color-text-primary)',
                marginTop: '2px',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Destinataire :
              </span>{' '}
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                {feuille.destinataire}
              </span>
            </p>

            {/* Type de cible & Pour le compte de : SANS BORDER, SANS BACKGROUND COLOR, SANS ICÔNE */}
            <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--color-text-secondary)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Type de cible : </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {feuille.typeCible || 'Entreprise commerciale'}
              </span>
              {feuille.pourLeCompteDe && (
                <span style={{ marginLeft: '6px', color: 'var(--color-text-muted)' }}>
                  (Agissant pour le compte de : <span style={{ color: 'var(--color-text-primary)' }}>{feuille.pourLeCompteDe}</span>)
                </span>
              )}
            </div>

            {/* Adresse : SANS BORDER, SANS BACKGROUND COLOR, SANS ICÔNE */}
            {(feuille.adresse || dossierNom) && (
              <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Adresse : </span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {feuille.adresse || ''}
                </span>
              </div>
            )}

            {/* Inspecteur vérificateur : SANS ICÔNE */}
            <div style={{ fontSize: '12px', marginTop: '2px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Inspecteur vérificateur : </span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                {feuille.inspecteurs?.join(', ') || defaultAuteur}
              </span>
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
              {isPvLance ? 'PV dressé' : 'Contradictoire en cours'}
            </span>
          </div>
        </div>

        {/* Corps simplifié de la Page Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Objet du contrôle */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Objet du contrôle
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              {feuille.objetControle}
            </p>
          </div>

          {/* 2. Audition contradictoire prévue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px 0',
              backgroundColor: 'transparent',
              border: "none",
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {isPvLance ? 'Audition contradictoire passée le : ' : 'Date d’audition prévue : '}
              <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {formatDate(feuille.dateReunionCloturePrevue)}
              </strong>
            </div>
          </div>

          {/* 3. Document PDF associé au projet */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '4px' }}>
              Feuille d’observation notifiée 
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {feuille.pdfSourceNom || 'Aucun document joint'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                disabled
                style={{ fontSize: '11px', padding: '5px 10px' }}
                title="Téléchargement indisponible dans ce parcours"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* 4. Constats résumés (Présentation aérée sans cards superflues) */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '4px' }}>
              Constats formulés ({feuille.observations?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {feuille.observations?.map((obs) => (
                <div
                  key={obs.code}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '6px',
                    border: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Constat {obs.code} : {obs.titre}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                    {obs.faitsConstates}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {feuille?.decisionFinale === 'CLASSE_SANS_SUITE' && (
              <div
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-muted)',
                  border: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  <CheckCircle size={14} color="var(--color-text-primary)" />
                  <span>Observations satisfaites — Feuille clôturée sans suite</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Motif de satisfaction : </span>
                  {feuille.motifSatisfaction || 'Motif indisponible.'}
                </div>
              </div>
            )}

          {/* 5. Actions d'instruction simples */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            {!hasPv && !feuille?.decisionFinale && !feuille?.pvInfractionGlec ? (
              /* ÉTAT INITIAL SANS JUGEMENT : BOUTONS DE JUGEMENT DISPONIBLES */
              <>
                <button
                  type="button"
                  className="btn-primary"
                  disabled
                  title="Une décision validée est nécessaire pour le classement"
                  onClick={() => {
                    setSatisfactionForm((prev) => ({
                      ...prev,
                      inspecteur: feuille?.inspecteurs?.[0] || defaultAuteur,
                      motif: feuille?.motifSatisfaction || prev.motif,
                    }));
                    setShowSatisfactionModal(true);
                  }}
                  style={{ fontSize: '12px' }}
                >
                  <CheckCircle size={14} />
                  <span>Classement via décision indisponible ici</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled
                  title="La création de PV officiel n’est pas prise en charge"
                  onClick={() => {
                    setPvForm({
                      reference: `DGDA/DRK/PV-INF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
                      date: new Date().toISOString().split('T')[0],
                      inspecteurs: feuille?.inspecteurs?.join(', ') || defaultAuteur,
                      infractions: 'Minoration de la valeur en douane taxable et carence de justificatifs probants (Articles 356 et 357 du Code des douanes)',
                      destination: 'Transmission à la Division Contentieuse et Parquet près le Tribunal de Grande Instance',
                    });
                    setShowPvModal(true);
                  }}
                  style={{ fontSize: '12px' }}
                >
                  <Scale size={13} />
                  <span>PV officiel indisponible</span>
                </button>
              </>
            ) : (
              /* DÈS QU'UN JUGEMENT EST RENDU (PV DRESSÉ OU CLASSÉ SANS SUITE) : LES BOUTONS DE JUGEMENT DISPARAISSENT */
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCreateForm({
                      inspecteur: defaultAuteur,
                      destinataire: feuille?.destinataire || dossierNom || '',
                      typeCible: feuille?.typeCible || 'Entreprise commerciale',
                      pourLeCompteDe: feuille?.pourLeCompteDe || '',
                      adresse: feuille?.adresse || '',
                      objet: '',
                      auditionPrevue: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                      pdfFile: null,
                    });
                    setShowCreateModal(true);
                  }}
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={13} />
                  <span>Nouvelle feuille d’observation</span>
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  disabled
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
                  title="Revenir sur le jugement suite à de nouveaux éléments ou une régularisation"
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-btn)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Révision indisponible</span>
                </button>

                {(hasPv || feuille?.decisionFinale === 'PV_INFRACTION_GLEC' || feuille?.pvInfractionGlec) && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onNavigateTab?.('documents')}
                    style={{
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <FolderOpen size={13} />
                    <span>Consulter le PV</span>
                  </button>
                )}
              </>
            )}

            
          </div>
          
        </div>
      </div>

      {/* =========================================================================
          MODALE DE CRÉATION : STRICTEMENT 5 CHAMPS
          1. Nom de l'inspecteur vérificateur
          2. Destinataire ou entreprise cible
          3. Objet
          4. Audition contradictoire prévue
          5. Champ du fichier PDF
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
                Créer une Feuille d'Observation
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
              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
              {/* Champ 1 : Nom de l'inspecteur vérificateur */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Nom de l'inspecteur vérificateur
                </label>
                <input
                  type="text"
                  required
                  value={createForm.inspecteur}
                  onChange={(e) => setCreateForm({ ...createForm, inspecteur: e.target.value })}
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

              {/* Champ 2 : Destinataire ou entreprise cible */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Destinataire ou entreprise cible
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

              {/* Champ 3 : Objet du contrôle */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Objet du contrôle
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Précisez l'objet des vérifications..."
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
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Faits observés *</label>
                <textarea required rows={3} value={faitsObservation} onChange={(e) => setFaitsObservation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-btn)', color: 'var(--color-text-primary)', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {/* Champ 4 : Réunion contradictoire prévue */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Audition contradictoire prévue (Date)
                </label>
                <input
                  type="date"
                  required
                  value={createForm.auditionPrevue}
                  onChange={(e) => setCreateForm({ ...createForm, auditionPrevue: e.target.value })}
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
                  <span style={{ fontSize: '12px', color: createForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {createForm.pdfFile ? `${createForm.pdfFile.name} (${fileSizeLabel(createForm.pdfFile)})` : 'Cliquer pour choisir un document PDF...'}
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
                    Document prêt : {createForm.pdfFile.name} ({fileSizeLabel(createForm.pdfFile)})
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  Créer la feuille d’observation
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* =========================================================================
          MODALE POUR DRESSER UN PROCÈS-VERBAL D'INFRACTION (PV)
          Strictement 5 champs clairs
          ========================================================================= */}
      {showPvModal && (
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
                Dresser un Procès-Verbal d'Infraction (PV)
              </h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPvModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePvSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}

             
              {/* Champ 2 : Date d'établissement */}
              {/* <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Date d’établissement
                </label>
                <input
                  type="date"
                  required
                  value={pvForm.date}
                  onChange={(e) => setPvForm({ ...pvForm, date: e.target.value })}
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
              </div> */}

              {/* Champ 3 : Inspecteurs verbalisateurs */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Inspecteurs verbalisateurs
                </label>
                <input
                  type="text"
                  required
                  value={pvForm.inspecteurs}
                  onChange={(e) => setPvForm({ ...pvForm, inspecteurs: e.target.value })}
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

              {/* Champ 4 : Infractions constatées */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Infractions constatées & Base légale
                </label>
                <textarea
                  rows={3}
                  required
                  value={pvForm.infractions}
                  onChange={(e) => setPvForm({ ...pvForm, infractions: e.target.value })}
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

              {/* Champ 5 : Orientation & Parquet */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Orientation & Mesures conservatoires
                </label>
                <input
                  type="text"
                  required
                  value={pvForm.destination}
                  onChange={(e) => setPvForm({ ...pvForm, destination: e.target.value })}
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

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowPvModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  Dresser le procès-verbal
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}
      {/* =========================================================================
          MODALE DE SATISFACTION & CLÔTURE SANS SUITE (FEUILLE D'OBSERVATION)
          Permet de motiver pourquoi les observations sont satisfaites
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
                  Satisfaction des Observations & Clôture sans Suite
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Définir le motif qui justifie que les explications contradictoires sont satisfaites
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
              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
              {/* Champ 1 : Motif de satisfaction */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Motif de satisfaction & Justification de la clôture sans suite *
                </label>
                <textarea
                  required
                  rows={4}
                  value={satisfactionForm.motif}
                  onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, motif: e.target.value }))}
                  placeholder="Détailler pourquoi les explications de l'opérateur et les pièces justificatives sont retenues comme satisfaisantes..."
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
                  Ce motif clôt le contradictoire et sera reporté dans le suivi des dossiers classés sans suite.
                </div>
              </div>

              {/* Champ 2 : Décision de clôture */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
                  Issue du contradictoire
                </label>
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={14} color="var(--color-text-primary)" />
                  <span>Classement sans suite — Aucune infraction retenue (Pas de PV)</span>
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
                    Date de clôture
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
                  Recommandations finales ou visa de clôture
                </label>
                <input
                  type="text"
                  value={satisfactionForm.recommandations}
                  onChange={(e) => setSatisfactionForm((prev) => ({ ...prev, recommandations: e.target.value }))}
                  placeholder="Ex : Visa de clôture définitive de la Division..."
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

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSatisfactionModal(false)}
                  style={{ fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary" style={{ fontSize: '12px' }}>
                  <CheckCircle size={14} />
                  <span>Valider et classer sans suite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* MODAL : Revirement sur le jugement (Feuille d'observation) */}
      {showRevirementModal && (
        <ModalPortal>
          <div
            className="modal-backdrop-responsive"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowRevirementModal(false)}
        >
          <div
            className="modal-card-responsive"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevation)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RotateCcw size={16} color="var(--color-text-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Revirement de situation sur le jugement
                  </h3>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--color-text-muted)' }}>
                    Réexamen des observations contradictoires suite à de nouveaux éléments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevirementModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire de revirement */}
            <form onSubmit={handleRevirementSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
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
                  placeholder="Expliquez avec précision les faits nouveaux, incohérences ou justifications justifiant ce revirement de jugement..."
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
                    placeholder="Intitulé ou référence de la pièce (ex: Nouveau rapport d'expertise, Quittance contestée)..."
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
                      {revirementForm.pdfFile ? `${revirementForm.pdfFile.name} (${fileSizeLabel(revirementForm.pdfFile)})` : 'Cliquer pour joindre un justificatif...'}
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
                            pdfFile: file,
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
                <button type="submit" disabled={isSaving} className="btn-primary" style={{ fontSize: '12px' }}>
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
