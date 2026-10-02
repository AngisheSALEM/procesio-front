import { apiPost, type ApiDecision, type ApiDocument, type ApiGelecTransfer } from './client';
import { latestVersion } from './mappers';
import type { WorkspaceData } from './workspace';

export const decisionKindLabels: Record<ApiDecision['kind'], string> = {
  classification: 'Classement sans suite', mission: 'Mission complémentaire',
  complement: 'Demande de complément', gelec: 'Relais GELEC',
};
export const decisionStateLabels: Record<string, string> = { proposed: 'Proposée', returned: 'Retournée', validated: 'Validée' };
export const transferStateLabels: Record<string, string> = { prepared: 'Préparé', transmitted: 'Transmis · réception attendue', confirmed: 'Réception confirmée' };

export function orderedDecisions(rows: ApiDecision[]): ApiDecision[] {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}

export function currentDecision(rows: ApiDecision[]): ApiDecision | undefined {
  return orderedDecisions(rows).find((row) => row.state === 'validated');
}

export interface DecisionSource { id: string; field: 'request_assessment' | 'observation_assessment'; label: string; conclusion: string; reason: string }

export function decisionSources(workspace: WorkspaceData, caseId: string): DecisionSource[] {
  const sources: DecisionSource[] = [];
  for (const request of workspace.requests[caseId] || []) {
    for (const item of request.items) {
      const assessment = latestVersion(workspace.assessments[item.id] || []);
      if (assessment && assessment.version === item.assessment_version && ['satisfactory', 'unsatisfactory'].includes(assessment.substance)) {
        sources.push({ id: assessment.id, field: 'request_assessment', label: `${request.reference || request.id} · ${item.label} · v${assessment.version}`, conclusion: assessment.substance, reason: assessment.reason });
      }
    }
  }
  for (const sheet of workspace.sheets[caseId] || []) {
    for (const item of sheet.observations) {
      const assessment = latestVersion(workspace.observationAssessments[item.id] || []);
      if (assessment && assessment.version === item.assessment_version && ['satisfactory', 'unsatisfactory'].includes(assessment.conclusion)) {
        sources.push({ id: assessment.id, field: 'observation_assessment', label: `${sheet.reference || sheet.id} · O${item.number} · v${assessment.version}`, conclusion: assessment.conclusion, reason: assessment.reason });
      }
    }
  }
  return sources;
}

export async function proposeDecision(workspace: WorkspaceData, caseId: string, kind: ApiDecision['kind'], reason: string, sourceId: string): Promise<ApiDecision> {
  const dossier = workspace.cases.find((row) => row.id === caseId);
  if (!dossier?.capabilities?.includes('case.update')) throw new Error('Votre compte ne peut pas proposer de décision sur ce dossier.');
  if (!reason.trim()) throw new Error('Un motif de décision est requis.');
  const source = decisionSources(workspace, caseId).find((row) => row.id === sourceId);
  if (!source) throw new Error('Choisissez une appréciation de fond actuelle de ce dossier.');
  const previous = orderedDecisions(workspace.decisions[caseId] || [])[0];
  if (previous?.state === 'proposed') throw new Error('Une proposition attend déjà une validation.');
  return apiPost<ApiDecision>('/decisions/', {
    case: caseId, case_version: dossier.version, kind, reason: reason.trim(),
    [source.field]: source.id, ...(previous ? { replaces: previous.id } : {}),
  });
}

export async function reviewDecision(decision: ApiDecision, action: 'validate' | 'return', comment = ''): Promise<ApiDecision> {
  if (!decision.allowed_actions?.includes(action)) throw new Error('Cette action de décision n’est pas autorisée.');
  if (action === 'return' && !comment.trim()) throw new Error('Un motif de retour est requis.');
  return apiPost<ApiDecision>(`/decisions/${decision.id}/${action === 'validate' ? 'valider' : 'retourner'}/`, {
    version: decision.version, ...(action === 'return' ? { comment: comment.trim() } : {}),
  });
}

export async function prepareTransfer(decision: ApiDecision): Promise<ApiGelecTransfer> {
  if (!decision.allowed_actions?.includes('prepare_transfer')) throw new Error('La préparation du relais GELEC n’est pas autorisée.');
  return apiPost<ApiGelecTransfer>('/transferts-gelec/', { decision: decision.id });
}

// Keep the key for an identical retry after an uncertain network result.
export function transferSubmission(transfer: ApiGelecTransfer, action: 'transmit' | 'confirm', proof: string, factualAt: string, reference: string, documents: ApiDocument[], keys: Map<string, string>) {
  if (!transfer.allowed_actions?.includes(action)) throw new Error('Cette étape du relais GELEC n’est pas autorisée.');
  if (!documents.some((row) => row.id === proof && row.case === transfer.case && row.state === 'accepted' && row.content_type === 'application/pdf')) throw new Error('Choisissez un PDF accepté de ce dossier.');
  const date = new Date(factualAt);
  if (!factualAt || !Number.isFinite(date.getTime()) || date.getTime() > Date.now()) throw new Error('Renseignez une date réelle valide, sans date future.');
  const body = { version: transfer.version, proof, reference: reference.trim(),
    [action === 'transmit' ? 'transmitted_at' : 'received_at']: date.toISOString() };
  const identity = JSON.stringify([transfer.id, action, body]);
  if (!keys.has(identity)) keys.set(identity, crypto.randomUUID());
  return { ...body, idempotency_key: keys.get(identity)! };
}

export async function recordTransfer(transfer: ApiGelecTransfer, action: 'transmit' | 'confirm', proof: string, factualAt: string, reference: string, documents: ApiDocument[], keys: Map<string, string>) {
  const body = transferSubmission(transfer, action, proof, factualAt, reference, documents, keys);
  return apiPost<ApiGelecTransfer>(`/transferts-gelec/${transfer.id}/${action === 'transmit' ? 'transmettre' : 'confirmer-reception'}/`, body);
}
