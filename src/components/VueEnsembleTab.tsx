import { requestStatusLabel, sheetStatusLabel } from '../utils/statusLabels';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ExternalLink,
  CheckCircle,
  Edit2,
  Users,
  UserCheck,
  Clock,
  ArrowRight,
  Shield,
  X,
  History,
} from 'lucide-react';
import type {
  DossierEnquete,
  DemandeCommunication,
  FeuilleObservation,
  UserAccount,
  PvDetail,
  CaseTimelineEntry,
  CaseAssignmentEntry,
  Priorite
} from '../types';
import { formatDate } from '../utils/dateUtils';
import { fetchCaseTimeline, fetchCaseAssignments } from '../api/actions';
import { ModalPortal } from './common/ModalPortal';
import './VueEnsembleTab.css';

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
  onUpdateCase?: (caseId: string, data: any) => Promise<void>;
  onAssignCase?: (caseId: string, newAssigneeId: number, reason: string, version: number) => Promise<void>;
  onRefresh?: () => Promise<unknown>;
  eligibleAgents?: UserAccount[];
  allAgents?: UserAccount[];
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
  onUpdateCase,
  onAssignCase,
  onRefresh,
  eligibleAgents = [],
  allAgents = [],
}) => {
  const canEdit = dossier.capabilities?.includes('case.update') === true;
  const canAssign = dossier.capabilities?.includes('case.assign') === true;

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

  // Timeline and assignments state
  const [timeline, setTimeline] = useState<CaseTimelineEntry[]>([]);
  const [assignments, setAssignments] = useState<CaseAssignmentEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Modals state
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [nextActionValue, setNextActionValue] = useState(dossier.prochaineAction || '');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editObjet, setEditObjet] = useState(dossier.objet || '');
  const [editPerimetre, setEditPerimetre] = useState(dossier.perimetre || '');
  const [editMotifOuverture, setEditMotifOuverture] = useState(dossier.motifOuverture || '');
  const [editPriorite, setEditPriorite] = useState<Priorite>(dossier.priorite || 'NORMALE');
  const [editEcheance, setEditEcheance] = useState(dossier.echeance || '');
  const [editNom, setEditNom] = useState(dossier.entiteControlee.nom || '');
  const [editRccm, setEditRccm] = useState(dossier.entiteControlee.rccm || '');
  const [editNif, setEditNif] = useState(dossier.entiteControlee.nif || '');
  const [editTypeEntite, setEditTypeEntite] = useState(dossier.entiteControlee.typeEntite || 'Société commerciale');
  const [editRole, setEditRole] = useState(dossier.entiteControlee.roleDansDossier || 'Entreprise contrôlée');
  const [editAdresse, setEditAdresse] = useState(dossier.entiteControlee.adresse || '');
  const [editContact, setEditContact] = useState(dossier.entiteControlee.contact || '');
  const [editTypeCible, setEditTypeCible] = useState(dossier.entiteControlee.typeCible || '');
  const [editPourLeCompteDe, setEditPourLeCompteDe] = useState(dossier.entiteControlee.pourLeCompteDe || '');

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>(dossier.teamIds || []);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync state with incoming dossier props
  useEffect(() => {
    setNextActionValue(dossier.prochaineAction || '');
    setEditObjet(dossier.objet || '');
    setEditPerimetre(dossier.perimetre || '');
    setEditMotifOuverture(dossier.motifOuverture || '');
    setEditPriorite(dossier.priorite || 'NORMALE');
    setEditEcheance(dossier.echeance || '');
    setEditNom(dossier.entiteControlee.nom || '');
    setEditRccm(dossier.entiteControlee.rccm || '');
    setEditNif(dossier.entiteControlee.nif || '');
    setEditTypeEntite(dossier.entiteControlee.typeEntite || 'Société commerciale');
    setEditRole(dossier.entiteControlee.roleDansDossier || 'Entreprise contrôlée');
    setEditAdresse(dossier.entiteControlee.adresse || '');
    setEditContact(dossier.entiteControlee.contact || '');
    setEditTypeCible(dossier.entiteControlee.typeCible || '');
    setEditPourLeCompteDe(dossier.entiteControlee.pourLeCompteDe || '');
    setSelectedTeamIds(dossier.teamIds || []);
  }, [dossier]);

  // Load chronology and assignment history
  const loadHistory = useCallback(async () => {
    if (!dossier?.id) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const [tRes, aRes] = await Promise.all([
        fetchCaseTimeline(dossier.id).catch(() => []),
        fetchCaseAssignments(dossier.id).catch(() => []),
      ]);
      setTimeline(tRes);
      setAssignments(aRes);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Erreur de chargement de l’historique');
    } finally {
      setLoadingHistory(false);
    }
  }, [dossier?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const resolveAgentName = (id: number | null | undefined): string => {
    if (!id) return 'Non défini';
    const found = allAgents.find((a) => Number(a.id) === id);
    return found ? `${found.prenom} ${found.nom}`.trim() : `Agent #${id}`;
  };

  // Handlers
  const handleSaveNextAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextActionValue.trim() || !onUpdateCase || !dossier.version) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await onUpdateCase(dossier.id, {
        version: dossier.version,
        next_action: nextActionValue.trim(),
      });
      setShowNextActionModal(false);
      await loadHistory();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCase || !dossier.version) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await onUpdateCase(dossier.id, {
        version: dossier.version,
        object: editObjet,
        perimeter: editPerimetre,
        opening_reason: editMotifOuverture,
        priority: editPriorite === 'URGENTE' ? 'urgent' : editPriorite === 'SIGNALEE' ? 'flagged' : 'normal',
        deadline: editEcheance || null,
        controlled_entity: {
          nom: editNom,
          rccm: editRccm,
          nif: editNif,
          typeEntite: editTypeEntite,
          roleDansDossier: editRole,
          adresse: editAdresse,
          contact: editContact,
          typeCible: editTypeCible,
          pourLeCompteDe: editPourLeCompteDe,
        },
      });
      setShowEditModal(false);
      await loadHistory();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCase || !dossier.version) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await onUpdateCase(dossier.id, {
        version: dossier.version,
        team: selectedTeamIds,
      });
      setShowTeamModal(false);
      await loadHistory();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l’équipe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAssignCase || !dossier.version) return;
    if (!newAssigneeId) {
      setModalError('Veuillez sélectionner le nouvel enquêteur responsable.');
      return;
    }
    if (!assignReason.trim()) {
      setModalError('Le motif de réaffectation est obligatoire et doit être circonstancié.');
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      await onAssignCase(dossier.id, Number(newAssigneeId), assignReason.trim(), dossier.version);
      setShowAssignModal(false);
      setAssignReason('');
      setNewAssigneeId('');
      await loadHistory();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur lors de la réaffectation');
    } finally {
      setIsSaving(false);
    }
  };

  // Reassignment items map for easy correlation
  const assignmentsByVersion = new Map<number, CaseAssignmentEntry>();
  assignments.forEach((a) => assignmentsByVersion.set(a.version, a));

  return (
    <div className="case-overview">
      <section className="case-overview-summary" aria-label="Synthèse du dossier">
        <div className="case-overview-heading">
          <div>
            <p className="case-overview-reference">{dossier.reference}</p>
            <span className="case-overview-label">Objet de l’enquête</span>
            <h1>{dossier.objet || 'Objet non renseigné'}</h1>
          </div>
          {canEdit && (
            <button type="button" className="btn-secondary" onClick={() => { setModalError(null); setShowEditModal(true); }}>
              <Edit2 size={14} /> Modifier le dossier
            </button>
          )}
        </div>
        <div className="case-overview-next">
          <div>
            <span className="case-overview-label">Prochaine action</span>
            <p>{dossier.prochaineAction || 'Aucune action planifiée'}</p>
          </div>
          <div className="case-overview-deadline">
            <span className="case-overview-label">Échéance du dossier</span>
            <p>{dossier.echeance ? formatDate(dossier.echeance) : 'Non définie'}</p>
          </div>
          {canEdit && (
            <button type="button" className="btn-ghost" onClick={() => { setModalError(null); setNextActionValue(dossier.prochaineAction || ''); setShowNextActionModal(true); }}>
              <Edit2 size={13} /> Modifier l’action
            </button>
          )}
        </div>
        <dl className="case-overview-facts">
          <div><dt>Responsable</dt><dd>{dossier.responsable || 'Non désigné'}</dd></div>
          <div><dt>Unité</dt><dd>{dossier.unite || 'Non renseignée'}</dd></div>
          <div><dt>Priorité</dt><dd>{dossier.priorite === 'URGENTE' ? 'Urgente' : dossier.priorite === 'SIGNALEE' ? 'Signalée' : 'Normale'}</dd></div>
        </dl>
        <details className="case-overview-details">
          <summary>Informations du dossier et équipe</summary>
          <div className="case-overview-details-content">
            {dossier.perimetre && <p><span>Périmètre : </span>{dossier.perimetre}</p>}
            {dossier.motifOuverture && <p><span>Motif d’ouverture : </span>{dossier.motifOuverture}</p>}
            <p><span>Opérateur : </span>{dossier.entiteControlee.nom || 'Non renseigné'}</p>
            <dl className="case-overview-facts">
              {dossier.entiteControlee.nif && <div><dt>NIF</dt><dd>{dossier.entiteControlee.nif}</dd></div>}
              {dossier.entiteControlee.rccm && <div><dt>RCCM</dt><dd>{dossier.entiteControlee.rccm}</dd></div>}
              {dossier.entiteControlee.typeCible && <div><dt>Type</dt><dd>{dossier.entiteControlee.typeCible}</dd></div>}
              {dossier.entiteControlee.adresse && <div><dt>Adresse</dt><dd>{dossier.entiteControlee.adresse}</dd></div>}
              {dossier.entiteControlee.contact && <div><dt>Contact</dt><dd>{dossier.entiteControlee.contact}</dd></div>}
            </dl>
            <p><span>Équipe ({dossier.equipe.length}) : </span>{dossier.equipe.join(', ') || 'Aucun membre assigné'}</p>
            {canAssign && <div className="case-overview-team-actions">
              <button type="button" className="btn-secondary" onClick={() => { setModalError(null); setSelectedTeamIds(dossier.teamIds || []); setShowTeamModal(true); }}><Users size={14} /> Gérer l’équipe</button>
              <button type="button" className="btn-secondary" onClick={() => { setModalError(null); setNewAssigneeId(''); setAssignReason(''); setShowAssignModal(true); }}><UserCheck size={14} /> Réaffecter le dossier</button>
            </div>}
          </div>
        </details>
      </section>

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
                Classement sans suite — Décision interne validée
              </span>
            </div>
            {dossier.dateCloture && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Validé le {formatDate(dossier.dateCloture)}
              </span>
            )}
          </div>
          {dossier.motifClassement && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Motif du classement : </span>
              {dossier.motifClassement}
            </div>
          )}
        </div>
      )}

      <section className="case-overview-procedures" aria-label="Avancement de la procédure">
        <h2>Avancement de la procédure</h2>
        <div className="case-overview-procedure">
          <div><h3>Demandes de communication <span>({demandesList.length})</span></h3>
            <p>{dernierDemande ? requestStatusLabel(dernierDemande.statut) : 'Aucune demande'}</p>
          </div>
          {dernierDemande && <div><span className="case-overview-label">Échéance de réponse</span><p>{formatDate(dernierDemande.echeanceReponse)}</p></div>}
          <button type="button" className={dernierDemande ? 'btn-secondary' : 'btn-primary'} onClick={onGoToDemandes}>
            {dernierDemande ? <ExternalLink size={14} /> : <Plus size={14} />}{dernierDemande ? 'Consulter' : 'Créer une demande'}
          </button>
        </div>
        <div className="case-overview-procedure">
          <div><h3>Feuilles d’observation <span>({feuillesList.length})</span></h3>
            <p>{dernierFeuille ? sheetStatusLabel(dernierFeuille.statutFeuille) : 'Aucune feuille'}</p>
          </div>
          {dernierFeuille && <div><span className="case-overview-label">Audition prévue</span><p>{formatDate(dernierFeuille.dateReunionCloturePrevue)}</p></div>}
          <button type="button" className="btn-secondary" onClick={onGoToObservations}>{dernierFeuille ? 'Consulter' : 'Créer une feuille'}<ExternalLink size={14} /></button>
        </div>
        {dernierPv && <div className="case-overview-procedure">
          <div><h3>Procès-verbaux <span>({pvsList.length})</span></h3><p>{dernierPv.statutPv === 'TRANSMIS_CONTENTIEUX' ? 'Transmis GLEC' : 'Dressé'}</p></div>
          <div><span className="case-overview-label">Droits éludés</span><p>{dernierPv.droitsEludesUSD.toLocaleString('fr-FR')} USD</p></div>
          {onGoToPvs && <button type="button" className="btn-secondary" onClick={onGoToPvs}>Consulter<ExternalLink size={14} /></button>}
        </div>}
      </section>

      {/* =========================================================================
          5. SECTION CHRONOLOGIE & HISTORIQUE PROCÉDURAL DU DOSSIER
          Raccorde les actions de « Mon travail », la file « À valider », les chronologies et historiques.
          Chaque action doit ouvrir le bon objet.
          ========================================================================= */}
<details className="case-overview-details case-overview-history">
        <summary>Historique du dossier</summary>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="var(--color-text-muted)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Chronologie du dossier
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Historique des affectations motivées, actes d'instruction et évolutions de version du dossier
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={loadHistory}
            disabled={loadingHistory}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            {loadingHistory ? 'Actualisation...' : 'Rafraîchir'}
          </button>
        </div>

        {historyError && (
          <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)', padding: '8px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            {historyError}
          </div>
        )}

        {/* Liste chronologique */}
        {timeline.length === 0 && assignments.length === 0 && !loadingHistory ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Aucun événement consigné pour ce dossier pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            {/* On fusionne et trie par date décroissante */}
            {timeline.slice(0, 20).map((event) => {
              const assignment = event.version ? assignmentsByVersion.get(event.version) : undefined;
              const isAssignment = event.kind === 'assigned' || !!assignment;
              const isInspection = ['mission_created', 'sheet_created', 'sheet_prepared', 'defense_created', 'observation_assessed'].includes(event.kind);

              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: isAssignment ? 'rgba(59, 130, 246, 0.04)' : 'var(--color-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isAssignment ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface-elevated)',
                      color: isAssignment ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {isAssignment ? <UserCheck size={14} /> : isInspection ? <Shield size={14} /> : <Clock size={14} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {event.kind === 'created'
                            ? 'Ouverture initiale du dossier'
                            : event.kind === 'assigned'
                            ? 'Réaffectation motivée'
                            : event.kind === 'updated'
                            ? 'Mise à jour des informations'
                            : isInspection
                            ? 'Acte d’inspection contradictoire'
                            : event.kind}
                        </span>
                        {event.version && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                            v{event.version}
                          </span>
                        )}
                      </div>
                      <span className="font-sf" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {formatDate(event.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                      Opéré par : <strong style={{ color: 'var(--color-text-primary)' }}>{resolveAgentName(event.actor)}</strong>
                    </div>

                    {/* Détails spécifiques si réaffectation */}
                    {assignment && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--color-surface)',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                          <span>{resolveAgentName(assignment.previous_assignee)}</span>
                          <ArrowRight size={12} color="var(--color-text-muted)" />
                          <strong style={{ color: 'var(--color-accent)' }}>{resolveAgentName(assignment.new_assignee)}</strong>
                        </div>
                        <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Motif notifié : </span>
                          « {assignment.reason} »
                        </div>
                      </div>
                    )}

                    {/* Prochaine action si enregistrée */}
                    {event.next_action && !assignment && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Prochaine action fixée : <span style={{ color: 'var(--color-text-primary)' }}>{event.next_action}</span>
                      </div>
                    )}

                    {/* Boutons d'action : Chaque action doit ouvrir le bon objet */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {isInspection && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={onGoToObservations}
                          style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={11} />
                          <span>Ouvrir la feuille d'observation</span>
                        </button>
                      )}
                      {dernierDemande && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={onGoToDemandes}
                          style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={11} />
                          <span>Voir la demande</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </details>

      {/* =========================================================================
          MODALES : MODIFICATION DOSSIER, PROCHAINE ACTION, ÉQUIPE, RÉAFFECTATION
          ========================================================================= */}

      {/* Modale 1 : Modifier la Prochaine Action */}
      {showNextActionModal && (
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
                maxWidth: '480px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Modifier la prochaine action
                </h3>
                <button type="button" onClick={() => setShowNextActionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveNextAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Prochaine action opérationnelle *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={240}
                    value={nextActionValue}
                    onChange={(e) => setNextActionValue(e.target.value)}
                    placeholder="Ex : Convoquer l’assujetti pour l’audition contradictoire"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Max 240 caractères. Sera notifié dans le journal et la chronologie du dossier.
                  </div>
                </div>

                {modalError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{modalError}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowNextActionModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving || !nextActionValue.trim()}>
                    {isSaving ? 'Enregistrement...' : 'Valider'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modale 2 : Modifier le dossier (Métadonnées & Entité) */}
      {showEditModal && (
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
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                    Modifier les informations du dossier
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Réf. {dossier.reference} — Version actuelle : v{dossier.version}
                  </div>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveDossier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Objet de l’enquête *
                  </label>
                  <input
                    type="text"
                    required
                    value={editObjet}
                    onChange={(e) => setEditObjet(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Priorité
                    </label>
                    <select
                      value={editPriorite}
                      onChange={(e) => setEditPriorite(e.target.value as Priorite)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    >
                      <option value="NORMALE">Normale</option>
                      <option value="URGENTE">Urgente</option>
                      <option value="SIGNALEE">Signalée</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Échéance
                    </label>
                    <input
                      type="date"
                      value={editEcheance}
                      onChange={(e) => setEditEcheance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Périmètre d'investigation
                  </label>
                  <textarea
                    rows={2}
                    value={editPerimetre}
                    onChange={(e) => setEditPerimetre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Motif d’ouverture
                  </label>
                  <textarea
                    rows={2}
                    value={editMotifOuverture}
                    onChange={(e) => setEditMotifOuverture(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Bloc Opérateur */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Opérateur économique
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                      Raison sociale / Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={editNom}
                      onChange={(e) => setEditNom(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>NIF</label>
                      <input
                        type="text"
                        value={editNif}
                        onChange={(e) => setEditNif(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-btn)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>RCCM</label>
                      <input
                        type="text"
                        value={editRccm}
                        onChange={(e) => setEditRccm(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-btn)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>Adresse</label>
                      <input
                        type="text"
                        value={editAdresse}
                        onChange={(e) => setEditAdresse(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-btn)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>Contact</label>
                      <input
                        type="text"
                        value={editContact}
                        onChange={(e) => setEditContact(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-btn)', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {modalError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{modalError}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modale 3 : Modifier l'équipe */}
      {showTeamModal && (
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
                maxWidth: '480px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                    Composition de l’équipe d’enquête
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Sélectionnez les enquêteurs habilités de l’unité ({dossier.unite})
                  </div>
                </div>
                <button type="button" onClick={() => setShowTeamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {eligibleAgents.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '12px', textAlign: 'center' }}>
                      Aucun autre enquêteur éligible trouvé pour cette unité.
                    </div>
                  ) : (
                    eligibleAgents.map((agent) => {
                      const agentId = Number(agent.id);
                      const isAssignee = dossier.assigneeId === agentId;
                      const isChecked = selectedTeamIds.includes(agentId) || isAssignee;

                      return (
                        <label
                          key={agent.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-btn)',
                            backgroundColor: isChecked ? 'var(--color-surface-elevated)' : 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            cursor: isAssignee ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              disabled={isAssignee}
                              checked={isChecked}
                              onChange={(e) => {
                                if (isAssignee) return;
                                if (e.target.checked) {
                                  setSelectedTeamIds([...selectedTeamIds, agentId]);
                                } else {
                                  setSelectedTeamIds(selectedTeamIds.filter((id) => id !== agentId));
                                }
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {agent.prenom} {agent.nom}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {agent.matricule || agent.email}
                              </div>
                            </div>
                          </div>
                          {isAssignee && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)' }}>
                              Responsable (obligatoire)
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Total membres sélectionnés : {selectedTeamIds.length} (Max : 30).
                </div>

                {modalError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{modalError}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowTeamModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : 'Valider l’équipe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modale 4 : Réaffectation motivée du dossier */}
      {showAssignModal && (
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
                maxWidth: '520px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                    Réaffectation motivée du dossier
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Changement formel du responsable de l’enquête avec motif inaltérable
                  </div>
                </div>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Responsable actuel : <strong style={{ color: 'var(--color-text-primary)' }}>{dossier.responsable}</strong>
              </div>

              <form onSubmit={handleSaveReassignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Nouvel enquêteur responsable *
                  </label>
                  <select
                    required
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                  >
                    <option value="">Sélectionner un enquêteur actif de l’unité...</option>
                    {eligibleAgents
                      .filter((agent) => Number(agent.id) !== dossier.assigneeId)
                      .map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.prenom} {agent.nom} ({agent.matricule || agent.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Motif circonstancié de la réaffectation *
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    placeholder="Précisez le motif opérationnel : congé, rééquilibrage de charge, spécialité technique, indisponibilité temporaire..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Ce motif est obligatoire et sera définitivement consigné dans le registre des affectations.
                  </div>
                </div>

                {modalError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{modalError}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving || !newAssigneeId || !assignReason.trim()}
                  >
                    {isSaving ? 'Enregistrement...' : 'Confirmer la réaffectation'}
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
