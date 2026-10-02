import React from 'react';
import {
  Plus,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import type { DossierEnquete, DemandeCommunication, FeuilleObservation, UserAccount, PvDetail } from '../types';
import { formatDate } from '../utils/dateUtils';

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
  onCloturerSansSuite: _onCloturerSansSuite,
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
              onClick={onGoToDemandes}
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
                {dernierPv.infractions[0] || 'Non précisée'}
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

    </div>
  );
};
