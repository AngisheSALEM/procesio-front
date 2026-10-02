const API_ROOT = '/api/v1';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

function validationMessage(body: ApiErrorBody): string | undefined {
  const fields = body.fields && typeof body.fields === 'object' ? body.fields : body;
  const errors = Object.entries(fields)
    .filter(([key]) => !['code', 'request_id', 'message', 'detail'].includes(key))
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) return value.map((part) => `${key} : ${String(part)}`);
      return typeof value === 'string' ? [`${key} : ${value}`] : [];
    });
  return errors.length ? errors.join(' · ') : undefined;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;
  requestId?: string;

  constructor(status: number, body: ApiErrorBody, requestId?: string) {
    super(
      status === 409
        ? 'Cette donnée a été modifiée ailleurs. Rechargez la page avant de réessayer.'
        : typeof body.message === 'string'
          ? [body.message, validationMessage(body)].filter(Boolean).join(' · ')
          : typeof body.detail === 'string'
            ? body.detail
            : validationMessage(body) || `Erreur du serveur (${status}).`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.requestId = requestId;
  }
}

export function isSessionExpired(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.body.code === 'not_authenticated' || error.status === 401);
}

const sessionListeners = new Set<() => void>();
let sessionScope = new AbortController();
export class ApiCancelledError extends Error {}
export function cancelSessionRequests(): void {
  sessionScope.abort();
  sessionScope = new AbortController();
}
export function onSessionExpired(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}

function csrfToken(): string | undefined {
  return document.cookie.split('; ').find((part) => part.startsWith('csrftoken='))?.slice('csrftoken='.length);
}

function apiPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const url = new URL(path);
    if (!url.pathname.startsWith(`${API_ROOT}/`)) throw new Error('Lien de pagination API invalide.');
    return `${url.pathname}${url.search}`;
  }
  return path.startsWith(API_ROOT) ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = csrfToken();
    if (!token) throw new Error('Session CSRF absente. Rechargez la page et reconnectez-vous.');
    headers.set('X-CSRFToken', decodeURIComponent(token));
  }
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response: Response;
  const scope = sessionScope;
  try {
    response = await fetch(apiPath(path), { ...init, method, credentials: 'same-origin', headers,
      signal: AbortSignal.any([scope.signal, ...(init.signal ? [init.signal] : []), AbortSignal.timeout(30000)]),
    });
  } catch {
    if (scope.signal.aborted || init.signal?.aborted) throw new ApiCancelledError('Chargement interrompu.');
    throw new Error('Le serveur est indisponible. Vérifiez la connexion et réessayez.');
  }
  if (scope.signal.aborted) throw new ApiCancelledError('Chargement interrompu.');
  if (response.status === 204) return undefined as T;
  let body: T | ApiErrorBody;
  try {
    body = await response.json();
  } catch {
    if (scope.signal.aborted) throw new ApiCancelledError('Chargement interrompu.');
    if (response.ok) throw new Error('Réponse du serveur invalide. Réessayez.');
    body = {};
  }
  if (scope.signal.aborted) throw new ApiCancelledError('Chargement interrompu.');
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    if (response.ok) throw new Error('Réponse du serveur invalide. Réessayez.');
    body = {};
  }
  if (!response.ok) {
    const error = new ApiError(response.status, body as ApiErrorBody, response.headers.get('X-Request-ID') || undefined);
    if (scope === sessionScope && path !== '/session/' && isSessionExpired(error)) sessionListeners.forEach((listener) => listener());
    throw error;
  }
  return body as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
export const apiPost = <T>(path: string, body: object | FormData) => apiRequest<T>(path, {
  method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body),
});
export const apiPatch = <T>(path: string, body: object) => apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' });

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function apiAll<T>(path: string): Promise<T[]> {
  const records: T[] = [];
  let next: string | null = path;
  const visited = new Set<string>();
  while (next) {
    if (visited.has(next)) throw new Error('Pagination API circulaire.');
    visited.add(next);
    const page: Page<T> = await apiGet<Page<T>>(next);
    if (!Array.isArray(page.results) || !(page.next === null || typeof page.next === 'string')) {
      throw new Error('Liste du serveur invalide. Réessayez.');
    }
    records.push(...page.results);
    next = page.next;
  }
  return records;
}

export async function getSession(): Promise<{ authenticated: boolean }> {
  const session = await apiGet<{ authenticated: boolean }>('/session/');
  if (typeof session.authenticated !== 'boolean') throw new Error('Réponse de session invalide. Réessayez.');
  return session;
}

export async function login(username: string, password: string): Promise<void> {
  await getSession();
  await apiPost('/session/', { username, password });
}

export async function logout(): Promise<void> {
  await apiDelete('/session/');
}

export async function uploadFile(file: File, parent: { case?: string; intelligence?: string }) {
  if (file.size > 10 * 1024 * 1024) throw new Error('La pièce dépasse la limite de 10 Mio.');
  const data = new FormData();
  data.append('file', file);
  if (parent.case) data.append('case', parent.case);
  if (parent.intelligence) data.append('intelligence', parent.intelligence);
  return apiPost<ApiDocument>('/documents/', data);
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  let response: Response;
  const scope = sessionScope;
  try {
    response = await fetch(apiPath(path), { credentials: 'same-origin', signal: AbortSignal.any([scope.signal, AbortSignal.timeout(30000)]) });
  } catch {
    if (scope.signal.aborted) throw new ApiCancelledError('Téléchargement interrompu.');
    throw new Error('Le serveur est indisponible. Réessayez le téléchargement.');
  }
  if (scope.signal.aborted) throw new ApiCancelledError('Téléchargement interrompu.');
  if (!response.ok) {
    const error = new ApiError(response.status, await response.json().catch(() => ({})), response.headers.get('X-Request-ID') || undefined);
    if (scope === sessionScope && isSessionExpired(error)) sessionListeners.forEach((listener) => listener());
    throw error;
  }
  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    if (scope.signal.aborted) throw new ApiCancelledError('Téléchargement interrompu.');
    throw new Error('Le téléchargement a été interrompu. Réessayez.');
  }
  if (scope.signal.aborted) throw new ApiCancelledError('Téléchargement interrompu.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export interface ApiMembership {
  unit: { id: string; code: string; name: string };
  role: 'manager' | 'investigator' | 'auditor';
  clearance: number;
  capabilities: string[];
}

export interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  grade?: string;
  matricule?: string;
  memberships: ApiMembership[];
}

export interface ApiCase {
  current_decision?: ApiDecision | null;
  capabilities?: string[];
  id: string; reference: string; unit: string; unit_code: string;
  classification: number; status: string; assignee: number; assignee_username: string;
  next_action: string; version: number; created_at: string; updated_at: string;
  object?: string; perimeter?: string; opening_reason?: string;
  controlled_entity?: Record<string, string> | null;
  priority?: 'normal' | 'urgent' | 'flagged'; deadline?: string | null;
  team?: number[]; customs_operations?: Array<Record<string, string | number>>;
}

export interface ApiIntelligence {
  capabilities?: string[];
  id: string; reference?: string; unit: string; classification: number;
  subject: string; summary: string; provenance: string; occurred_on: string;
  assignee: number; version: number; created_at: string; updated_at: string;
  priority?: string; reliability?: string; rating_instruction?: string;
  rating_deadline_days?: number | null; rated_at?: string | null; rated_by?: number | null;
  available_pieces?: string;
}

export interface ApiRequestItem {
  id: string; number: number; label: string; period?: string; reason?: string; assessment_version: number;
}

export interface ApiRequest {
  id: string; reference?: string; case: string; author: number; target_type: string; target_name: string;
  represented_name: string; target_address?: string; subject: string; legal_basis?: string;
  delivery_method?: string; internal_comments?: string; mode: string; due_on: string | null;
  state: string; version: number; created_at: string; updated_at: string;
  items: ApiRequestItem[];
  acts: ApiAct[];
  allowed_actions: Array<'edit' | 'prepare' | 'submit' | 'validate' | 'return' | 'sign' | 'issue'>;
  issuance?: { issued_at: string; act: string; signature_proof: string; dispatch_proof: string; recorded_at: string; prototype_only: boolean } | null;
}

export interface ApiAct {
  id: string; request_version: number; mode: string; imported_document: string | null;
  sha256: string; prepared_by: number; prepared_at: string;
}

export interface ApiRequestEvent {
  id: string; kind: string; actor: number; act: string | null; proof: string | null;
  comment: string; version: number; factual_at: string | null; occurred_at: string;
}

export interface ApiResponse {
  id: string; request: string; letter: string; annexes: string[]; received_on: string;
  external_reference?: string; sender_name?: string; note?: string;
  version: number; complement_of: string | null; recorded_at: string;
  item_links: Array<{ id: string; item: string; voided_at: string | null; reason?: string; added_at?: string }>;
}

export interface ApiAssessment {
  id: string; version: number; receipt: string; completeness: string;
  substance: string; reason: string; actor: number; recorded_at: string;
}

export interface ApiObservation {
  id: string; number: number; facts: string; title?: string;
  legal_references?: string; questions?: string; analysis?: string;
  documents: string[]; assessment_version: number;
}

export interface ApiSheet {
  id: string; reference?: string; case: string; author: number; mission: string | null; origin: string;
  recipient_address: string; concerned_party: string; facts: string;
  subject?: string; legal_basis?: string; meeting_on?: string | null;
  version: number; created_at: string; updated_at: string;
  observations: ApiObservation[];
  projects: ApiSheetProject[];
}

export interface ApiSheetProject {
  id: string; sheet: string; sheet_version: number; sha256: string; prepared_at: string;
}

export interface ApiMission {
  id: string; case: string; author: number; context: string; findings: string;
  occurred_on: string; participants: number[]; documents: string[]; created_at: string;
}

export interface ApiDocument {
  id: string; case: string | null; intelligence: string | null;
  original_name: string; content_type: string; size: number; state: string;
  uploaded_at: string; scanned_at: string | null; sha256: string; scan_result: string | null;
}

export interface ApiDecision {
  id: string; case: string; kind: 'classification' | 'mission' | 'complement' | 'gelec'; state: string; version: number;
  reason: string; validated_at: string | null; created_at: string;
  request_assessment?: string | null; observation_assessment?: string | null;
  replaces?: string | null;
  author: number; validator: number | null; return_comment: string; prototype_only: boolean;
  allowed_actions: Array<'validate' | 'return' | 'prepare_transfer'>;
  is_current: boolean; source_current: boolean;
}

export interface ApiDecisionEvent {
  id: string; kind: string; actor: number; comment: string; version: number; created_at: string;
}

export interface ApiGelecTransfer {
  id: string; decision: string; case: string; state: 'prepared' | 'transmitted' | 'confirmed'; version: number;
  prepared_by: number; prepared_at: string; reference: string; transmission_reference: string;
  transmission_proof: string | null; transmitted_by: number | null; transmitted_at: string | null;
  transmission_recorded_at: string | null; receipt_proof: string | null; confirmed_by: number | null;
  received_at: string | null; confirmation_recorded_at: string | null; prototype_only: boolean;
  allowed_actions: Array<'transmit' | 'confirm'>;
}

export interface ApiDefense {
  id: string; sheet: string; letter: string; annexes: string[]; observations: string[];
  received_on: string; recorded_at: string; recorded_by: number; complement_of: string | null;
}

export interface ApiObservationAssessment {
  id: string; observation: string; defense: string; version: number;
  conclusion: 'pending' | 'satisfactory' | 'unsatisfactory'; reason: string; actor: number; recorded_at: string;
}

export interface ApiWorkItem {
  kind: string; id: string; case: string; reference?: string; status: string;
  next_action?: string; due_on?: string | null; overdue?: boolean; returned?: boolean;
  internal_alert?: boolean; action_url: string;
}

export interface ApiUnit {
  id: string;
  code: string;
  name: string;
}

export interface ApiCaseAssignment {
  id: string;
  previous_assignee: number | null;
  new_assignee: number;
  author: number;
  reason: string;
  created_at: string;
  version: number;
}

export interface ApiCaseTimelineEntry {
  id: string;
  kind: string;
  actor: number;
  next_action: string | null;
  status: string | null;
  version: number | null;
  created_at: string;
  resource_id?: string | null;
}

export interface ApiDissemination {
  id: string;
  intelligence: string;
  recipient_unit: string;
  channel: string;
  reference: string;
  expected_action: string;
  sent_at: string | null;
  created_at: string;
}

export interface ApiDisseminationReturn {
  id: string;
  dissemination: string;
  acknowledged: boolean;
  received_at: string;
  note: string;
  recorded_at: string;
}

export interface ApiValidationItem {
  id: string;
  case: string;
  status: string;
  due_on: string | null;
  overdue: boolean;
  action_url: string;
}

export interface ApiStatistics {
  unit: string; start: string; end: string; definition_version: string; prototype_only: boolean;
  families: Array<{ key: string; indicators: Array<{
    key: string; label: string; definition: string; value: number | null;
    status: string; reason?: string; detail_url: string | null;
  }> }>;
}

export interface ApiDocumentTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  version: string;
  state: 'fictif' | 'approved' | 'retired';
  description: string;
  content?: string;
  file_name: string;
  content_type: string;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name?: string;
  approved_by: number | null;
  approved_by_name?: string;
  approved_at: string | null;
}

export async function fetchDocumentTemplates(params?: { state?: string; search?: string }): Promise<ApiDocumentTemplate[]> {
  const query = new URLSearchParams();
  query.set('page_size', '100');
  if (params?.state) query.set('state', params.state);
  if (params?.search) query.set('search', params.search);
  return apiAll<ApiDocumentTemplate>(`/modeles/?${query.toString()}`);
}

export async function approveDocumentTemplate(id: string): Promise<ApiDocumentTemplate> {
  return apiPost<ApiDocumentTemplate>(`/modeles/${id}/approuver/`, {});
}

export async function downloadDocumentTemplate(id: string, filename: string): Promise<void> {
  return downloadFile(`/modeles/${id}/telecharger/`, filename);
}

export interface ApiStatisticsDetailItem {
  id: string;
  url: string;
  reference?: string;
  title?: string;
  date?: string;
  case_id?: string;
  case_reference?: string;
  extra?: string;
}

export interface ApiStatisticsDetail {
  key: string;
  label: string;
  definition: string;
  definition_version: string;
  unit: string;
  start: string;
  end: string;
  count: number;
  provenance?: string;
  next: string | null;
  previous: string | null;
  results: ApiStatisticsDetailItem[];
}

export async function fetchStatistics(unit: string, start: string, end: string): Promise<ApiStatistics> {
  const query = new URLSearchParams({ unit, start, end });
  return apiGet<ApiStatistics>(`/statistiques/?${query.toString()}`);
}

export async function fetchStatisticsDetail(key: string, unit: string, start: string, end: string, provenance?: string): Promise<ApiStatisticsDetail> {
  const query = new URLSearchParams({ unit, start, end });
  if (provenance) query.set('provenance', provenance);
  return apiGet<ApiStatisticsDetail>(`/statistiques/${encodeURIComponent(key)}/?${query.toString()}`);
}
