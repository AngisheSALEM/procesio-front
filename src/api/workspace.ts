import type {
  DemandeCommunication, DocumentItem, DossierEnquete, FeuilleObservation, RenseignementItem,
} from '../types';
import {
  apiAll, apiGet,
  type ApiAssessment, type ApiCase, type ApiDecision, type ApiDocument, type ApiIntelligence, type ApiRequest,
  type ApiResponse, type ApiSheet, type ApiStatistics, type ApiUser, type ApiWorkItem,
} from './client';
import { demandeFromApi, documentFromApi, dossierFromApi, feuilleFromApi, renseignementFromApi } from './mappers';

export interface WorkspaceData {
  users: ApiUser[];
  assignableAgentIds: number[];
  restrictedAgentIds: number[];
  cases: ApiCase[];
  intelligence: ApiIntelligence[];
  requests: Record<string, ApiRequest[]>;
  assessments: Record<string, ApiAssessment[]>;
  sheets: Record<string, ApiSheet[]>;
  decisions: Record<string, ApiDecision[]>;
  documents: Record<string, ApiDocument[]>;
  dossiers: DossierEnquete[];
  renseignements: RenseignementItem[];
  demandesParDossier: Record<string, DemandeCommunication[]>;
  feuillesParDossier: Record<string, FeuilleObservation[]>;
  documentsParDossier: Record<string, DocumentItem[]>;
  workItems: ApiWorkItem[];
  statistics: ApiStatistics | null;
  warnings: string[];
}

export async function loadWorkspace(me: ApiUser): Promise<WorkspaceData> {
  const memberships = me.memberships.filter((membership) => membership.role === 'manager' || membership.role === 'investigator');
  const units = new Map(me.memberships.map((membership) => [membership.unit.id, membership.unit.name]));
  const unitIds = [...new Set(memberships.map((membership) => membership.unit.id))];
  const warnings: string[] = [];
  const optional = async <T,>(label: string, read: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await read();
    } catch (error) {
      warnings.push(`${label} : ${error instanceof Error ? error.message : String(error)}`);
      return fallback;
    }
  };
  // These endpoints write access audit entries. SQLite cannot sustain a fan-out of
  // concurrent audited reads, so keep the entire workspace load sequential.
  const cases = await apiAll<ApiCase>('/dossiers/?page_size=100');
  const intelligence = await optional('Renseignements', () => apiAll<ApiIntelligence>('/renseignements/?page_size=100'), []);
  const agentPages: ApiUser[][] = [];
  for (const unit of unitIds) {
    agentPages.push(await optional(`Agents de ${units.get(unit) || unit}`,
      () => apiAll<ApiUser>(`/agents/?unit=${encodeURIComponent(unit)}&classification=0&page_size=100`), []));
  }
  const restrictedAgentPages: ApiUser[][] = [];
  for (const membership of memberships.filter((item) => item.clearance >= 1)) {
    restrictedAgentPages.push(await optional(`Agents habilités de ${membership.unit.name}`,
      () => apiAll<ApiUser>(`/agents/?unit=${encodeURIComponent(membership.unit.id)}&classification=1&page_size=100`), []));
  }
  const users = [...new Map([me, ...agentPages.flat()].map((user) => [user.id, {
    ...user, memberships: user.memberships || [],
  }])).values()];
  const caseData: Array<{
    item: ApiCase; requests: ApiRequest[]; sheets: ApiSheet[]; documents: ApiDocument[];
    decisions: ApiDecision[]; responses: ApiResponse[];
    assessmentRows: Array<{ id: string; rows: ApiAssessment[] }>;
  }> = [];
  for (const item of cases) {
    const query = `?case=${encodeURIComponent(item.id)}&page_size=100`;
    const requests = await optional(`${item.reference} · demandes`, () => apiAll<ApiRequest>(`/demandes/${query}`), []);
    const sheets = await optional(`${item.reference} · feuilles`, () => apiAll<ApiSheet>(`/feuilles/${query}`), []);
    const documents = await optional(`${item.reference} · pièces`, () => apiAll<ApiDocument>(`/documents/${query}`), []);
    const decisions = await optional(`${item.reference} · décisions`, () => apiAll<ApiDecision>(`/decisions/${query}`), []);
    const responses: ApiResponse[] = [];
    const assessmentRows: Array<{ id: string; rows: ApiAssessment[] }> = [];
    for (const request of requests) {
      responses.push(...await optional(`${item.reference} · réponses ${request.reference || request.id}`,
        () => apiAll<ApiResponse>(`/demandes/${request.id}/reponses/?page_size=100`), []));
      for (const element of request.items) {
        assessmentRows.push({ id: element.id, rows: await optional(`${item.reference} · appréciations ${element.number}`,
          () => apiAll<ApiAssessment>(`/demandes/${request.id}/elements/${element.id}/appreciations/?page_size=100`), []) });
      }
    }
    caseData.push({ item, requests, sheets, documents, decisions, responses, assessmentRows });
  }
  const intelLinks: Array<{ dossiers: string[] }> = [];
  for (const item of intelligence) {
    intelLinks.push(await optional(`Liens du renseignement ${item.reference || item.id}`,
      () => apiGet<{ dossiers: string[] }>(`/renseignements/${item.id}/dossiers/`), { dossiers: [] }));
  }
  const workItems: ApiWorkItem[] = [];
  for (const kind of ['cases', 'requests', 'decisions']) {
    workItems.push(...await optional(`Mon travail · ${kind}`,
      () => apiAll<ApiWorkItem>(`/mon-travail/?kind=${kind}&page_size=100`), []));
  }
  const statistics = unitIds.length ? await optional('Statistiques',
    () => apiGet<ApiStatistics>(`/statistiques/?unit=${unitIds[0]}&start=${new Date().getFullYear()}-01-01&end=${new Date().toISOString().slice(0, 10)}`), null) : null;
  return {
    users, cases, intelligence,
    assignableAgentIds: [...new Set(agentPages.flat().map((agent) => agent.id))],
    restrictedAgentIds: [...new Set(restrictedAgentPages.flat().map((agent) => agent.id))],
    requests: Object.fromEntries(caseData.map(({ item, requests }) => [item.id, requests])),
    assessments: Object.fromEntries(caseData.flatMap(({ assessmentRows }) => assessmentRows.map((row) => [row.id, row.rows]))),
    sheets: Object.fromEntries(caseData.map(({ item, sheets }) => [item.id, sheets])),
    decisions: Object.fromEntries(caseData.map(({ item, decisions }) => [item.id, decisions])),
    documents: Object.fromEntries(caseData.map(({ item, documents }) => [item.id, documents])),
    dossiers: cases.map((item) => dossierFromApi(item, users, units)),
    renseignements: intelligence.map((item, index) => ({
      ...renseignementFromApi(item, users, units), dossiersLies: intelLinks[index].dossiers,
    })),
    demandesParDossier: Object.fromEntries(caseData.map(({ item, requests, responses, assessmentRows }) => [
      item.id, requests.map((request) => demandeFromApi(request, responses, users,
        Object.fromEntries(assessmentRows.map((row) => [row.id, row.rows])))),
    ])),
    feuillesParDossier: Object.fromEntries(caseData.map(({ item, sheets }) => [
      item.id, sheets.map((sheet) => feuilleFromApi(sheet, users)),
    ])),
    documentsParDossier: Object.fromEntries(caseData.map(({ item, documents }) => [
      item.id, documents.map(documentFromApi),
    ])),
    workItems, statistics,
    warnings,
  };
}
