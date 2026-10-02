const API_ROOT = '/api/v1';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

function validationMessage(body: ApiErrorBody): string | undefined {
  const errors = Object.entries(body)
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
          ? body.message
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
  try {
    response = await fetch(apiPath(path), { ...init, method, credentials: 'same-origin', headers });
  } catch {
    throw new Error('Le serveur est indisponible. Vérifiez la connexion et réessayez.');
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as T | ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody, response.headers.get('X-Request-ID') || undefined);
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
    records.push(...page.results);
    next = page.next;
  }
  return records;
}

export async function getSession(): Promise<{ authenticated: boolean }> {
  return apiGet('/session/');
}

export async function login(username: string, password: string): Promise<void> {
  await getSession();
  await apiPost('/session/', { username, password });
}

export async function logout(): Promise<void> {
  await apiDelete('/session/');
}

export async function uploadFile(file: File, parent: { case?: string; intelligence?: string }) {
  const data = new FormData();
  data.append('file', file);
  if (parent.case) data.append('case', parent.case);
  if (parent.intelligence) data.append('intelligence', parent.intelligence);
  return apiPost<ApiDocument>('/documents/', data);
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
  memberships: ApiMembership[];
}

export interface ApiCase {
  id: string; reference: string; unit: string; unit_code: string;
  classification: number; status: string; assignee: number; assignee_username: string;
  next_action: string; version: number; created_at: string; updated_at: string;
  object?: string; perimeter?: string; opening_reason?: string;
  controlled_entity?: Record<string, string> | null;
  priority?: 'normal' | 'urgent' | 'flagged'; deadline?: string | null;
  team?: number[]; customs_operations?: Array<Record<string, string | number>>;
}

export interface ApiIntelligence {
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
  acts: Array<{ id: string; request_version: number; mode: string; imported_document: string | null }>;
  issuance?: { issued_at: string; act: string } | null;
}

export interface ApiResponse {
  id: string; request: string; letter: string; annexes: string[]; received_on: string;
  external_reference?: string; sender_name?: string; note?: string;
  item_links: Array<{ id: string; item: string; voided_at: string | null }>;
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
}

export interface ApiDocument {
  id: string; case: string | null; intelligence: string | null;
  original_name: string; content_type: string; size: number; state: string;
  uploaded_at: string; scanned_at: string | null;
}

export interface ApiDecision {
  id: string; case: string; kind: string; state: string; version: number;
  reason: string; validated_at: string | null; created_at: string;
}

export interface ApiWorkItem {
  kind: string; id: string; case: string; reference?: string; status: string;
  next_action?: string; due_on?: string | null; overdue?: boolean; returned?: boolean;
  internal_alert?: boolean; action_url: string;
}

export interface ApiStatistics {
  unit: string; start: string; end: string; definition_version: string; prototype_only: boolean;
  families: Array<{ key: string; indicators: Array<{
    key: string; label: string; definition: string; value: number | null;
    status: string; reason?: string; detail_url: string | null;
  }> }>;
}
