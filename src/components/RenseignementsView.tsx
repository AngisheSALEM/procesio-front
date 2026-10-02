import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  X,
  CheckCircle,
  FolderPlus,
  Upload,
  Edit2,
  Shield,
  Share2,
  Send,
  Link,
} from 'lucide-react';
import type {
  RenseignementItem,
  UserAccount,
  Priorite,
  DossierEnquete
} from '../types';
import type { DossierTabId } from './DossierHeader';
import { TablePagination } from './common/TablePagination';
import type { ApiMembership, ApiUnit, ApiDissemination, ApiDisseminationReturn } from '../api/client';
import type { WorkspaceData } from '../api/workspace';
import { ModalPortal } from './common/ModalPortal';
import {
  fetchProtectedSource,
  fetchDisseminations,
  createDissemination,
  confirmDissemination,
  fetchDisseminationReturns,
  createDisseminationReturn,
  fetchAllUnits,
} from '../api/actions';
import { formatDate } from '../utils/dateUtils';
import './RenseignementsView.css';

interface RenseignementsViewProps {
  renseignements?: RenseignementItem[];
  currentUser: UserAccount;
  onOpenDossier: (dossierId: string, tab?: DossierTabId) => void;
  onCreateDossier: (dossierData: any, renseignementId?: string) => Promise<void>;
  onAddRenseignement?: (item: RenseignementItem, files?: File[], assigneeId?: number) => Promise<void>;
  onUpdateRenseignement?: (item: RenseignementItem) => Promise<void> | void;
  onLinkIntelligence?: (intelligenceId: string, caseId: string, version?: number) => Promise<void>;
  onRefresh?: () => Promise<unknown>;
  agents?: UserAccount[];
  memberships?: ApiMembership[];
  agentScopes?: WorkspaceData['agentScopes'];
  dossiers?: DossierEnquete[];
  demandesParDossier?: Record<string, any>;
  feuillesParDossier?: Record<string, any>;
  pvsParDossier?: Record<string, any>;
}

export const RenseignementsView: React.FC<RenseignementsViewProps> = ({
  renseignements = [],
  currentUser,
  onOpenDossier,
  onCreateDossier,
  onAddRenseignement,
  onUpdateRenseignement,
  onLinkIntelligence,
  onRefresh,
  agents = [],
  memberships = [],
  agentScopes = {},
  dossiers = [],
  demandesParDossier = {},
  feuillesParDossier = {},
  pvsParDossier = {},
}) => {
  const items = renseignements;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'TOUS' | 'DOUANE' | 'RAPPORT' | 'OPINION'>('TOUS');
  const [showCreateRenseignementModal, setShowCreateRenseignementModal] = useState(false);
  const [showCreateDossierModal, setShowCreateDossierModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // État de modification & cotation
  const [showEditModal, setShowEditModal] = useState(false);
  const [editObjet, setEditObjet] = useState('');
  const [editResume, setEditResume] = useState('');
  const [editProvenance, setEditProvenance] = useState('');
  const [editDateReception, setEditDateReception] = useState('');
  const [editPiecesDisponibles, setEditPiecesDisponibles] = useState('');
  const [editPriorite, setEditPriorite] = useState<Priorite>('NORMALE');
  const [editDegreFiabilite, setEditDegreFiabilite] = useState('');
  const [editInstructionCotation, setEditInstructionCotation] = useState('');
  const [editDelaiPrescritJours, setEditDelaiPrescritJours] = useState<number | ''>(15);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // État de liaison à un dossier existant
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedCaseToLink, setSelectedCaseToLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // État des diffusions inter-bureaux
  const [disseminations, setDisseminations] = useState<ApiDissemination[]>([]);
  const [loadingDisseminations, setLoadingDisseminations] = useState(false);
  const [disseminationError, setDisseminationError] = useState<string | null>(null);
  const [showCreateDisseminationModal, setShowCreateDisseminationModal] = useState(false);
  const [allUnits, setAllUnits] = useState<ApiUnit[]>([]);
  const [newDissRecipientUnit, setNewDissRecipientUnit] = useState('');
  const [newDissChannel, setNewDissChannel] = useState('Bordereau officiel');
  const [newDissAction, setNewDissAction] = useState('Contrôle contradictoire local');
  const [newDissReference, setNewDissReference] = useState('');
  const [newDissSendNow, setNewDissSendNow] = useState(false);
  const [isSavingDissemination, setIsSavingDissemination] = useState(false);
  const [confirmingDissId, setConfirmingDissId] = useState<string | null>(null);

  // État des retours par diffusion
  const [returnsMap, setReturnsMap] = useState<Record<string, ApiDisseminationReturn[]>>({});
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedDissForReturn, setSelectedDissForReturn] = useState<ApiDissemination | null>(null);
  const [returnAcknowledged, setReturnAcknowledged] = useState(true);
  const [returnReceivedAt, setReturnReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnNote, setReturnNote] = useState('');
  const [isSavingReturn, setIsSavingReturn] = useState(false);

  // État de la source protégée (source.read)
  const [protectedSourceIdentity, setProtectedSourceIdentity] = useState<string | null>(null);
  const [isSourceRevealed, setIsSourceRevealed] = useState(false);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inspecteurs disponibles pour affectation
  const eligibleMemberships = memberships.filter((membership) => membership.capabilities.includes('intelligence.create'));
  const [formUnit, setFormUnit] = useState(() => eligibleMemberships[0]?.unit.id || '');
  const [formClassification, setFormClassification] = useState<0 | 1>(0);
  const formMembership = eligibleMemberships.find((membership) => membership.unit.id === formUnit);
  const formScope = agentScopes[formUnit];
  const formAgentIds = React.useMemo(() => formScope?.[formClassification === 1 ? 'restricted' : 'ordinary'] || [], [formScope, formClassification]);
  const inspecteursDisponibles = React.useMemo(() => agents.filter((agent) => formAgentIds.includes(Number(agent.id))), [agents, formAgentIds]);
  const canUpload = formMembership?.capabilities.includes('source.write') === true;

  // Formulaire de Nouveau Renseignement (source, objet, pièces disponibles avec upload, priorité, affectation à qui)
  const [formSource, setFormSource] = useState('Douane');
  const [formObjet, setFormObjet] = useState('');
  const [formPiecesDisponibles, setFormPiecesDisponibles] = useState('');
  const [formUploadedFiles, setFormUploadedFiles] = useState<File[]>([]);
  const [formAffectation, setFormAffectation] = useState('');
  const [formInstructions, setFormInstructions] = useState('');

  const effectiveFormAffectation = formAgentIds.includes(Number(formAffectation))
    ? formAffectation : inspecteursDisponibles[0]?.id || '';

  // Formulaire de Création de Dossier
  const [dossierNom, setDossierNom] = useState('');
  const dossierNif = '';
  const dossierRccm = '';
  const [dossierTypeCible, setDossierTypeCible] = useState('Entreprise commerciale');
  const [dossierPourLeCompteDe, setDossierPourLeCompteDe] = useState('');
  const [dossierAdresse, setDossierAdresse] = useState('');
  const [dossierContact, setDossierContact] = useState('');
  const [dossierObjet, setDossierObjet] = useState('');
  const [dossierResponsable, setDossierResponsable] = useState('');
  const [dossierAssigneeId, setDossierAssigneeId] = useState('');
  const [dossierPriorite, setDossierPriorite] = useState<Priorite>('NORMALE');
  const [dossierEcheance, setDossierEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Détermination précise du statut procédural du renseignement
  const getRenseignementStatut = (ren: RenseignementItem): string => {
    const linkedDossier = dossiers.find((d) =>
      ren.dossiersLies && (
        ren.dossiersLies.includes(d.id) ||
        ren.dossiersLies.includes(d.reference)
      )
    );

    if (!linkedDossier) {
      if (ren.effetProduit === 'CLASSE_SANS_SUITE' || ren.statut === 'CLASSE_SANS_SUITE') {
        return 'Classé sans suite';
      }
      return 'En attente d’enquête';
    }

    // 1. PV établi
    const pvs = pvsParDossier[linkedDossier.id];
    const hasPv = (Array.isArray(pvs) && pvs.length > 0) || linkedDossier.hasPv || ren.pvGenereRef;
    if (hasPv) {
      return 'PV établi';
    }

    // 2. Feuille d'observation
    const feuilles = feuillesParDossier[linkedDossier.id];
    const hasFeuille = (Array.isArray(feuilles) && feuilles.length > 0) || (feuilles && !Array.isArray(feuilles));
    if (hasFeuille) {
      return 'Feuille d’observation';
    }

    // 3. Demande de communication
    const demandes = demandesParDossier[linkedDossier.id];
    const hasDemande = (Array.isArray(demandes) && demandes.length > 0) || (demandes && !Array.isArray(demandes));
    if (hasDemande) {
      return 'Demande de communication';
    }

    if (linkedDossier.decisionCloture === 'CLASSE_SANS_SUITE') {
      return 'Classé sans suite';
    }

    return 'Dossier d’enquête ouvert';
  };

  // Filtrage selon le rôle : l'enquêteur ne voit que les renseignements qui lui sont formellement assignés
  const visibleItems = items;

  // Filtrage par recherche et source
  const filteredItems = visibleItems.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.reference.toLowerCase().includes(q) ||
      r.objet.toLowerCase().includes(q) ||
      r.origine.toLowerCase().includes(q) ||
      (r.coteA && r.coteA.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (sourceFilter === 'DOUANE' && !r.origine.toLowerCase().includes('douane') && !r.origine.toLowerCase().includes('balisage')) {
      return false;
    }
    if (sourceFilter === 'RAPPORT' && !r.origine.toLowerCase().includes('rapport') && !r.origine.toLowerCase().includes('section')) {
      return false;
    }
    if (sourceFilter === 'OPINION' && !r.origine.toLowerCase().includes('signalement') && !r.origine.toLowerCase().includes('dénonciation') && !r.origine.toLowerCase().includes('opinion')) {
      return false;
    }

    return true;
  });

  // Renseignement actuellement sélectionné pour la page de détail (strictement restreint aux renseignements visibles)
  const selectedRenseignement = selectedId
    ? visibleItems.find((r) => r.id === selectedId) || null
    : null;

  const handleUploadedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFormUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  // Création d'une nouvelle demande de renseignement
  const handleCreateRenseignementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formObjet.trim() || !onAddRenseignement || !effectiveFormAffectation || isSaving) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const textPieces = formPiecesDisponibles
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const piecesArray = textPieces;

    const newItem: RenseignementItem = {
      id: '',
      reference: '',
      dateReception: todayDate,
      origine: formSource,
      objet: formObjet.trim(),
      resume: formObjet.trim(),
      piecesDisponibles: piecesArray,
      niveauAcces: formClassification === 1 ? 'Restreint' : 'Interne',
      serviceDestinataire: formUnit,
      statut: 'À enregistrer',
      dossiersLies: [],
      coteA: (() => { const agent = agents.find((a) => a.id === effectiveFormAffectation); return agent ? `${agent.prenom} ${agent.nom}` : ''; })(),
      degreFiabilite: '',
      instructionCotation: formInstructions.trim(),
    };

    setIsSaving(true);
    setActionError(null);
    try {
      await onAddRenseignement(newItem, formUploadedFiles, Number(effectiveFormAffectation));
      setShowCreateRenseignementModal(false);
      setFormObjet('');
      setFormPiecesDisponibles('');
      setFormUploadedFiles([]);
      setFormInstructions('');
      showToast('Renseignement enregistré.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const canCreateFromIntelligence = (ren: RenseignementItem | null): boolean =>
    Boolean(ren?.capabilities?.includes('case.create') && ren.capabilities.includes('case.assign'));

  // Ouverture du modal de création de dossier pré-rempli (uniquement pour l'inspecteur affecté)
  const handleOpenCreateDossierModal = () => {
    if (!selectedRenseignement || !canCreateFromIntelligence(selectedRenseignement)) return;
    setActionError(null);

    setDossierNom('');
    setDossierObjet(selectedRenseignement.objet);
    setDossierResponsable(selectedRenseignement.coteA || `${currentUser.prenom} ${currentUser.nom}`);
    const matchingAgent = agents.find((agent) => selectedRenseignement.assigneeId !== undefined
      ? agent.id === String(selectedRenseignement.assigneeId)
      : `${agent.prenom} ${agent.nom}` === selectedRenseignement.coteA);
    setDossierAssigneeId(matchingAgent?.id || '');
    setDossierPriorite((selectedRenseignement.priorite as Priorite) || 'NORMALE');
    setShowCreateDossierModal(true);
  };

  // Soumission de la création de dossier depuis le renseignement
  const handleCreateDossierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenseignement || !dossierNom.trim() || !dossierAssigneeId || isSaving || !canCreateFromIntelligence(selectedRenseignement)) return;

    const newDossierData = {
      assigneeId: Number(dossierAssigneeId),
      objet: dossierObjet.trim(),
      perimetre: `Contrôle contradictoire issu du renseignement ${selectedRenseignement.reference} (Origine : ${selectedRenseignement.origine})`,
      motifOuverture: `Ouverture consécutive à l’exploitation du renseignement qualifié ${selectedRenseignement.reference}`,
      unite: selectedRenseignement.unitId || selectedRenseignement.serviceDestinataire,
      responsable: dossierResponsable.trim() || selectedRenseignement.coteA || `${currentUser.prenom} ${currentUser.nom}`,
      statut: 'EN_COURS' as const,
      priorite: dossierPriorite,
      echeance: dossierEcheance,
      prochaineAction: 'Émettre la réquisition de communication de pièces',
      dateCreation: new Date().toISOString().split('T')[0],
      entiteControlee: {
        nom: dossierNom.trim().toUpperCase(),
        rccm: dossierRccm.trim(),
        nif: dossierNif.trim().toUpperCase(),
        typeEntite: (dossierTypeCible as any) || ('Société commerciale' as const),
        typeCible: dossierTypeCible,
        pourLeCompteDe: dossierPourLeCompteDe.trim() || undefined,
        roleDansDossier: 'Entreprise contrôlée' as const,
        adresse: dossierAdresse.trim(),
        contact: dossierContact.trim(),
      },
    };
    setIsSaving(true);
    setActionError(null);
    try {
      await onCreateDossier(newDossierData, selectedRenseignement.id);
      setShowCreateDossierModal(false);
      showToast('Dossier enregistré et lié au renseignement.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Création du dossier impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  // Chargement des diffusions et de leurs retours
  const loadDisseminations = useCallback(async (intelId: string) => {
    setLoadingDisseminations(true);
    setDisseminationError(null);
    try {
      const list = await fetchDisseminations(intelId);
      setDisseminations(list);
      const returns: Record<string, ApiDisseminationReturn[]> = {};
      for (const diss of list) {
        if (diss.sent_at) {
          try {
            const rets = await fetchDisseminationReturns(diss.id);
            returns[diss.id] = rets;
          } catch {
            // Ignore individual return load errors
          }
        }
      }
      setReturnsMap(returns);
    } catch (err: any) {
      setDisseminationError(err?.message || 'Erreur lors du chargement des diffusions.');
    } finally {
      setLoadingDisseminations(false);
    }
  }, []);

  useEffect(() => {
    setProtectedSourceIdentity(null);
    setIsSourceRevealed(false);
    setSourceError(null);
    if (selectedId) {
      void loadDisseminations(selectedId);
    }
  }, [selectedId, loadDisseminations]);

  // Consultation de la source protégée (source.read)
  const handleConsultProtectedSource = async () => {
    if (!selectedRenseignement) return;
    if (isSourceRevealed) {
      setIsSourceRevealed(false);
      return;
    }
    if (protectedSourceIdentity) {
      setIsSourceRevealed(true);
      return;
    }
    setIsLoadingSource(true);
    setSourceError(null);
    try {
      const identity = await fetchProtectedSource(selectedRenseignement.id);
      setProtectedSourceIdentity(identity);
      setIsSourceRevealed(true);
    } catch (err: any) {
      setSourceError(err?.message || 'Impossible de consulter la source protégée.');
    } finally {
      setIsLoadingSource(false);
    }
  };

  // Ouverture du modal de modification / cotation
  const handleOpenEditModal = () => {
    if (!selectedRenseignement) return;
    setEditObjet(selectedRenseignement.objet || '');
    setEditResume(selectedRenseignement.resume || selectedRenseignement.objet || '');
    setEditProvenance(selectedRenseignement.origine || '');
    setEditDateReception(selectedRenseignement.dateReception || new Date().toISOString().slice(0, 10));
    setEditPiecesDisponibles((selectedRenseignement.piecesDisponibles || []).join(', '));
    setEditPriorite((selectedRenseignement.priorite as Priorite) || 'NORMALE');
    setEditDegreFiabilite(selectedRenseignement.degreFiabilite || '');
    setEditInstructionCotation(selectedRenseignement.instructionCotation || '');
    setEditDelaiPrescritJours(selectedRenseignement.delaiPrescritJours || 15);
    setEditError(null);
    setShowEditModal(true);
  };

  // Soumission de la modification / cotation
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenseignement || !onUpdateRenseignement || isEditing) return;
    if (!editObjet.trim()) {
      setEditError('L’objet est obligatoire.');
      return;
    }

    const updatedItem: RenseignementItem = {
      ...selectedRenseignement,
      objet: editObjet.trim(),
      resume: editResume.trim() || editObjet.trim(),
      origine: editProvenance.trim(),
      dateReception: editDateReception,
      piecesDisponibles: editPiecesDisponibles
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      priorite: editPriorite,
      degreFiabilite: editDegreFiabilite.trim(),
      instructionCotation: editInstructionCotation.trim(),
      delaiPrescritJours: typeof editDelaiPrescritJours === 'number' ? editDelaiPrescritJours : undefined,
      version: selectedRenseignement.version,
    };

    setIsEditing(true);
    setEditError(null);
    try {
      await onUpdateRenseignement(updatedItem);
      setShowEditModal(false);
      showToast('Renseignement mis à jour avec succès.');
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('409') || msg.toLowerCase().includes('conflit') || msg.toLowerCase().includes('version')) {
        setEditError('Conflit de version (409) : ce renseignement a été modifié par un autre intervenant. Veuillez fermer et actualiser la page.');
      } else {
        setEditError(msg || 'Modification impossible.');
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Ouverture du modal de liaison à un dossier existant
  const handleOpenLinkModal = () => {
    if (!selectedRenseignement) return;
    const linkedSet = new Set(selectedRenseignement.dossiersLies || []);
    const available = dossiers.filter((d) => !linkedSet.has(d.id) && !linkedSet.has(d.reference));
    setSelectedCaseToLink(available[0]?.id || '');
    setLinkError(null);
    setShowLinkModal(true);
  };

  // Soumission de la liaison
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenseignement || !onLinkIntelligence || !selectedCaseToLink || isLinking) return;
    setIsLinking(true);
    setLinkError(null);
    try {
      await onLinkIntelligence(selectedRenseignement.id, selectedCaseToLink, selectedRenseignement.version);
      setShowLinkModal(false);
      showToast('Renseignement lié au dossier d’enquête avec succès.');
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('409') || msg.toLowerCase().includes('conflit') || msg.toLowerCase().includes('version')) {
        setLinkError('Conflit de version (409) : ce renseignement a évolué. Veuillez fermer et actualiser la page.');
      } else {
        setLinkError(msg || 'Liaison au dossier impossible.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  // Ouverture du modal de création de diffusion
  const handleOpenCreateDissemination = async () => {
    setDisseminationError(null);
    if (!allUnits.length) {
      try {
        const units = await fetchAllUnits();
        setAllUnits(units);
        setNewDissRecipientUnit(units[0]?.id || '');
      } catch {
        // Fallback
      }
    } else {
      setNewDissRecipientUnit(allUnits[0]?.id || '');
    }
    setNewDissChannel('Bordereau officiel');
    setNewDissAction('Contrôle contradictoire local');
    setNewDissReference('');
    setNewDissSendNow(false);
    setShowCreateDisseminationModal(true);
  };

  // Soumission de la diffusion
  const handleCreateDisseminationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenseignement || !newDissRecipientUnit || isSavingDissemination) return;
    setIsSavingDissemination(true);
    setDisseminationError(null);
    try {
      await createDissemination(selectedRenseignement.id, {
        recipient_unit: newDissRecipientUnit,
        channel: newDissChannel,
        expected_action: newDissAction,
        reference: newDissReference.trim() || undefined,
        sent_at: newDissSendNow ? new Date().toISOString() : null,
      });
      setShowCreateDisseminationModal(false);
      showToast('Diffusion inter-bureaux enregistrée avec succès.');
      await loadDisseminations(selectedRenseignement.id);
    } catch (err: any) {
      setDisseminationError(err?.message || 'Enregistrement de la diffusion impossible.');
    } finally {
      setIsSavingDissemination(false);
    }
  };

  // Confirmation de l'envoi d'une diffusion
  const handleConfirmDissemination = async (dissId: string) => {
    if (!selectedRenseignement || confirmingDissId) return;
    setConfirmingDissId(dissId);
    try {
      await confirmDissemination(dissId);
      showToast('Transmission de la diffusion confirmée.');
      await loadDisseminations(selectedRenseignement.id);
    } catch (err: any) {
      setDisseminationError(err?.message || 'Confirmation impossible.');
    } finally {
      setConfirmingDissId(null);
    }
  };

  // Ouverture du modal de retour de diffusion
  const handleOpenAddReturn = (diss: ApiDissemination) => {
    setSelectedDissForReturn(diss);
    setReturnAcknowledged(true);
    setReturnReceivedAt(new Date().toISOString().slice(0, 10));
    setReturnNote('');
    setShowReturnModal(true);
  };

  // Soumission du retour de diffusion
  const handleAddReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDissForReturn || isSavingReturn) return;
    setIsSavingReturn(true);
    try {
      await createDisseminationReturn(selectedDissForReturn.id, {
        acknowledged: returnAcknowledged,
        received_at: returnReceivedAt,
        note: returnNote.trim(),
      });
      setShowReturnModal(false);
      showToast('Retour de diffusion enregistré avec succès.');
      if (selectedRenseignement) await loadDisseminations(selectedRenseignement.id);
    } catch (err: any) {
      setDisseminationError(err?.message || 'Enregistrement du retour impossible.');
    } finally {
      setIsSavingReturn(false);
    }
  };

  // =========================================================================
  // 1. PAGE DÉTAIL DÉDIÉE DU RENSEIGNEMENT (PAS DE MODAL)
  // =========================================================================
  if (selectedRenseignement) {
    const hasDossier = selectedRenseignement.dossiersLies && selectedRenseignement.dossiersLies.length > 0;
    const pieces = selectedRenseignement.piecesDisponibles || [];


    const dossierAgentIds = agentScopes[selectedRenseignement.unitId || '']?.[selectedRenseignement.classification === 1 ? 'restricted' : 'ordinary'] || [];
    const dossierAgents = agents.filter((agent) => dossierAgentIds.includes(Number(agent.id)));
    const linkedDossier = dossiers.find((d) =>
      selectedRenseignement.dossiersLies && (
        selectedRenseignement.dossiersLies.includes(d.id) ||
        selectedRenseignement.dossiersLies.includes(d.reference)
      )
    ) || null;

    const isUserUnitManager = memberships.some((m) =>
      m.unit.id === (selectedRenseignement.unitId || selectedRenseignement.serviceDestinataire) &&
      m.role === 'manager'
    ) || currentUser.role === 'director';

    return (
      <div key={`renseignement-detail-${selectedRenseignement.id}`} className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Toast Notification */}
        {toastMessage && (
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
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Bouton Retour vers la liste */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
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
            <span>Retour aux renseignements</span>
          </button>
        </div>

        {/* Page Info Épurée : Renseignement Sélectionné */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border-subtle)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
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
              
              paddingBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Fiche de Renseignement Douanier
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                {selectedRenseignement.objet}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Reçu et enregistré le {selectedRenseignement.dateReception} • Statut : <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{getRenseignementStatut(selectedRenseignement)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {selectedRenseignement.capabilities?.includes('intelligence.update') && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={13} />
                  <span>Modifier / Coter</span>
                </button>
              )}

              {selectedRenseignement.capabilities?.includes('intelligence.update') && (
                <button
                  type="button"
                  onClick={handleOpenLinkModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Link size={13} />
                  <span>Lier à un dossier</span>
                </button>
              )}

              {selectedRenseignement.capabilities?.includes('intelligence.distribute') && (
                <button
                  type="button"
                  onClick={handleOpenCreateDissemination}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={13} />
                  <span>Diffuser à un bureau</span>
                </button>
              )}

              {hasDossier ? (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = linkedDossier ? linkedDossier.id : (selectedRenseignement.dossiersLies?.[0] || '');
                    if (targetId) onOpenDossier(targetId);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>Consulter le dossier d’enquête rattaché</span>
                  <ExternalLink size={13} />
                </button>
              ) : selectedRenseignement.capabilities?.includes('case.create') && selectedRenseignement.capabilities?.includes('case.assign') ? (
                <button
                  type="button"
                  onClick={handleOpenCreateDossierModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FolderPlus size={15} />
                  <span>Créer un dossier</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Section 1 : Origine & Affectation */}
          <div style={{ gap: '16px' }}>
            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Source d’origine
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {selectedRenseignement.origine}
              </div>

              {/* Consultation confidentielle de la source protégée */}
              <div style={{ marginTop: '8px' }}>
                {selectedRenseignement.capabilities?.includes('source.read') ? (
                  <div>
                    {!isSourceRevealed ? (
                      <button
                        type="button"
                        onClick={handleConsultProtectedSource}
                        disabled={isLoadingSource}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #0284c7',
                          backgroundColor: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Shield size={12} />
                        <span>{isLoadingSource ? 'Déchiffrement...' : 'Consulter l’identité protégée (source.read)'}</span>
                      </button>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#b91c1c',
                        fontSize: '12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} color="#ef4444" />
                          <span style={{ fontWeight: 700 }}>Source protégée :</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{protectedSourceIdentity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSourceRevealed(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#b91c1c',
                            fontSize: '11px',
                            textDecoration: 'underline',
                          }}
                        >
                          Masquer
                        </button>
                      </div>
                    )}
                    {sourceError && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{sourceError}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={11} />
                    <span>Identité protégée · Habilitation source.read requise</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Agent désigné / Affecté à
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {selectedRenseignement.coteA || 'En attente de cotation'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Coté par : {selectedRenseignement.cotePar || 'Direction Provinciale'}
              </div>
            </div>

            <div style={{ backgroundColor: 'none', border: 'none', padding: '16px' }}>

              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Délai d’instruction prescrit : {selectedRenseignement.delaiPrescritJours || 15} jours
              </div>
            </div>
          </div>

          

          {/* Section 2 : Objet & Qualification de l'information */}
          <div style={{ backgroundColor: 'none', border: 'none', padding: '20px' }}>
            {/* <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Objet & Faits Signalés
            </div> */}
            {/* <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600, marginTop: '8px', lineHeight: 1.5 }}>
              {selectedRenseignement.objet}
            </div> */}

            {/* {selectedRenseignement.resume && selectedRenseignement.resume !== selectedRenseignement.objet && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '10px', lineHeight: 1.5 }}>
                {selectedRenseignement.resume}
              </div>
            )} */}

            {selectedRenseignement.instructionCotation && (
              <div style={{ marginTop: '14px', paddingTop: '14px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Instruction de commandement : </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{selectedRenseignement.instructionCotation}</span>
              </div>
            )}
          </div>

          {/* Section 3 : Pièces Disponibles */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Pièces Disponibles & Documents Justificatifs
            </div>

            {pieces.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Aucun fichier n'y est associé
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pieces.map((piece, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    • {piece}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 : Suivi jusqu'à son issue & État du dossier lié */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Suivi Procédural & État du Dossier Lié
              </div>
            </div>

            {/* Suivi des actes du dossier lié */}


            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!selectedRenseignement.cycleEvolution?.length && (
                <div style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '12px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-subtle)', borderRadius: '8px' }}>
                  Évolution non documentée par le serveur.
                </div>
              )}
              {(selectedRenseignement.cycleEvolution || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: item.statut === 'TERMINE' ? 'var(--color-surface-elevated)' : 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.etape}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {item.date}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Acteur : {item.acteur}
                    </div>
                    {item.commentaire && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {item.commentaire}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 : Liaison aux dossiers d’enquête existants */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Liaison aux dossiers d’enquête
              </div>
              {selectedRenseignement.capabilities?.includes('intelligence.update') && (
                <button
                  type="button"
                  onClick={handleOpenLinkModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Link size={12} />
                  <span>Rattacher à un dossier existant</span>
                </button>
              )}
            </div>

            {(!selectedRenseignement.dossiersLies || selectedRenseignement.dossiersLies.length === 0) ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Ce renseignement n’est rattaché à aucun dossier d’enquête existant.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedRenseignement.dossiersLies.map((caseRefOrId) => {
                  const linked = dossiers.find((d) => d.id === caseRefOrId || d.reference === caseRefOrId);
                  return (
                    <div
                      key={caseRefOrId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {linked ? linked.entiteControlee.nom : `Dossier ${caseRefOrId}`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Réf : {linked?.reference || caseRefOrId} {linked?.statut ? `• Statut : ${linked.statut}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenDossier(linked?.id || caseRefOrId, 'vue-ensemble')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-on-accent)',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Ouvrir ce dossier</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 6 : Diffusions entre bureaux et retours */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-card)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Diffusions entre bureaux & Retours ({disseminations.length})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Transmission inter-unités et enregistrement contradictoire des retours d’exploitation.
                </div>
              </div>

              {selectedRenseignement.capabilities?.includes('intelligence.distribute') && (
                <button
                  type="button"
                  onClick={handleOpenCreateDissemination}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-on-accent)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>Nouvelle diffusion</span>
                </button>
              )}
            </div>

            {disseminationError && (
              <div role="alert" style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '6px' }}>
                {disseminationError}
              </div>
            )}

            {loadingDisseminations ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Chargement des diffusions et retours...
              </div>
            ) : disseminations.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Aucune diffusion inter-bureaux enregistrée pour ce renseignement.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {disseminations.map((diss) => {
                  const isConfirmed = Boolean(diss.sent_at);
                  const dissReturns = returnsMap[diss.id] || [];
                  const recipientUnitName = allUnits.find((u) => u.id === diss.recipient_unit)?.name || diss.recipient_unit;

                  return (
                    <div
                      key={diss.id}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              Vers : {recipientUnitName}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: isConfirmed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                              color: isConfirmed ? '#16a34a' : '#ca8a04',
                            }}>
                              {isConfirmed ? `Confirmée le ${formatDate(diss.sent_at!)}` : 'Brouillon / En attente d’envoi'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Canal : <strong style={{ color: 'var(--color-text-secondary)' }}>{diss.channel}</strong>
                            {diss.reference ? ` • Réf : ${diss.reference}` : ''}
                            {` • Action attendue : ${diss.expected_action}`}
                          </div>
                        </div>

                        {!isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleConfirmDissemination(diss.id)}
                            disabled={confirmingDissId === diss.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Send size={12} />
                            <span>{confirmingDissId === diss.id ? 'Confirmation...' : 'Confirmer l’envoi'}</span>
                          </button>
                        )}
                      </div>

                      {/* Section Retours pour cette diffusion confirmée */}
                      {isConfirmed && (
                        <div style={{
                          marginTop: '6px',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--color-border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                              Retours d’exploitation du bureau récepteur ({dissReturns.length})
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAddReturn(diss)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={11} />
                              <span>Enregistrer un retour</span>
                            </button>
                          </div>

                          {dissReturns.length === 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              Aucun retour enregistré à ce jour par le bureau destinataire.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {dissReturns.map((ret) => (
                                <div
                                  key={ret.id}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-subtle)',
                                    fontSize: '11px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{
                                      fontWeight: 700,
                                      color: ret.acknowledged ? '#16a34a' : '#ca8a04',
                                    }}>
                                      {ret.acknowledged ? '✓ Réception accusée & prise en compte' : '⚠ Non prise en compte'}
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                      Reçu le {ret.received_at}
                                    </span>
                                  </div>
                                  {ret.note && (
                                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                      {ret.note}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Création de Dossier depuis le Renseignement */}
        {showCreateDossierModal && (
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
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    Création du Dossier d’Enquête
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Ouverture consécutive au renseignement {selectedRenseignement.reference}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateDossierModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDossierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Opérateur ou entreprise assujettie au contrôle *
                  </label>
                  <input
                    type="text"
                    required
                    value={dossierNom}
                    onChange={(e) => setDossierNom(e.target.value)}
                    placeholder="Ex : CONGO MINING LOGISTICS SAS"
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
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                </div>

                {/* Type de cible & Pour le compte de */}
                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Type de cible
                    </label>
                    <select
                      value={dossierTypeCible}
                      onChange={(e) => setDossierTypeCible(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
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
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Pour le compte de (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Si commissionnaire ou déclarant..."
                      value={dossierPourLeCompteDe}
                      onChange={(e) => setDossierPourLeCompteDe(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Champ Adresse géographique */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Adresse
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : 04 Avenue des Métaux, Quartier Industriel, Lubumbashi"
                    value={dossierAdresse}
                    onChange={(e) => setDossierAdresse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Champ Contact de l'entité */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Contact officiel (téléphone, email) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : +243 81 234 5678 — contact@entreprise.cd"
                    value={dossierContact}
                    onChange={(e) => setDossierContact(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Objet de l’enquête contradictoire *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={dossierObjet}
                    onChange={(e) => setDossierObjet(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Responsable désigné
                    </label>
                    <select
                      required
                      value={dossierAssigneeId}
                      onChange={(e) => {
                        const agent = agents.find((entry) => entry.id === e.target.value);
                        setDossierAssigneeId(e.target.value);
                        setDossierResponsable(agent ? `${agent.prenom} ${agent.nom}` : '');
                      }}
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
                      <option value="">Choisir un agent habilité</option>
                      {dossierAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.prenom} {agent.nom}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Échéance légale initiale
                    </label>
                    <input
                      type="date"
                      required
                      value={dossierEcheance}
                      onChange={(e) => setDossierEcheance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateDossierModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !dossierAssigneeId}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-btn)',
                      backgroundColor: 'var(--color-accent)',
                      border: 'none',
                      color: 'var(--color-on-accent)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSaving ? 'Enregistrement...' : 'Créer et ouvrir le dossier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Modal de Modification / Cotation du Renseignement */}
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
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      Modification et Cotation du Renseignement
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Réf : {selectedRenseignement.reference} (Version {selectedRenseignement.version || 1})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Objet du renseignement *
                    </label>
                    <textarea
                      rows={2}
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
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Résumé / Faits constatés *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editResume}
                      onChange={(e) => setEditResume(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Provenance / Source d’origine *
                      </label>
                      <input
                        type="text"
                        required
                        value={editProvenance}
                        onChange={(e) => setEditProvenance(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-btn)',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Date de réception *
                      </label>
                      <input
                        type="date"
                        required
                        value={editDateReception}
                        onChange={(e) => setEditDateReception(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-btn)',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Pièces disponibles (séparées par virgules)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Bordereau de livraison, Déclaration SYDONIA, Facture proforma"
                      value={editPiecesDisponibles}
                      onChange={(e) => setEditPiecesDisponibles(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Section de cotation réservée aux managers */}
                  {isUserUnitManager && (
                    <div style={{
                      marginTop: '6px',
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Cotation et Instructions de Commandement (Responsable d’unité)
                      </div>

                      <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          >
                            <option value="NORMALE">Normale</option>
                            <option value="URGENTE">Urgente</option>
                            <option value="SIGNALEE">Signalée</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                            Délai prescrit (jours)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={editDelaiPrescritJours}
                            onChange={(e) => setEditDelaiPrescritJours(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-btn)',
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                          Degré de fiabilité / Cotation de la source
                        </label>
                        <input
                          type="text"
                          placeholder="Ex : Cotation A1 - Source entièrement digne de foi, faits recoupés"
                          value={editDegreFiabilite}
                          onChange={(e) => setEditDegreFiabilite(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-btn)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                          Instruction de commandement
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex : Procéder au recoupement auprès des douanes locales et préparer ouverture contradictoire..."
                          value={editInstructionCotation}
                          onChange={(e) => setEditInstructionCotation(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-btn)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {editError && (
                    <div role="alert" style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '6px' }}>
                      {editError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        color: 'var(--color-on-accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isEditing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal de Liaison à un Dossier Existant */}
        {showLinkModal && (
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
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      Lier à un Dossier d’Enquête Existant
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Renseignement {selectedRenseignement.reference} (Version {selectedRenseignement.version || 1})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Sélectionnez le dossier cible *
                    </label>
                    {(() => {
                      const linkedSet = new Set(selectedRenseignement.dossiersLies || []);
                      const available = dossiers.filter((d) => !linkedSet.has(d.id) && !linkedSet.has(d.reference));
                      if (available.length === 0) {
                        return (
                          <div style={{ padding: '12px', fontSize: '12px', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                            Aucun dossier disponible à rattacher (tous les dossiers accessibles sont déjà liés ou inexistants).
                          </div>
                        );
                      }
                      return (
                        <select
                          required
                          value={selectedCaseToLink}
                          onChange={(e) => setSelectedCaseToLink(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-btn)',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          <option value="">Choisir un dossier d’enquête</option>
                          {available.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.reference} — {d.entiteControlee.nom} ({d.statut})
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {linkError && (
                    <div role="alert" style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '6px' }}>
                      {linkError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isLinking || !selectedCaseToLink}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        color: 'var(--color-on-accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isLinking ? 'Liaison en cours...' : 'Confirmer la liaison'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal de Nouvelle Diffusion Inter-Bureaux */}
        {showCreateDisseminationModal && (
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
                  maxWidth: '540px',
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
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      Nouvelle Diffusion Inter-Bureaux
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Transmission du renseignement {selectedRenseignement.reference} à une autre unité douanière
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateDisseminationModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateDisseminationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Bureau / Unité destinataire *
                    </label>
                    <select
                      required
                      value={newDissRecipientUnit}
                      onChange={(e) => setNewDissRecipientUnit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      {allUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Canal de transmission *
                      </label>
                      <select
                        value={newDissChannel}
                        onChange={(e) => setNewDissChannel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-btn)',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="Bordereau officiel">Bordereau officiel</option>
                        <option value="Télégramme officiel">Télégramme officiel</option>
                        <option value="Courrier confidentiel">Courrier confidentiel</option>
                        <option value="Transmission électronique GELEC">Transmission électronique GELEC</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Référence du pli / transmission
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : DIFF-2026/044"
                        value={newDissReference}
                        onChange={(e) => setNewDissReference(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-btn)',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Action attendue de l’unité destinataire *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newDissAction}
                      onChange={(e) => setNewDissAction(e.target.value)}
                      placeholder="Ex : Contrôle contradictoire local sur les pièces de dédouanement et recoupement des écritures comptables..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={newDissSendNow}
                      onChange={(e) => setNewDissSendNow(e.target.checked)}
                    />
                    <span>Confirmer l’envoi immédiatement (horodate la transmission formelle)</span>
                  </label>

                  {disseminationError && (
                    <div role="alert" style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '6px' }}>
                      {disseminationError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateDisseminationModal(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingDissemination || !newDissRecipientUnit}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        color: 'var(--color-on-accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSavingDissemination ? 'Enregistrement...' : 'Créer la diffusion'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal d'Enregistrement d'un Retour de Diffusion */}
        {showReturnModal && selectedDissForReturn && (
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
                  maxWidth: '500px',
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
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      Enregistrer un Retour de Diffusion
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Diffusion réf. {selectedDissForReturn.reference || selectedDissForReturn.id.slice(0, 8)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Date effective de réception *
                    </label>
                    <input
                      type="date"
                      required
                      value={returnReceivedAt}
                      onChange={(e) => setReturnReceivedAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={returnAcknowledged}
                      onChange={(e) => setReturnAcknowledged(e.target.checked)}
                    />
                    <span>Accusé de réception formel et prise en compte confirmée</span>
                  </label>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Note d’analyse / Observations de l’unité réceptrice
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex : Dossier local ouvert sous référence BN-2026/012, vérification contradictoire en cours..."
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {disseminationError && (
                    <div role="alert" style={{ fontSize: '12px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px', borderRadius: '6px' }}>
                      {disseminationError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowReturnModal(false)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingReturn}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--color-accent)',
                        border: 'none',
                        color: 'var(--color-on-accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSavingReturn ? 'Enregistrement...' : 'Enregistrer le retour'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. VUE PRINCIPALE : TABLEAU DES RENSEIGNEMENTS
  // =========================================================================
  return (
    <div key="renseignements-list" className="view-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Renseignements Douaniers
            </h1>
           
          </div>
        </div>

        {/* Bouton Nouvelle Demande de Renseignement (director) */}
        {currentUser.capabilities?.includes('intelligence.create') && (
          <button
            type="button"
            onClick={() => setShowCreateRenseignementModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Nouvelle demande de renseignement</span>
          </button>
        )}
      </div>

      {/* Barre de Filtres et Recherche */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-surface)',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={14} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Rechercher par référence, origine, objet, agent affecté..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Pilules de Filtrage par Source */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'TOUS', label: `Tous (${visibleItems.length})` },
            { id: 'DOUANE', label: 'Douane' },
            { id: 'RAPPORT', label: 'Rapports de service' },
            { id: 'OPINION', label: 'Informations de l’opinion' },
          ].map((tab) => {
            const isSelected = sourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                  color: isSelected ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau des Renseignements */}
      <div
        className="responsive-table-container"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          overflowX: 'auto',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
          
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Origine & Source</th>
              <th style={{ padding: '12px 16px' }}>Priorité</th>
              <th style={{ padding: '12px 16px' }}>Agent Affecté</th>
              <th style={{ padding: '12px 16px' }}>Statut </th>
              
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun renseignement trouvé.
                </td>
              </tr>
            ) : (
              filteredItems
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((ren) => (
                  <tr
                    key={ren.id}
                    onClick={() => setSelectedId(ren.id)}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Date */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {ren.dateReception}
                      </div>
                    </td>

                    {/* Origine & Source */}
                    <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '12px' }}>
                        {ren.origine}
                      </div>
                    </td>

                    {/* Priorité */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {ren.priorite || 'Normale'}
                      </span>
                    </td>

                    {/* Agent affecté */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {ren.coteA || 'Non coté'}
                      </div>
                    </td>

                    {/* Statut & Issue */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {getRenseignementStatut(ren)}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        {/* Pagination discrète */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="renseignements"
        />
      </div>

      {/* Modal : Nouvelle Demande de Renseignement (director) */}
      {showCreateRenseignementModal && (
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
              maxWidth: '580px',
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
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Nouvelle Demande de Renseignement
                </h3>

              </div>
              <button
                type="button"
                onClick={() => setShowCreateRenseignementModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRenseignementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Source / Origine */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Source d’origine du renseignement *
                </label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="Douane )">Douane </option>
                  <option value="Rapport de service directoristratif">Rapport de service directoristratif</option>
                  <option value="Informations de l’opinion">Informations de l’opinion </option>
                
                </select>
              </div>

              {/* Objet */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Objet du renseignement *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex : Signalement sur minoration de fret et sous-évaluation de valeur en douane sur importation de réactifs..."
                  value={formObjet}
                  onChange={(e) => setFormObjet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div className="renseignement-create-access">
                <label className="renseignement-create-field">
                  <span>Unité</span>
                  <select value={formUnit} onChange={(event) => { setFormUnit(event.target.value); setFormClassification(0); setFormUploadedFiles([]); }}>
                    {eligibleMemberships.map((membership) => <option key={membership.unit.id} value={membership.unit.id}>{membership.unit.name}</option>)}
                  </select>
                </label>
                <label className="renseignement-create-field">
                  <span>Niveau d’accès</span>
                  <select value={formClassification} onChange={(event) => setFormClassification(Number(event.target.value) as 0 | 1)}>
                    <option value={0}>Interne</option>
                    {formMembership && formMembership.clearance >= 1 && <option value={1}>Restreint</option>}
                  </select>
                </label>
              </div>
              {/* Pièces disponibles & Documents justificatifs avec Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Pièces disponibles & Documents justificatifs
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
                    cursor: canUpload ? 'pointer' : 'not-allowed',
                    opacity: canUpload ? 1 : 0.6,
                    marginBottom: '6px',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Upload size={14} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '12px', color: formUploadedFiles.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1 }}>
                    {formUploadedFiles.length > 0
                      ? `${formUploadedFiles.length} document(s) sélectionné(s)`
                      : 'Cliquer pour choisir les pièces disponibles...'}
                  </span>
                  <input
                    type="file"
                    multiple
                    disabled={!canUpload}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleUploadedFilesChange}
                    aria-label="Pièces disponibles et documents justificatifs"
                    aria-describedby={!canUpload ? 'renseignement-upload-help' : undefined}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: canUpload ? 'pointer' : 'not-allowed' }}
                  />
                </label>

                {!canUpload && (
                  <p id="renseignement-upload-help" className="renseignement-create-help">
                    Le dépôt de pièces nécessite l’habilitation correspondante dans cette unité.
                  </p>
                )}

                {formUploadedFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '6px' }}>
                    {formUploadedFiles.map((f, i) => (
                      <div key={i} style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                        • {f.name} ({Math.round(f.size / 1024)} Ko)
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '6px' }}>
                    Aucun fichier n'y est associé
                  </div>
                )}


              </div>

              {/* Niveau de priorité (Date prise automatiquement à la date du jour) */}


              {/* Affectation à qui (Agent désigné) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Affectation à qui (Inspecteur ou Agent désigné) *
                </label>
                <select
                  value={effectiveFormAffectation}
                  onChange={(e) => setFormAffectation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">Choisir un agent habilité</option>
                  {inspecteursDisponibles.map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {insp.prenom} {insp.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions de commandement */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Instruction de qualification préalable
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Vérifier les quittances d'apurement et préparer l'ouverture du dossier d'enquête contradictoire..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {actionError && <div role="alert" style={{ fontSize: '12px', color: 'var(--color-warning)' }}>{actionError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateRenseignementModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !effectiveFormAffectation || !onAddRenseignement}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-accent)',
                    border: 'none',
                    color: 'var(--color-on-accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer et affecter'}
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

export default RenseignementsView;
