import { apiPost, type ApiRequest, type ApiResponse, type ApiObservation, type ApiSheet, type ApiDefense, type ApiDocument } from './client';

function reason(value: string) {
  if (!value.trim()) throw new Error('Un motif est requis.');
  return value.trim();
}

function documentsForReceipt(documents: ApiDocument[], caseId: string, letter: string, annexes: string[]) {
  const ids = [letter, ...annexes];
  if (!letter || new Set(ids).size !== ids.length || ids.some((id) => !documents.some((doc) => doc.id === id && doc.case === caseId && doc.state === 'accepted'))) {
    throw new Error('Choisissez un courrier et des annexes distincts, acceptés et appartenant au dossier.');
  }
}

export interface ReceiptInput { letter: string; annexes: string[]; received_on: string; complement_of?: string }

export function recordResponse(request: ApiRequest, documents: ApiDocument[], input: ReceiptInput & {
  item_ids: string[]; external_reference: string; sender_name: string; note: string;
}) {
  documentsForReceipt(documents, request.case, input.letter, input.annexes);
  if (!input.item_ids.length || new Set(input.item_ids).size !== input.item_ids.length || input.item_ids.some((id) => !request.items.some((item) => item.id === id))) throw new Error('Choisissez les éléments concernés de cette demande.');
  return apiPost<ApiResponse>(`/demandes/${request.id}/reponses/`, input);
}

export function rectifyResponse(response: ApiResponse, selected: string[], motivation: string) {
  const active = response.item_links.filter((link) => !link.voided_at);
  const add_item_ids = selected.filter((id) => !active.some((link) => link.item === id));
  const remove_link_ids = active.filter((link) => !selected.includes(link.item)).map((link) => link.id);
  if (!add_item_ids.length && !remove_link_ids.length) throw new Error('Modifiez au moins une association.');
  return apiPost<ApiResponse>(`/reponses/${response.id}/rectifier-liens/`, { version: response.version, add_item_ids, remove_link_ids, reason: reason(motivation) });
}

export function assessRequestItem(request: ApiRequest, item: ApiRequest['items'][number], received: boolean, completeness: string, substance: string, motivation: string) {
  return apiPost(`/demandes/${request.id}/elements/${item.id}/appreciations/`, {
    version: item.assessment_version, receipt: received ? 'received' : 'not_received',
    completeness: received ? completeness : 'unknown', substance: received ? substance : 'pending', reason: reason(motivation),
  });
}

export function recordDefense(sheet: ApiSheet, documents: ApiDocument[], input: ReceiptInput & { observation_ids: string[] }) {
  documentsForReceipt(documents, sheet.case, input.letter, input.annexes);
  if (!input.observation_ids.length || new Set(input.observation_ids).size !== input.observation_ids.length || input.observation_ids.some((id) => !sheet.observations.some((item) => item.id === id))) throw new Error('Choisissez les constats concernés de cette feuille.');
  return apiPost<ApiDefense>(`/feuilles/${sheet.id}/defenses/`, input);
}

export function assessObservation(sheet: ApiSheet, observation: ApiObservation, defense: ApiDefense, conclusion: string, motivation: string) {
  if (defense.sheet !== sheet.id || !defense.observations.includes(observation.id)) throw new Error('La défense doit concerner ce constat.');
  return apiPost(`/feuilles/${sheet.id}/observations/${observation.id}/appreciations/`, {
    version: observation.assessment_version, defense: defense.id, conclusion, reason: reason(motivation),
  });
}
