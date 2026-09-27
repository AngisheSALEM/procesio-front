import React, { useState } from 'react';
import {
  Download,
  Upload,
  Plus,
  X,
  CheckCircle,
  Scale,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import type { FeuilleObservation, UserAccount } from '../types';
import type { DossierTabId } from './DossierHeader';
import { formatDate } from '../utils/dateUtils';

interface FeuilleObservationViewProps {
  feuilles?: FeuilleObservation[];
  initialFeuille?: FeuilleObservation | null;
  currentUser?: UserAccount;
  dossierNom?: string;
  onNavigateTab?: (tab: DossierTabId) => void;
  onSaveFeuille?: (feuille: FeuilleObservation) => void;
  onAddFeuille?: (feuille: FeuilleObservation) => void;
  onLancerPv?: (pvData: { reference: string; date: string; motif: string; infractions: string[] }) => void;
  hasPv?: boolean;
}

export const FeuilleObservationView: React.FC<FeuilleObservationViewProps> = ({
  feuilles,
  initialFeuille,
  currentUser,
  dossierNom,
  onNavigateTab,
  onSaveFeuille,
  onAddFeuille,
  onLancerPv,
  hasPv = false,
}) => {
  const feuillesList = (feuilles && feuilles.length > 0)
    ? feuilles
    : (initialFeuille ? [initialFeuille] : []);

  // null = vue cartes (liste), string = id de la feuille affichée en détail
  const [selectedFeuilleId, setSelectedFeuilleId] = useState<string | null>(null);

  const feuille = selectedFeuilleId
    ? (feuillesList.find((f) => f.id === selectedFeuilleId) || null)
    : null;

  const defaultAuteur = currentUser
    ? `${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`
    : (feuille?.inspecteurs?.[0] || 'Inspecteur Marc Kabamba');

  // Modale de création feuille d'observation
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modale pour dresser un PV d'infraction
  const [showPvModal, setShowPvModal] = useState(false);

  // État du formulaire épuré : STRICTEMENT 5 champs
  const [createForm, setCreateForm] = useState({
    inspecteur: defaultAuteur,
    destinataire: feuille?.destinataire || dossierNom || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
    objet: feuille?.objetControle || 'Vérification de la valeur transactionnelle et assiette taxable du fret CIF',
    auditionPrevue: feuille?.dateReunionCloturePrevue || '2026-10-20',
    pdfFile: null as { name: string; size: string } | null,
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.destinataire.trim() || !createForm.objet.trim()) {
      alert('Veuillez remplir l’entreprise destinataire et l’objet.');
      return;
    }

    const newId = `fo-${Date.now()}`;
    const newFeuille: FeuilleObservation = {
      id: newId,
      dossierId: feuille?.dossierId || 'dossier-0842',
      dateRedaction: new Date().toISOString().split('T')[0],
      statutFeuille: 'NOTIFIEE',
      reference: `DGDA/DRK/FO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      inspecteurs: [createForm.inspecteur],
      destinataire: createForm.destinataire,
      objetControle: createForm.objet,
      cadreLegal: feuille?.cadreLegal || 'Code des douanes - Contrôle différé et a posteriori',
      observations: [],
      dateReunionCloturePrevue: createForm.auditionPrevue,
      pdfSourceNom: createForm.pdfFile ? createForm.pdfFile.name : 'feuille_observation_signee.pdf',
    };

    if (onAddFeuille) {
      onAddFeuille(newFeuille);
    } else if (onSaveFeuille) {
      onSaveFeuille(newFeuille);
    }
    setSelectedFeuilleId(newId);
    setShowCreateModal(false);
    showToast('Nouvelle feuille d’observation créée avec succès.');
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

  const handlePvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvForm.reference.trim() || !pvForm.infractions.trim()) {
      alert('Veuillez renseigner la référence du PV et les infractions constatées.');
      return;
    }

    if (feuille) {
      const updatedFeuille: FeuilleObservation = {
        ...feuille,
        statutFeuille: 'CLOTUREE',
        decisionFinale: 'PV_INFRACTION_GLEC',
        pvInfractionGlec: {
          reference: pvForm.reference,
          date: pvForm.date,
          infractions: [pvForm.infractions],
          droitsEludesUSD: 45000,
          droitsEludesCDF: 125000000,
          amendeUSD: 90000,
          inspecteurs: [pvForm.inspecteurs],
          statutTransmission: 'TRANSMIS_GLEC',
        },
      };
      onSaveFeuille?.(updatedFeuille);
    }

    onLancerPv?.({
      reference: pvForm.reference,
      date: pvForm.date,
      motif: pvForm.destination,
      infractions: [pvForm.infractions],
    });
    setShowPvModal(false);
    showToast('Procès-verbal d’infraction dressé avec succès. L’onglet "PV" est désormais accessible.');
  };

  const renderCreateModal = () => (
    <div
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
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
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
              Audition contradictoire prévue
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
              Document PDF notifié
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
              }}
            >
              <Upload size={14} color="var(--color-text-muted)" />
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flex: 1 }}
              />
            </div>
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
              Créer la feuille d’observation
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // =========================================================================
  // 1. PAGE DES CARTES : AFFICHAGE EN CARTES DE TOUTES LES FEUILLES D'OBSERVATION
  // =========================================================================
  if (!feuille) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
                destinataire: dossierNom || 'CONGO MINING & CHEMICAL LOGISTICS SAS',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
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
                {feuille.destinataire}
              </span>
            </p>

            {/* Inspecteur vérificateur : SANS ICÔNE */}
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Objet du contrôle */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
              Objet du contrôle
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {feuille.objetControle}
            </p>
          </div>

          {/* 2. Audition contradictoire prévue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: 'transparent',
              borderRadius: '6px',
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

          {/* 3. Document PDF notifié */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' }}>
              Feuille d’observation notifiée 
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
                    {feuille.pdfSourceNom || "AUCUNE FEUILLE D'OBSERVATION "}
                  </div>
                  
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => showToast('Téléchargement du document notifié...')}
              >
                <Download size={13} />
                
              </button>
            </div>
          </div>

          {/* 4. Constats résumés (Présentation aérée sans cards superflues) */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '8px' }}>
              Constats formulés ({feuille.observations?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {feuille.observations?.map((obs) => (
                <div
                  key={obs.code}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '6px',
                    border: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Constat {obs.code} : {obs.titre}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {obs.statutConstat === 'MAINTENU_CONTENTIEUX' ? 'Maintenu contentieux' : 'En examen'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {obs.faitsConstates}
                  </p>
                </div>
              ))}
            </div>
          </div>

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
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (feuille) {
                  const updated: FeuilleObservation = { ...feuille, statutFeuille: 'CLOTUREE' };
                  onSaveFeuille?.(updated);
                }
                showToast('Observations clôturées après contradictoire.');
              }}
              style={{ fontSize: '12px' }}
            >
              <CheckCircle size={14} />
              <span>Valider la clôture du contradictoire</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
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
              style={{
                fontSize: '12px',
                backgroundColor: hasPv ? 'var(--color-surface-elevated)' : undefined,
                color: hasPv ? 'var(--color-accent)' : undefined,
              }}
            >
              <Scale size={13} />
              <span>{hasPv ? 'Mettre à jour le procès-verbal' : 'Dresser un procès-verbal d’infraction (PV)'}</span>
            </button>

            {hasPv && (
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
        <div
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
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '560px',
              overflow: 'hidden',
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

              {/* Champ 4 : Audition contradictoire prévue */}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  <Upload size={14} color="var(--color-text-muted)" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flex: 1 }}
                  />
                </div>
                {createForm.pdfFile && (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Document prêt : {createForm.pdfFile.name} ({createForm.pdfFile.size})
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
                <button type="submit" className="btn-primary">
                  Créer la feuille d’observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE POUR DRESSER UN PROCÈS-VERBAL D'INFRACTION (PV)
          Strictement 5 champs clairs
          ========================================================================= */}
      {showPvModal && (
        <div
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
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '560px',
              overflow: 'hidden',
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
              {/* Champ 1 : Référence du PV */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Référence officielle du Procès-Verbal
                </label>
                <input
                  type="text"
                  required
                  value={pvForm.reference}
                  onChange={(e) => setPvForm({ ...pvForm, reference: e.target.value })}
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

              {/* Champ 2 : Date d'établissement */}
              <div>
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
              </div>

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
                <button type="submit" className="btn-primary">
                  Dresser le procès-verbal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
