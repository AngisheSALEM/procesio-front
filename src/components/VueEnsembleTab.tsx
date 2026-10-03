import React, { useState } from 'react';
import {
  Plus,
  Upload,
  X,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import type { DossierEnquete, DemandeCommunication, FeuilleObservation, UserAccount, PvDetail } from '../types';
import { formatDate } from '../utils/dateUtils';
import { ModalPortal } from './common/ModalPortal';
import { DecisionsGelecSection } from './decisions/DecisionsGelecSection';
import type { WorkspaceData } from '../api/workspace';

interface VueEnsembleTabProps {
  dossier: DossierEnquete;
  demandes?: DemandeCommunication[];
  demande?: DemandeCommunication | null;
  feuilles?: FeuilleObservation[];
  feuille?: FeuilleObservation | null;
  pvs?: PvDetail[];
  onGoToDemandes: () => void;
  onGoToObservations: () => void;
  onGoToPvs?: () => void;
  onSaveDemande?: (demande: DemandeCommunication) => void;
  onSaveFeuille?: (feuille: FeuilleObservation) => void;
  onCloturerSansSuite?: (motif: string) => void;
  currentUser?: UserAccount;
  workspace?: WorkspaceData | null;
  onRefresh?: () => Promise<unknown>;
  canUpdate?: boolean;
}

export const VueEnsembleTab: React.FC<VueEnsembleTabProps> = ({
  dossier,
  demandes,
  demande,
  feuilles,
  feuille,
  pvs,
  onGoToDemandes,
  onGoToObservations,
  onGoToPvs,
  onSaveDemande,
  onSaveFeuille,
  onCloturerSansSuite: _onCloturerSansSuite,
  currentUser,
  workspace = null,
  onRefresh,
  canUpdate = true,
}) => {
  const demandesList = (demandes && demandes.length > 0)
    ? demandes
    : (demande ? [demande] : []);
  const dernierDemande = demandesList.length > 0 ? demandesList[demandesList.length - 1] : null;

  const feuillesList = (feuilles && feuilles.length > 0)
    ? feuilles
    : (feuille ? [feuille] : []);
  const dernierFeuille = feuillesList.length > 0 ? feuillesList[feuillesList.length - 1] : null;

  const pvsList = pvs || [];
  const dernierPv = pvsList.length > 0 ? pvsList[pvsList.length - 1] : null;

  const defaultAuteur = currentUser
    ? `${currentUser.grade} ${currentUser.prenom} ${currentUser.nom}`
    : 'Inspecteur Marc Kabamba';

  // Modales épurées (formulaire 5 champs)
  const [showDemandeModal, setShowDemandeModal] = useState(false);
  const [showFeuilleModal, setShowFeuilleModal] = useState(false);

  // Formulaire Demande : strictement 5 champs
  const [demandeForm, setDemandeForm] = useState({
    auteur: dernierDemande?.auteur || defaultAuteur,
    destinataire: dernierDemande?.destinataire?.nom || dossier.entiteControlee.nom,
    echeance: dernierDemande?.echeanceReponse || '2026-10-15',
    objet: dernierDemande?.objet || 'Communication des factures de fret maritime et relevés bancaires CIF',
    pdfFile: null as { name: string; size: string } | null,
  });

  // Formulaire Feuille : strictement 5 champs
  const [feuilleForm, setFeuilleForm] = useState({
    inspecteur: dernierFeuille?.inspecteurs?.[0] || defaultAuteur,
    destinataire: dernierFeuille?.destinataire || dossier.entiteControlee.nom,
    objet: dernierFeuille?.objetControle || 'Constatations relatives aux minorations de fret et valeur en douane',
    auditionPrevue: dernierFeuille?.dateReunionCloturePrevue || '2026-10-22',
    pdfFile: null as { name: string; size: string } | null,
  });

  const handleDemandeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DemandeCommunication = {
      id: demande?.id || `demande-${Date.now()}`,
      reference: demande?.reference || `DGDA/DRK/ENQ/DC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      dossierId: dossier.id,
      redacteur: demandeForm.auteur,
      auteur: demandeForm.auteur,
      dateEmission: demande?.dateEmission || new Date().toISOString().split('T')[0],
      echeanceReponse: demandeForm.echeance,
      objet: demandeForm.objet,
      signataireHabilite: demande?.signataireHabilite || 'Directeur Provincial DGDA',
      gradeSignataire: demande?.gradeSignataire || 'Commandement',
      baseLegale: 'Code des douanes, Article 46',
      modaliteRemise: 'Voie sécurisée',
      commentairesInternes: '',
      destinataire: {
        nom: demandeForm.destinataire,
        qualite: dossier.entiteControlee.typeEntite || 'Entreprise contrôlée',
        adresse: dossier.entiteControlee.adresse || '',
      },
      statut: demande?.statut || 'EMISE',
      elementsDemandes: demande?.elementsDemandes || [
        {
          id: 'EL-01',
          libelle: 'Connaissements maritimes (Bill of Lading) signés',
          periodeConcernee: 'Exercice 2025',
          motifExigence: 'Contrôle du fret CIF réel acquitté',
          statutRemise: 'EN_ATTENTE',
        },
        {
          id: 'EL-02',
          libelle: 'Factures d’assurance maritime et surestaries',
          periodeConcernee: 'Exercice 2025',
          motifExigence: 'Intégration dans la valeur imposable',
          statutRemise: 'EN_ATTENTE',
        },
      ],
      reponsesRecues: demande?.reponsesRecues || [],
      pdfSourceNom: demandeForm.pdfFile ? demandeForm.pdfFile.name : (demande?.pdfSourceNom || 'Requisition_Fret_Officielle.pdf'),
      pdfSourceTaille: demandeForm.pdfFile ? demandeForm.pdfFile.size : (demande?.pdfSourceTaille || '920 Ko'),
    };

    onSaveDemande?.(updated);
    setShowDemandeModal(false);
  };

  const handleFeuilleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FeuilleObservation = {
      id: feuille?.id || `fo-${Date.now()}`,
      reference: feuille?.reference || `DGDA/DRK/FO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      dossierId: dossier.id,
      dateRedaction: feuille?.dateRedaction || new Date().toISOString().split('T')[0],
      inspecteurs: [feuilleForm.inspecteur],
      destinataire: feuilleForm.destinataire,
      objetControle: feuilleForm.objet,
      cadreLegal: 'Décision DG/DGDA/DG/2011/296 (Articles 44 à 49)',
      dateReunionCloturePrevue: feuilleForm.auditionPrevue,
      statutFeuille: feuille?.statutFeuille || 'NOTIFIEE',
      observations: feuille?.observations || [
        {
          code: 'O1',
          titre: 'Écart de facturation sur fret maritime et assurance CIF',
          faitsConstates: 'Écart constaté entre la déclaration SYDONIA et les connaissements maritimes authentiques.',
          justificatifsAssocies: ['Connaissement maritime', 'Facture armateur'],
          referencesJuridiques: 'Code des douanes, Article 38',
          questionsAssujetti: 'Justifier l’écart sur le montant du fret.',
          statutConstat: 'OUVERT',
          analyseMotivee: 'En attente des explications de l’opérateur.',
        },
      ],
      pdfSourceNom: feuilleForm.pdfFile ? feuilleForm.pdfFile.name : (feuille?.pdfSourceNom || 'Feuille_Observation_Notifiee.pdf'),
    };

    onSaveFeuille?.(updated);
    setShowFeuilleModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
      {/* =========================================================================
          1. BLOC OPÉRATEUR ÉCONOMIQUE CONTRÔLÉ (ÉPURÉ AU MAXIMUM)
          Strictement : Nom (en gras), Adresse, Contacts. Zéro icône parasite.
          ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px',
        }}
      >

         <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
          Object du dossier
        </div>

        {/* object du dossier la seule chose en grand */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginTop: '6px',
            marginBottom: '8px',
          }}
        >
          {dossier.objet}
        </h1>
        <br />
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
          Opérateur 
        </div>
          


        {/* Nom de l'opérateur : SEULE CHOSE EN GRAS */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginTop: '6px',
            marginBottom: '8px',
          }}
        >
          {dossier.entiteControlee.nom}
        </span>
          
        {/* Type de cible & Pour le compte de : SANS BORDER, SANS BG, SANS ICÔNE */}
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Type de cible : </span>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {dossier.entiteControlee.typeCible || dossier.entiteControlee.typeEntite || 'Entreprise commerciale'}
          </span>
          {dossier.entiteControlee.pourLeCompteDe && (
            <span style={{ marginLeft: '6px', color: 'var(--color-text-muted)' }}>
              (Agissant pour le compte de : <span style={{ color: 'var(--color-text-primary)' }}>{dossier.entiteControlee.pourLeCompteDe}</span>)
            </span>
          )}
        </div>

        {/* Adresse & Contact sans icônes ni bordures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Adresse : </span>
            <span style={{ color: 'var(--color-text-primary)' }}>{dossier.entiteControlee.adresse}</span>
          </div>
          {dossier.entiteControlee.contact && (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
              Contact : {dossier.entiteControlee.contact}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          STATUT DE CLASSEMENT SANS SUITE (SI LE DOSSIER EST SATISFAIT / CLÔTURÉ)
          ========================================================================= */}
      {dossier.decisionCloture === 'CLASSE_SANS_SUITE' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="var(--color-text-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Dossier classé sans suite — Conformité validée
              </span>
            </div>
            {dossier.dateCloture && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Clôturé le {formatDate(dossier.dateCloture)}
              </span>
            )}
          </div>
          {dossier.motifClassement && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Motif de satisfaction : </span>
              {dossier.motifClassement}
            </div>
          )}
        </div>
      )}

      {/*================================ BLOC D'OBJET DE L ENQUETE ================*/}


     
     

      {/* =========================================================================
          2. CARD DERNIÈRE DEMANDE DE COMMUNICATION
          Objet, Échéance, Statut + Bouton Nouveau (si pas de demande) ou Mettre à jour
          ========================================================================= */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Demande de communication {demandesList.length > 1 ? `(${demandesList.length})` : ''}
            </span>
            {dernierDemande && (
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
                {dernierDemande.statut === 'REPONSE_COMPLETE' || dernierDemande.reponsePdfNom ? 'Réponse reçue' : 'En attente'}
              </span>
            )}
          </div>

          {/* Bouton en haut à droite */}
          {!dernierDemande ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setDemandeForm({
                  auteur: defaultAuteur,
                  destinataire: dossier.entiteControlee.nom,
                  echeance: '2026-10-15',
                  objet: '',
                  pdfFile: null,
                });
                setShowDemandeModal(true);
              }}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <Plus size={14} />
              <span>Nouvelle demande de communication</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDemandeForm({
                    auteur: dernierDemande.auteur || defaultAuteur,
                    destinataire: dernierDemande.destinataire.nom,
                    echeance: dernierDemande.echeanceReponse,
                    objet: dernierDemande.objet || '',
                    pdfFile: null,
                  });
                  setShowDemandeModal(true);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <span>Mettre à jour</span>
              </button> */}
              <button
                type="button"
                className="btn-ghost"
                onClick={onGoToDemandes}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <ExternalLink size={13} />
                <span>{demandesList.length > 1 ? `Voir les demandes (${demandesList.length})` : "Ouvrir l'instruction"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Contenu de la Card Demande */}
        {!dernierDemande ? (
          <div style={{ padding: '16px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Aucune demande de communication pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {/* {demandesList.length > 1 && (
              <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 600 }}>
                Dernière demande émise : <span className="font-sf">{dernierDemande.reference}</span>
              </div>
            )} */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Objet de la demande
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {dernierDemande.objet}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              
              <span>
                Échéance légale :{' '}
                <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {formatDate(dernierDemande.echeanceReponse)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. CARD DERNIÈRE FEUILLE D'OBSERVATION
          Règle formelle : S'il n'y a pas de feuille d'observation, la div N'EXISTE PAS.
          ========================================================================= */}
      {demandesList.length > 0 && dernierFeuille && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Feuille d'observation {feuillesList.length > 1 ? `(${feuillesList.length})` : ''}
              </span>
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
                {dernierFeuille.statutFeuille === 'CLOTUREE' ? 'Feuille clôturée' : 'Contradictoire en cours'}
              </span>
            </div>

            {/* Bouton en haut à droite : Mettre à jour */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFeuilleForm({
                    inspecteur: dernierFeuille.inspecteurs?.[0] || defaultAuteur,
                    destinataire: dernierFeuille.destinataire,
                    objet: dernierFeuille.objetControle,
                    auditionPrevue: dernierFeuille.dateReunionCloturePrevue || '2026-10-22',
                    pdfFile: null,
                  });
                  setShowFeuilleModal(true);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <span>Mettre à jour</span>
              </button> */}
              <button
                type="button"
                className="btn-ghost"
                onClick={onGoToObservations}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <ExternalLink size={13} />
                <span>{feuillesList.length > 1 ? `Voir les feuilles (${feuillesList.length})` : "Ouvrir l'instruction"}</span>
              </button>
            </div>
          </div>

          {/* Contenu simplifié de la feuille */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Objet du contrôle
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {dernierFeuille.objetControle}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              
              <span>
                Audition contradictoire prévue le :{' '}
                <strong className="font-sf" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {formatDate(dernierFeuille.dateReunionCloturePrevue)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. CARD DERNIER PROCÈS-VERBAL (PV)
          Règle formelle : S'il n'y a pas de PV dressé, la div N'EXISTE PAS.
          ========================================================================= */}
      {dernierPv && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Procès-verbal (PV) {pvsList.length > 1 ? `(${pvsList.length})` : ''}
              </span>
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
                {dernierPv.statutPv === 'TRANSMIS_CONTENTIEUX' ? 'Transmis GLEC' : 'Dressé'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onGoToPvs && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onGoToPvs}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <ExternalLink size={13} />
                  <span>{pvsList.length > 1 ? `Voir tous les PV (${pvsList.length})` : 'Consulter le PV'}</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Verbalisé le : <strong className="font-sf" style={{ color: 'var(--color-text-primary)' }}>{formatDate(dernierPv.datePv)}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Infraction constatée
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {dernierPv.infractions[0] || 'Minoration de la valeur en douane taxable'}
                {dernierPv.infractions.length > 1 && ` (+${dernierPv.infractions.length - 1} autre${dernierPv.infractions.length > 2 ? 's' : ''})`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
              <div>
                Droits éludés : <strong className="font-sf" style={{ color: 'var(--color-text-primary)' }}>{dernierPv.droitsEludesUSD.toLocaleString('fr-FR')} USD</strong>
              </div>
              <div>
                Amende légale : <strong className="font-sf" style={{ color: 'var(--color-text-primary)' }}>{dernierPv.amendeUSD.toLocaleString('fr-FR')} USD</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. SECTION DÉCISIONS ADMINISTRATIVES & RELAIS CONTENTIEUX GELEC
          ========================================================================= */}
      {workspace && (
        <DecisionsGelecSection
          caseId={dossier.id}
          workspace={workspace}
          onRefresh={onRefresh}
          canUpdate={canUpdate}
        />
      )}

      {/* =========================================================================
          MODALE FORMULAIRE : DEMANDE DE COMMUNICATION (5 CHAMPS STRICTS)
          ========================================================================= */}
      {showDemandeModal && (
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
                {demande ? 'Mettre à jour la Demande de Communication' : 'Créer une Demande de Communication'}
              </h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowDemandeModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDemandeSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Auteur */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Auteur de la demande
                </label>
                <input
                  type="text"
                  required
                  value={demandeForm.auteur}
                  onChange={(e) => setDemandeForm({ ...demandeForm, auteur: e.target.value })}
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

              {/* 2. Destinataire */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Destinataire (Entreprise / Établissement)
                </label>
                <input
                  type="text"
                  required
                  value={demandeForm.destinataire}
                  onChange={(e) => setDemandeForm({ ...demandeForm, destinataire: e.target.value })}
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

              {/* 3. Échéance */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Échéance légale de réponse
                </label>
                <input
                  type="date"
                  required
                  value={demandeForm.echeance}
                  onChange={(e) => setDemandeForm({ ...demandeForm, echeance: e.target.value })}
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

              {/* 4. Objet de la demande */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Objet de la demande
                </label>
                <textarea
                  rows={3}
                  required
                  value={demandeForm.objet}
                  onChange={(e) => setDemandeForm({ ...demandeForm, objet: e.target.value })}
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

              {/* 5. Document PDF */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  {demande ? 'Mettre à jour le fichier PDF joint' : 'Document PDF joint'}
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
                  <span style={{ fontSize: '12px', color: demandeForm.pdfFile ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {demandeForm.pdfFile ? `${demandeForm.pdfFile.name} (${demandeForm.pdfFile.size})` : 'Cliquer pour choisir un document PDF...'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDemandeForm((prev) => ({
                          ...prev,
                          pdfFile: { name: file.name, size: `${Math.round(file.size / 1024)} Ko` },
                        }));
                      }
                    }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </label>
                {demandeForm.pdfFile ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Nouveau fichier : {demandeForm.pdfFile.name}
                  </div>
                ) : demande?.pdfSourceNom ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Fichier actuel : {demande.pdfSourceNom}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowDemandeModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {demande ? 'Enregistrer les modifications' : 'Créer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* =========================================================================
          MODALE FORMULAIRE : FEUILLE D'OBSERVATION (5 CHAMPS STRICTS)
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
                {feuille ? 'Mettre à jour la Feuille d\'Observation' : 'Créer une Feuille d\'Observation'}
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

            <form onSubmit={handleFeuilleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Inspecteur */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Nom de l'inspecteur vérificateur
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

              {/* 2. Destinataire */}
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

              {/* 3. Objet du contrôle */}
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

              {/* 4. Audition contradictoire prévue */}
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

              {/* 5. Document PDF */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  {feuille ? 'Mettre à jour le fichier PDF notifié' : 'Document PDF des observations'}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFeuilleForm((prev) => ({
                          ...prev,
                          pdfFile: { name: file.name, size: `${Math.round(file.size / 1024)} Ko` },
                        }));
                      }
                    }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </label>
                {feuilleForm.pdfFile ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Nouveau fichier : {feuilleForm.pdfFile.name}
                  </div>
                ) : feuille?.pdfSourceNom ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Fichier actuel : {feuille.pdfSourceNom}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowFeuilleModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {feuille ? 'Enregistrer les modifications' : 'Créer la feuille d’observation'}
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
