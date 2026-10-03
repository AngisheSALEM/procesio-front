import type { DemandeCommunication, DossierEnquete, FeuilleObservation, RenseignementItem } from '../types';
import { apiAll, apiGet, apiPatch, apiPost, uploadFile, type ApiCase, type ApiCaseAssignment, type ApiCaseTimelineEntry, type ApiDecision, type ApiDissemination, type ApiDisseminationReturn, type ApiDocument, type ApiIntelligence, type ApiRequest, type ApiResponse, type ApiSheet, type ApiUnit, type ApiUser } from './client';
import { latestVersion } from './mappers';
import type { WorkspaceData } from './workspace';
import { decisionSources, proposeDecision } from './decisions';

function required(value: string | undefined | null, label: string): string {
  if (!value?.trim()) throw new Error(`${label} est requis pour enregistrer cette donnée.`);
  return value.trim();
}

function priority(value?: string): 'normal' | 'urgent' | 'flagged' {
  return value === 'URGENTE' ? 'urgent' : value === 'SIGNALEE' ? 'flagged' : 'normal';
}

function activeUnit(user: ApiUser, requested?: string, _workspace?: WorkspaceData): string {
  const eligible = user.memberships.filter((item) => item.role === 'manager' || item.role === 'investigator' || item.role === 'auditor');
  if (!eligible.length && user.memberships.length) {
    return user.memberships[0].unit.id;
  }
  const membership = eligible.find((item) =>
    requested && [item.unit.id, item.unit.code, item.unit.name].some((u) =>
      u.toLowerCase() === requested.toLowerCase() ||
      requested.toLowerCase().includes(u.toLowerCase()) ||
      u.toLowerCase().includes(requested.toLowerCase())
    ),
  ) || eligible[0] || user.memberships[0];
  if (!membership) throw new Error('Aucune unité active ne permet cette opération.');
  return membership.unit.id;
}

function resolveAssignee(workspace: WorkspaceData, label: string | undefined, explicit?: number, unit?: string, classification = 0): number {
  const eligibleIds = unit ? workspace.agentScopes[unit]?.[classification === 1 ? 'restricted' : 'ordinary'] || [] : workspace.assignableAgentIds;
  if (explicit && (eligibleIds.length === 0 || eligibleIds.includes(explicit))) return explicit;

  // Priorité absolue aux comptes réels (kabamba, tshilumba, mukendi) sur les alias de démo
  const candidateUsers = workspace.users
    .filter((user) => eligibleIds.length === 0 || eligibleIds.includes(user.id))
    .sort((a, b) => {
      const aDemo = a.username.startsWith('demo_') ? 1 : 0;
      const bDemo = b.username.startsWith('demo_') ? 1 : 0;
      return aDemo - bDemo;
    });

  if (label) {
    const cleanLabel = label.toLowerCase()
      .replace(/inspecteur|contrôleur|vérificateur|adjoint|senior|chef de brigade|\(.*?\)/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

    // 1. Exact match on username or full name
    const exact = candidateUsers.find((user) =>
      [user.username, `${user.first_name} ${user.last_name}`.trim()].some(
        (name) => name.localeCompare(label, 'fr', { sensitivity: 'base' }) === 0
      )
    );
    if (exact) return exact.id;

    // 2. Substring / fuzzy match on last name and first name
    const match = candidateUsers.find((user) => {
      const uFirst = (user.first_name || '').toLowerCase();
      const uLast = (user.last_name || '').toLowerCase();
      const uName = user.username.toLowerCase();
      if (uLast && (label.toLowerCase().includes(uLast) || cleanLabel.includes(uLast))) return true;
      if (uFirst && uLast && (label.toLowerCase().includes(uFirst) && label.toLowerCase().includes(uLast))) return true;
      if (uName && label.toLowerCase().includes(uName)) return true;
      return false;
    });
    if (match) return match.id;
  }

  // 3. Fallback to first eligible agent in unit or first available agent
  if (candidateUsers.length > 0) {
    return candidateUsers[0].id;
  }
  if (workspace.assignableAgentIds && workspace.assignableAgentIds.length > 0) {
    return workspace.assignableAgentIds[0];
  }
  if (workspace.users && workspace.users.length > 0) {
    return workspace.users[0].id;
  }
  throw new Error('Aucun agent habilité n’est disponible.');
}

export async function createCase(workspace: WorkspaceData, user: ApiUser, data: DossierEnquete, intelligenceId?: string, assigneeId?: number): Promise<ApiCase> {
  const intelligence = intelligenceId ? workspace.intelligence.find((item) => item.id === intelligenceId) : undefined;
  const unit = intelligence?.unit || activeUnit(user, data.unite, workspace);
  const assignee = resolveAssignee(workspace, data.responsable, assigneeId, unit, intelligence?.classification || 0);
  if (intelligence?.classification === 1 && workspace.restrictedAgentIds?.length && !workspace.restrictedAgentIds.includes(assignee)) {
    throw new Error('L’agent choisi n’a pas l’habilitation requise pour ce renseignement restreint.');
  }
  const entity = data.entiteControlee;
  const teamIds = [...new Set((data.equipe || []).map((name) => {
    try {
      return resolveAssignee(workspace, name, undefined, unit, intelligence?.classification || 0);
    } catch {
      return null;
    }
  }).filter((id): id is number => id !== null && id !== assignee))];
  const result = await apiPost<ApiCase>('/dossiers/', {
    unit, classification: intelligence?.classification || 0, assignee,
    assignment_reason: required(data.motifOuverture || 'Ouverture consécutive au plan de contrôle', 'Le motif d’ouverture'),
    next_action: required(data.prochaineAction || data.objet || 'Notification de la réquisition', 'La prochaine action'),
    object: data.objet || '', perimeter: data.perimetre || '', opening_reason: data.motifOuverture || '',
    ...(entity?.nom?.trim() ? { controlled_entity: {
      nom: entity.nom.trim(), rccm: entity.rccm || '', nif: entity.nif || '',
      type_entite: entity.typeEntite || '', role_dans_dossier: entity.roleDansDossier || '',
      adresse: entity.adresse || '', contact: entity.contact || '', type_cible: entity.typeCible || '',
      pour_le_compte_de: entity.pourLeCompteDe || '',
    } } : {}),
    team: teamIds,
    customs_operations: (data.operationsDouanieres || []).map((operation) => ({
      reference_sydonia: operation.referenceSydonia, bureau: operation.bureau,
      date_declaration: operation.dateDeclaration || null, regime: operation.regime,
      marchandise: operation.marchandise, valeur_declaree_usd: operation.valeurDeclareeUSD,
    })),
    priority: priority(data.priorite), deadline: data.echeance || null,
  });
  if (intelligence) {
    try {
      await apiPost(`/renseignements/${intelligence.id}/dossiers/`, { version: intelligence.version, case: result.id });
    } catch (error) {
      throw new Error(`Le dossier ${result.reference} a été créé, mais sa liaison au renseignement a échoué : ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

export async function createIntelligence(workspace: WorkspaceData, user: ApiUser, item: RenseignementItem, files: File[] = [], assigneeId?: number) {
  const unit = activeUnit(user, item.serviceDestinataire, workspace);
  const assignee = resolveAssignee(workspace, item.coteA, assigneeId, unit, item.niveauAcces.toLowerCase().includes('restreint') ? 1 : 0);
  if (item.niveauAcces.toLowerCase().includes('restreint') && workspace.restrictedAgentIds?.length && !workspace.restrictedAgentIds.includes(assignee)) {
    throw new Error('L’agent choisi n’a pas l’habilitation requise pour un renseignement restreint.');
  }
  if (files.length && !user.memberships.some((membership) => membership.unit.id === unit && membership.capabilities.includes('source.write'))) {
    throw new Error('Votre compte ne peut pas déposer de pièces sur un renseignement. Retirez les fichiers ou demandez l’habilitation nécessaire.');
  }
  const isManager = user.memberships.some((membership) => membership.unit.id === unit && membership.role === 'manager');
  const payload: Record<string, unknown> = {
    unit, classification: item.niveauAcces.toLowerCase().includes('restreint') ? 1 : 0,
    subject: required(item.objet, 'L’objet'), summary: required(item.resume, 'Le résumé'),
    provenance: required(item.origine, 'La provenance'), occurred_on: required(item.dateReception, 'La date de réception'),
    assignee, available_pieces: (item.piecesDisponibles || []).join('\n'),
  };
  if (isManager) Object.assign(payload, {
    priority: priority(item.priorite), reliability: item.degreFiabilite || '',
    rating_instruction: item.instructionCotation || '', rating_deadline_days: item.delaiPrescritJours || null,
  });
  const created = await apiPost<ApiIntelligence>('/renseignements/', payload);
  try {
    for (const file of files) await uploadFile(file, { intelligence: created.id });
  } catch (error) {
    throw new Error(`Le renseignement ${created.reference || created.id} a été créé, mais une pièce n’a pas pu être déposée : ${error instanceof Error ? error.message : String(error)}`);
  }
  return created;
}

export async function updateIntelligence(workspace: WorkspaceData, user: ApiUser, item: RenseignementItem) {
  const existing = workspace.intelligence.find((record) => record.id === item.id);
  if (!existing) throw new Error('Renseignement introuvable. Rechargez la page.');
  const isManager = user.memberships.some((membership) => membership.unit.id === existing.unit && membership.role === 'manager');
  const payload: Record<string, unknown> = {
    version: existing.version, subject: required(item.objet, 'L’objet'),
    summary: required(item.resume, 'Le résumé'), provenance: required(item.origine, 'La provenance'),
    occurred_on: required(item.dateReception, 'La date de réception'),
    available_pieces: (item.piecesDisponibles || []).join('\n'),
  };
  if (isManager) Object.assign(payload, {
    priority: priority(item.priorite), reliability: item.degreFiabilite || '',
    rating_instruction: item.instructionCotation || '', rating_deadline_days: item.delaiPrescritJours || null,
  });
  return apiPatch<ApiIntelligence>(`/renseignements/${item.id}/`, payload);
}

function requestPayload(item: DemandeCommunication) {
  return {
    target_type: item.destinataire.qualite.toLowerCase().includes('commissionnaire') ? 'broker' : 'organization',
    target_name: required(item.destinataire.nom, 'Le destinataire'),
    represented_name: item.destinataire.representant || item.destinataire.pourLeCompteDe || '',
    target_address: item.destinataire.adresse || '', subject: required(item.objet, 'L’objet'),
    legal_basis: item.baseLegale || '', delivery_method: item.modaliteRemise || '',
    internal_comments: item.commentairesInternes || '', due_on: item.echeanceReponse || null,
    items: item.elementsDemandes.map((element) => ({
      id: /^[0-9a-f-]{36}$/i.test(element.id) ? element.id : null,
      label: required(element.libelle, 'Le libellé d’un élément'), period: element.periodeConcernee || '',
      reason: element.motifExigence || '',
    })),
  };
}

async function acceptedDocument(file: File | string, caseId: string): Promise<ApiDocument> {
  const document = typeof file === 'string' ? await apiGet<ApiDocument>(`/documents/${file}/`) : await uploadFile(file, { case: caseId });
  if (document.case !== caseId || document.content_type !== 'application/pdf') throw new Error('Choisissez une pièce PDF du dossier.');
  if (document.state !== 'accepted') {
    throw new Error(`La pièce ${document.original_name} est ${document.state === 'rejected' ? 'non utilisable' : 'encore en vérification'}. Consultez l’onglet Documents, puis sélectionnez cette pièce lorsqu’elle sera disponible.`);
  }
  return document;
}

export async function createRequest(item: DemandeCommunication, file?: File): Promise<ApiRequest> {
  if (item.statut !== 'BROUILLON') throw new Error('Enregistrez d’abord un brouillon. Validation, signature et émission exigent des preuves distinctes.');
  const caseId = required(item.dossierId, 'Le dossier');
  if (file && file.size > 10 * 1024 * 1024) throw new Error('Le PDF dépasse la limite de 10 Mio.');
  const created = await apiPost<ApiRequest>('/demandes/', {
    case: caseId, ...requestPayload(item), mode: file ? 'imported' : 'generated',
  });
  if (file) {
    try {
      await uploadFile(file, { case: caseId });
    } catch (cause) {
      throw new Error(`Brouillon ${created.reference || created.id} enregistré, mais dépôt du PDF impossible : ${cause instanceof Error ? cause.message : String(cause)}. Ouvrez ce brouillon et déposez la pièce dans Documents.`);
    }
  }
  return created;
}

export async function saveRequest(workspace: WorkspaceData, item: DemandeCommunication, file?: File): Promise<void> {
  const existing = workspace.requests[item.dossierId]?.find((record) => record.id === item.id);
  if (!existing) {
    await createRequest(item, file);
    return;
  }
  const priorResponses = await apiAll<ApiResponse>(`/demandes/${existing.id}/reponses/?page_size=100`);
  const newResponses = item.reponsesRecues.filter((response) => !priorResponses.some((old) => old.id === response.id));
  if (newResponses.length) {
    if (newResponses.length !== 1) throw new Error('Enregistrez une réponse à la fois.');
    if (!file && !item.reponseDocumentId) throw new Error('Le PDF réel de la réponse est requis.');
    const document = await acceptedDocument(file || item.reponseDocumentId!, existing.case);
    const response = newResponses[0];
    const itemIds = response.elementsFournisIds.filter((id) => existing.items.some((element) => element.id === id));
    if (itemIds.length !== response.elementsFournisIds.length) throw new Error('Les éléments de la demande ont changé. Rechargez la page.');
    if (!itemIds.length) throw new Error('Associez la réponse à au moins un élément demandé.');
    try {
      await apiPost(`/demandes/${existing.id}/reponses/`, {
        letter: document.id, received_on: required(response.dateReception, 'La date de réception'),
        external_reference: response.referenceCourrier || '', sender_name: response.auteur || '',
        note: response.analyseEnqueteur || '', item_ids: itemIds,
      });
    } catch (error) {
      throw new Error(`La pièce ${document.original_name} a été déposée, mais la réponse n’a pas été enregistrée : ${error instanceof Error ? error.message : String(error)}`);
    }
    return;
  }
  const priorEvaluation = workspace.demandesParDossier[item.dossierId]?.find((record) => record.id === item.id)?.evaluationReponse;
  if (item.evaluationReponse && item.evaluationReponse !== priorEvaluation) {
    const linkedIds = new Set(priorResponses.flatMap((response) => response.item_links
      .filter((link) => !link.voided_at).map((link) => link.item)));
    const linkedItems = existing.items.filter((element) => linkedIds.has(element.id));
    if (item.evaluationReponse === 'SATISFAISANTE' && linkedItems.length !== existing.items.length) {
      throw new Error('Tous les éléments demandés doivent avoir une réponse avant une appréciation globale satisfaisante.');
    }
    if (!linkedItems.length) throw new Error('Aucun élément ne possède de réponse liée à apprécier.');
    const satisfied = item.evaluationReponse === 'SATISFAISANTE';
    const reason = required(item.motifSatisfaction, 'Le motif de l’appréciation');
    for (const element of linkedItems) {
      await apiPost(`/demandes/${existing.id}/elements/${element.id}/appreciations/`, {
        version: element.assessment_version, receipt: 'received',
        completeness: satisfied ? 'complete' : latestVersion(workspace.assessments[element.id] || [])?.completeness || 'unknown',
        substance: satisfied ? 'satisfactory' : 'unsatisfactory', reason,
      });
    }
    return;
  }
  if (item.statut === 'EMISE' && existing.state !== 'issued') {
    throw new Error('L’émission exige une signature et une preuve d’envoi validées par le serveur.');
  }
  if (existing.state !== 'draft') {
    throw new Error('Cette demande ne peut plus être modifiée. Créez un acte complémentaire selon la procédure.');
  }
  const updated = await apiPatch<ApiRequest>(`/demandes/${existing.id}/`, {
    version: existing.version, ...requestPayload(item), ...(file ? { mode: 'imported' } : {}),
  });
  if (file) {
    try {
      const document = await uploadFile(file, { case: existing.case });
      if (document.state === 'accepted') await apiPost(`/demandes/${updated.id}/preparer/`, { version: updated.version, document: document.id });
    } catch (cause) {
      throw new Error(`Brouillon enregistré, mais préparation du PDF impossible : ${cause instanceof Error ? cause.message : String(cause)}. Reprenez depuis ce brouillon et sélectionnez la pièce déjà déposée dans Documents.`);
    }
  }
}

function sheetPayload(item: FeuilleObservation, documentId?: string) {
  const rawObservations = (item.observations && item.observations.length > 0)
    ? item.observations
    : [{
        id: undefined,
        code: 'O1',
        faitsConstates: item.objetControle || 'Constatations préliminaires relevées au cours du contrôle.',
        titre: item.objetControle || 'Constat préliminaire',
        referencesJuridiques: item.cadreLegal || '',
        questionsAssujetti: '',
        analyseMotivee: '',
        statutConstat: 'OUVERT' as const,
        justificatifsAssocies: [],
      }];
  const observations = rawObservations.map((observation, index) => ({
    id: observation.id || null,
    facts: required(observation.faitsConstates, 'Les faits constatés'), title: observation.titre || '',
    legal_references: observation.referencesJuridiques || '', questions: observation.questionsAssujetti || '',
    analysis: observation.analyseMotivee || '',
    documents: [...new Set([
      ...(observation.justificatifsAssocies || []).filter(Boolean),
      ...(index === 0 && documentId ? [documentId] : []),
    ])],
  }));
  if (!observations.length) throw new Error('Ajoutez au moins une observation.');
  return {
    recipient_address: item.adresse?.trim() || 'Siège social de l’assujetti',
    concerned_party: required(item.destinataire, 'Le destinataire'),
    subject: item.objetControle || '', legal_basis: item.cadreLegal || '',
    meeting_on: item.dateReunionCloturePrevue || null,
    facts: observations.map((observation) => observation.facts).join('\n').slice(0, 4000),
    observations,
  };
}

export async function createSheet(item: FeuilleObservation, file?: File): Promise<ApiSheet> {
  const caseId = required(item.dossierId, 'Le dossier');
  const document = file ? await acceptedDocument(file, caseId) : undefined;
  return apiPost<ApiSheet>('/feuilles/', { case: caseId, origin: item.missionId ? 'mission' : 'field', ...(item.missionId ? { mission: item.missionId } : {}), ...sheetPayload(item, document?.id) });
}

export async function saveSheet(workspace: WorkspaceData, item: FeuilleObservation, file?: File): Promise<void> {
  const existing = workspace.sheets[item.dossierId]?.find((record) => record.id === item.id);
  if (!existing) {
    await createSheet(item, file);
    return;
  }
  if (item.decisionFinale || item.statutFeuille === 'NOTIFIEE' || item.statutFeuille === 'CLOTUREE') {
    throw new Error('Une feuille ne peut être notifiée ou clôturée depuis ce formulaire sans décision et preuve validées.');
  }
  const document = file ? await acceptedDocument(file, existing.case) : undefined;
  await apiPatch<ApiSheet>(`/feuilles/${existing.id}/`, { version: existing.version, ...sheetPayload(item, document?.id) });
}

export async function proposeClassification(workspace: WorkspaceData, caseId: string, reason: string): Promise<ApiDecision> {
  const source = decisionSources(workspace, caseId).find((row) => row.conclusion === 'satisfactory');
  if (!source) throw new Error('Une appréciation satisfaisante actuelle du dossier est requise avant une proposition de classement.');
  return proposeDecision(workspace, caseId, 'classification', reason, source.id);
}

export async function updateCase(
  workspace: WorkspaceData,
  _user: ApiUser,
  caseId: string,
  data: {
    version?: number;
    next_action?: string;
    object?: string;
    perimeter?: string;
    opening_reason?: string;
    priority?: 'normal' | 'urgent' | 'flagged';
    deadline?: string | null;
    team?: number[];
    controlled_entity?: Partial<DossierEnquete['entiteControlee']>;
    customs_operations?: DossierEnquete['operationsDouanieres'];
  }
): Promise<ApiCase> {
  const currentCase = workspace.cases.find((row) => row.id === caseId);
  const effectiveVersion = data.version ?? currentCase?.version;
  if (!effectiveVersion) throw new Error('Version du dossier indisponible.');
  const payload: Record<string, unknown> = { version: effectiveVersion };
  if (data.next_action !== undefined) payload.next_action = required(data.next_action, 'La prochaine action');
  if (data.object !== undefined) payload.object = data.object;
  if (data.perimeter !== undefined) payload.perimeter = data.perimeter;
  if (data.opening_reason !== undefined) payload.opening_reason = data.opening_reason;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.deadline !== undefined) payload.deadline = data.deadline;
  if (data.team !== undefined) payload.team = data.team;
  if (data.controlled_entity) {
    const entity = data.controlled_entity;
    payload.controlled_entity = {
      nom: required(entity.nom, 'Le nom de l’opérateur'),
      rccm: entity.rccm || '',
      nif: entity.nif || '',
      type_entite: entity.typeEntite || '',
      role_dans_dossier: entity.roleDansDossier || 'Entreprise contrôlée',
      adresse: entity.adresse || '',
      contact: entity.contact || '',
      type_cible: entity.typeCible || '',
      pour_le_compte_de: entity.pourLeCompteDe || '',
    };
  }
  if (data.customs_operations) {
    payload.customs_operations = data.customs_operations.map((op) => ({
      reference_sydonia: op.referenceSydonia,
      bureau: op.bureau || '',
      date_declaration: op.dateDeclaration || null,
      regime: op.regime || '',
      marchandise: op.marchandise || '',
      valeur_declaree_usd: op.valeurDeclareeUSD || 0,
    }));
  }
  return apiPatch<ApiCase>(`/dossiers/${caseId}/`, payload);
}

export async function assignCase(
  _workspace: WorkspaceData,
  _user: ApiUser,
  caseId: string,
  newAssigneeId: number,
  reason: string,
  version: number,
): Promise<ApiCase> {
  const cleanReason = required(reason, 'Le motif de réaffectation');
  return apiPost<ApiCase>(`/dossiers/${caseId}/affectations/`, {
    version,
    assignee: newAssigneeId,
    new_assignee: newAssigneeId,
    reason: cleanReason,
  });
}

export async function fetchCaseTimeline(caseId: string): Promise<ApiCaseTimelineEntry[]> {
  return apiAll<ApiCaseTimelineEntry>(`/dossiers/${caseId}/chronologie/?page_size=100`);
}

export async function fetchCaseAssignments(caseId: string): Promise<ApiCaseAssignment[]> {
  return apiAll<ApiCaseAssignment>(`/dossiers/${caseId}/affectations/?page_size=100`);
}

export async function linkIntelligenceToCase(
  workspace: WorkspaceData,
  intelligenceId: string,
  caseId: string,
  version?: number,
): Promise<ApiIntelligence> {
  const item = workspace.intelligence.find((entry) => entry.id === intelligenceId);
  const currentVersion = version ?? item?.version;
  if (!currentVersion) throw new Error('Version du renseignement indisponible.');
  return apiPost<ApiIntelligence>(`/renseignements/${intelligenceId}/dossiers/`, {
    version: currentVersion,
    case: caseId,
  });
}

export async function fetchProtectedSource(intelligenceId: string): Promise<string> {
  const result = await apiGet<{ identity: string }>(`/renseignements/${intelligenceId}/source/`);
  return result.identity;
}

export async function fetchDisseminations(intelligenceId: string): Promise<ApiDissemination[]> {
  return apiAll<ApiDissemination>(`/renseignements/${intelligenceId}/diffusions/?page_size=100`);
}

export async function createDissemination(
  intelligenceId: string,
  data: {
    recipient_unit: string;
    channel: string;
    expected_action: string;
    reference?: string;
    sent_at?: string | null;
  }
): Promise<ApiDissemination> {
  return apiPost<ApiDissemination>(`/renseignements/${intelligenceId}/diffusions/`, {
    recipient_unit: required(data.recipient_unit, 'L’unité destinataire'),
    channel: required(data.channel, 'Le canal de transmission'),
    expected_action: required(data.expected_action, 'L’action attendue'),
    reference: data.reference || '',
    sent_at: data.sent_at || null,
    idempotency_key: crypto.randomUUID(),
  });
}

export async function confirmDissemination(
  disseminationId: string,
  sentAt?: string,
): Promise<ApiDissemination> {
  return apiPost<ApiDissemination>(`/diffusions/${disseminationId}/confirmer/`, {
    sent_at: sentAt || new Date().toISOString(),
  });
}

export async function fetchDisseminationReturns(disseminationId: string): Promise<ApiDisseminationReturn[]> {
  return apiAll<ApiDisseminationReturn>(`/diffusions/${disseminationId}/retours/?page_size=100`);
}

export async function createDisseminationReturn(
  disseminationId: string,
  data: {
    acknowledged: boolean;
    received_at: string;
    note?: string;
  }
): Promise<ApiDisseminationReturn> {
  return apiPost<ApiDisseminationReturn>(`/diffusions/${disseminationId}/retours/`, {
    acknowledged: data.acknowledged,
    received_at: required(data.received_at, 'La date de réception'),
    note: data.note || '',
    idempotency_key: crypto.randomUUID(),
  });
}

export async function fetchAllUnits(): Promise<ApiUnit[]> {
  return apiAll<ApiUnit>('/unites/?all=true&page_size=100');
}

