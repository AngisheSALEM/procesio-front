import type { DemandeCommunication, DossierEnquete, FeuilleObservation, RenseignementItem } from '../types';
import { apiAll, apiPatch, apiPost, uploadFile, type ApiCase, type ApiDecision, type ApiDocument, type ApiIntelligence, type ApiRequest, type ApiResponse, type ApiSheet, type ApiUser } from './client';
import type { WorkspaceData } from './workspace';

function required(value: string | undefined | null, label: string): string {
  if (!value?.trim()) throw new Error(`${label} est requis pour enregistrer cette donnée.`);
  return value.trim();
}

function priority(value?: string): 'normal' | 'urgent' | 'flagged' {
  return value === 'URGENTE' ? 'urgent' : value === 'SIGNALEE' ? 'flagged' : 'normal';
}

function activeUnit(user: ApiUser, requested?: string, workspace?: WorkspaceData): string {
  const eligible = user.memberships.filter((item) => item.role === 'manager' || item.role === 'investigator');
  const membership = eligible.find((item) =>
    requested && [item.unit.id, item.unit.code, item.unit.name].includes(requested),
  ) || (eligible.length === 1 ? eligible[0] : undefined);
  if (!membership) throw new Error('Aucune unité active ne permet cette opération.');
  if (requested && workspace && eligible.length > 1 && ![membership.unit.id, membership.unit.code, membership.unit.name].includes(requested)) {
    throw new Error('L’unité sélectionnée ne correspond pas à une habilitation active.');
  }
  return membership.unit.id;
}

function resolveAssignee(workspace: WorkspaceData, label: string | undefined, explicit?: number): number {
  if (explicit && workspace.assignableAgentIds.includes(explicit)) return explicit;
  const agent = workspace.users.filter((user) => workspace.assignableAgentIds.includes(user.id)).find((user) =>
    label && [user.username, `${user.first_name} ${user.last_name}`.trim()].some((name) => name.localeCompare(label, 'fr', { sensitivity: 'base' }) === 0),
  );
  if (!agent) throw new Error('Choisissez un agent habilité dans la liste des agents.');
  return agent.id;
}

export async function createCase(workspace: WorkspaceData, user: ApiUser, data: DossierEnquete, intelligenceId?: string, assigneeId?: number): Promise<ApiCase> {
  const intelligence = intelligenceId ? workspace.intelligence.find((item) => item.id === intelligenceId) : undefined;
  const unit = intelligence?.unit || activeUnit(user, data.unite, workspace);
  const assignee = resolveAssignee(workspace, data.responsable, assigneeId);
  if (intelligence?.classification === 1 && !workspace.restrictedAgentIds.includes(assignee)) {
    throw new Error('L’agent choisi n’a pas l’habilitation requise pour ce renseignement restreint.');
  }
  const entity = data.entiteControlee;
  const result = await apiPost<ApiCase>('/dossiers/', {
    unit, classification: intelligence?.classification || 0, assignee,
    assignment_reason: required(data.motifOuverture, 'Le motif d’ouverture'),
    next_action: required(data.prochaineAction || data.objet, 'La prochaine action'),
    object: data.objet || '', perimeter: data.perimetre || '', opening_reason: data.motifOuverture || '',
    ...(entity?.nom?.trim() ? { controlled_entity: {
      nom: entity.nom.trim(), rccm: entity.rccm || '', nif: entity.nif || '',
      type_entite: entity.typeEntite || '', role_dans_dossier: entity.roleDansDossier || '',
      adresse: entity.adresse || '', contact: entity.contact || '', type_cible: entity.typeCible || '',
      pour_le_compte_de: entity.pourLeCompteDe || '',
    } } : {}),
    team: (data.equipe || []).map((name) => resolveAssignee(workspace, name)),
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
  const assignee = resolveAssignee(workspace, item.coteA, assigneeId);
  if (item.niveauAcces.toLowerCase().includes('restreint') && !workspace.restrictedAgentIds.includes(assignee)) {
    throw new Error('L’agent choisi n’a pas l’habilitation requise pour un renseignement restreint.');
  }
  const unit = activeUnit(user, item.serviceDestinataire, workspace);
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
      label: required(element.libelle, 'Le libellé d’un élément'), period: element.periodeConcernee || '',
      reason: element.motifExigence || '',
    })),
  };
}

async function acceptedDocument(file: File, caseId: string): Promise<ApiDocument> {
  const document = await uploadFile(file, { case: caseId });
  if (document.state !== 'accepted') {
    throw new Error('Le fichier a été déposé mais attend son contrôle de sécurité. Réessayez après acceptation du document.');
  }
  return document;
}

export async function createRequest(item: DemandeCommunication, file?: File): Promise<ApiRequest> {
  if (item.statut !== 'BROUILLON') throw new Error('Enregistrez d’abord un brouillon. Validation, signature et émission exigent des preuves distinctes.');
  const caseId = required(item.dossierId, 'Le dossier');
  let imported: ApiDocument | undefined;
  if (file) imported = await uploadFile(file, { case: caseId });
  const created = await apiPost<ApiRequest>('/demandes/', {
    case: caseId, ...requestPayload(item), mode: imported ? 'imported' : 'generated',
  });
  if (imported?.state === 'accepted') {
    await apiPost(`/demandes/${created.id}/preparer/`, { version: created.version, document: imported.id });
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
    if (!file) throw new Error('Le PDF réel de la réponse est requis.');
    const document = await acceptedDocument(file, existing.case);
    const response = newResponses[0];
    const itemIds = response.elementsFournisIds.filter((id) => existing.items.some((element) => element.id === id));
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
    if (!linkedItems.length) throw new Error('Aucun élément ne possède de réponse liée à apprécier.');
    const satisfied = item.evaluationReponse === 'SATISFAISANTE';
    const reason = required(item.motifSatisfaction, 'Le motif de l’appréciation');
    for (const element of linkedItems) {
      await apiPost(`/demandes/${existing.id}/elements/${element.id}/appreciations/`, {
        version: element.assessment_version, receipt: 'received',
        completeness: satisfied ? 'complete' : 'insufficient',
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
    version: existing.version, ...requestPayload(item),
  });
  if (file) {
    const document = await acceptedDocument(file, existing.case);
    await apiPost(`/demandes/${updated.id}/preparer/`, { version: updated.version, document: document.id });
  }
}

function sheetPayload(item: FeuilleObservation, documentId?: string) {
  const observations = item.observations.map((observation, index) => ({
    facts: required(observation.faitsConstates, 'Les faits constatés'), title: observation.titre || '',
    legal_references: observation.referencesJuridiques || '', questions: observation.questionsAssujetti || '',
    analysis: observation.analyseMotivee || '', documents: index === 0 && documentId ? [documentId] : [],
  }));
  if (!observations.length) throw new Error('Ajoutez au moins une observation.');
  return {
    recipient_address: required(item.adresse, 'L’adresse du destinataire'),
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
  return apiPost<ApiSheet>('/feuilles/', { case: caseId, origin: 'field', ...sheetPayload(item, document?.id) });
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
  const targetCase = workspace.cases.find((item) => item.id === caseId);
  if (!targetCase) throw new Error('Dossier introuvable.');
  const assessments = (await Promise.all((workspace.requests[caseId] || []).flatMap((request) =>
    request.items.map(async (item) => apiAll<{ id: string; substance: string }>(`/demandes/${request.id}/elements/${item.id}/appreciations/?page_size=100`))
  ))).flat();
  const latest = assessments.reverse().find((item) => item.substance === 'satisfactory');
  if (!latest) throw new Error('Une appréciation satisfaisante enregistrée sur le serveur est requise avant une proposition de classement.');
  return apiPost<ApiDecision>('/decisions/', {
    case: caseId, case_version: targetCase.version, kind: 'classification',
    reason: required(reason, 'Le motif de classement'), request_assessment: latest.id,
  });
}
