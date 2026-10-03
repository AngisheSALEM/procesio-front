import type {
  DemandeCommunication, DocumentItem, DossierEnquete, FeuilleObservation, RenseignementItem,
} from '../types';
import {
  apiAll, apiGet, isSessionExpired, ApiCancelledError,
  type ApiDefense, type ApiObservationAssessment, type ApiAssessment, type ApiCase, type ApiDecision, type ApiGelecTransfer, type ApiDocument, type ApiIntelligence, type ApiRequest,
  type ApiResponse, type ApiSheet, type ApiMission, type ApiStatistics, type ApiUser, type ApiWorkItem, type ApiValidationItem,
} from './client';
import { demandeFromApi, documentFromApi, dossierFromApi, feuilleFromApi, renseignementFromApi } from './mappers';

export interface WorkspaceData {
  users: ApiUser[];
  assignableAgentIds: number[];
  restrictedAgentIds: number[];
  agentScopes: Record<string, { ordinary: number[]; restricted: number[] }>;
  cases: ApiCase[];
  intelligence: ApiIntelligence[];
  requests: Record<string, ApiRequest[]>;
  responses: Record<string, ApiResponse[]>;
  defenses: Record<string, ApiDefense[]>;
  missions: Record<string, ApiMission[]>;
  assessments: Record<string, ApiAssessment[]>;
  sheets: Record<string, ApiSheet[]>;
  observationAssessments: Record<string, ApiObservationAssessment[]>;
  decisions: Record<string, ApiDecision[]>;
  transfers: Record<string, ApiGelecTransfer[]>;
  documents: Record<string, ApiDocument[]>;
  dossiers: DossierEnquete[];
  renseignements: RenseignementItem[];
  demandesParDossier: Record<string, DemandeCommunication[]>;
  feuillesParDossier: Record<string, FeuilleObservation[]>;
  documentsParDossier: Record<string, DocumentItem[]>;
  workItems: ApiWorkItem[];
  validationItems: ApiValidationItem[];
  statistics: ApiStatistics | null;
  warnings: string[];
  loadedCaseIds?: Set<string>;
}

export interface CaseDetailData {
  caseId: string;
  requests: ApiRequest[];
  sheets: ApiSheet[];
  missions: ApiMission[];
  documents: ApiDocument[];
  decisions: ApiDecision[];
  transfers: ApiGelecTransfer[];
  responses: ApiResponse[];
  defenses: ApiDefense[];
  observationAssessments: Record<string, ApiObservationAssessment[]>;
  assessmentRows: Array<{ id: string; rows: ApiAssessment[] }>;
}

export async function fetchCaseDetailData(
  item: ApiCase,
  optional: <T>(label: string, read: () => Promise<T>, fallback: T, critical?: boolean) => Promise<T>,
): Promise<CaseDetailData> {
  const query = `?case=${encodeURIComponent(item.id)}&page_size=100`;
  const requests = await optional(`${item.reference} · demandes`, () => apiAll<ApiRequest>(`/demandes/${query}`), [], false);
  const sheets = await optional(`${item.reference} · feuilles`, () => apiAll<ApiSheet>(`/feuilles/${query}`), [], false);
  const missions = await optional(`${item.reference} · missions`, () => apiAll<ApiMission>(`/missions/${query}`), [], false);
  const documents = await optional(`${item.reference} · pièces`, () => apiAll<ApiDocument>(`/documents/${query}`), [], false);
  const decisions = await optional(`${item.reference} · décisions`, () => apiAll<ApiDecision>(`/decisions/${query}`), [], false);
  const transfers = await optional(`${item.reference} · transferts GELEC`, () => apiAll<ApiGelecTransfer>(`/transferts-gelec/${query}`), [], false);
  const responses: ApiResponse[] = [];
  const assessmentRows: Array<{ id: string; rows: ApiAssessment[] }> = [];
  for (const request of requests) {
    responses.push(...await optional(`${item.reference} · réponses ${request.reference || request.id}`,
      () => apiAll<ApiResponse>(`/demandes/${request.id}/reponses/?page_size=100`), [], false));
    for (const element of request.items) {
      assessmentRows.push({ id: element.id, rows: await optional(`${item.reference} · appréciations ${element.number}`,
        () => apiAll<ApiAssessment>(`/demandes/${request.id}/elements/${element.id}/appreciations/?page_size=100`), [], false) });
    }
  }
  const defenses: ApiDefense[] = [];
  const observationAssessments: Record<string, ApiObservationAssessment[]> = {};
  for (const sheet of sheets) {
    defenses.push(...await optional(`${item.reference} · défenses`,
      () => apiAll<ApiDefense>(`/feuilles/${sheet.id}/defenses/?page_size=100`), [], false));
    for (const observation of sheet.observations) {
      observationAssessments[observation.id] = await optional(`${item.reference} · observation O${observation.number}`,
        () => apiAll<ApiObservationAssessment>(`/feuilles/${sheet.id}/observations/${observation.id}/appreciations/?page_size=100`), [], false);
    }
  }
  return {
    caseId: item.id, requests, sheets, missions, documents, decisions, transfers,
    responses, defenses, observationAssessments, assessmentRows,
  };
}

export function applyCaseDetails(
  workspace: WorkspaceData,
  caseItem: ApiCase,
  details: CaseDetailData,
  users: ApiUser[],
  units: Map<string, string>,
): WorkspaceData {
  const { caseId, requests, sheets, missions, documents, decisions, transfers, responses, defenses, observationAssessments, assessmentRows } = details;
  const assessmentMap = Object.fromEntries(assessmentRows.map((row) => [row.id, row.rows]));
  const updatedDemandes = requests.map((request) => demandeFromApi(request, responses, users, { ...workspace.assessments, ...assessmentMap }));
  const updatedFeuilles = sheets.map((sheet) => feuilleFromApi(
    sheet,
    users,
    defenses.filter((row) => row.sheet === sheet.id),
    { ...workspace.observationAssessments, ...observationAssessments }
  ));
  const updatedDocs = documents.map(documentFromApi);
  const updatedDossier = dossierFromApi(caseItem, users, units, decisions);

  const newLoaded = new Set(workspace.loadedCaseIds || []);
  newLoaded.add(caseId);

  const existsInCases = workspace.cases.some((c) => c.id === caseId);
  const updatedCases = existsInCases
    ? workspace.cases.map((c) => c.id === caseId ? caseItem : c)
    : [caseItem, ...workspace.cases];

  const existsInDossiers = workspace.dossiers.some((d) => d.id === caseId);
  const updatedDossiers = existsInDossiers
    ? workspace.dossiers.map((d) => d.id === caseId ? updatedDossier : d)
    : [updatedDossier, ...workspace.dossiers];

  return {
    ...workspace,
    cases: updatedCases,
    dossiers: updatedDossiers,
    loadedCaseIds: newLoaded,
    requests: { ...workspace.requests, [caseId]: requests },
    responses: {
      ...workspace.responses,
      ...Object.fromEntries(requests.map((request) => [request.id, responses.filter((r) => r.request === request.id)])),
    },
    defenses: {
      ...workspace.defenses,
      ...Object.fromEntries(sheets.map((sheet) => [sheet.id, defenses.filter((d) => d.sheet === sheet.id)])),
    },
    missions: { ...workspace.missions, [caseId]: missions },
    assessments: { ...workspace.assessments, ...assessmentMap },
    sheets: { ...workspace.sheets, [caseId]: sheets },
    observationAssessments: { ...workspace.observationAssessments, ...observationAssessments },
    decisions: { ...workspace.decisions, [caseId]: decisions },
    transfers: { ...workspace.transfers, [caseId]: transfers },
    documents: { ...workspace.documents, [caseId]: documents },
    demandesParDossier: { ...workspace.demandesParDossier, [caseId]: updatedDemandes },
    feuillesParDossier: { ...workspace.feuillesParDossier, [caseId]: updatedFeuilles },
    documentsParDossier: { ...workspace.documentsParDossier, [caseId]: updatedDocs },
  };
}

export async function loadWorkspace(me: ApiUser, initialCaseId?: string, loadAll = true): Promise<WorkspaceData> {
  const memberships = me.memberships.filter((membership) => membership.role === 'manager' || membership.role === 'investigator' || membership.role === 'auditor');
  const units = new Map(me.memberships.map((membership) => [membership.unit.id, membership.unit.name]));
  const unitIds = [...new Set(memberships.map((membership) => membership.unit.id))];
  const warnings: string[] = [];
  const optional = async <T,>(label: string, read: () => Promise<T>, fallback: T, critical = true): Promise<T> => {
    try {
      return await read();
    } catch (error) {
      if (isSessionExpired(error) || error instanceof ApiCancelledError) throw error;
      if (critical) throw new Error(`${label} : ${error instanceof Error ? error.message : String(error)}`);
      warnings.push(`${label} : ${error instanceof Error ? error.message : String(error)}`);
      return fallback;
    }
  };

  const isAuditor = me.memberships.some((m) => m.role === 'auditor') || me.username === 'mbombo' || me.username === 'demo_auditor';
  const cases = await optional('Dossiers', () => apiAll<ApiCase>('/dossiers/?page_size=100'), [], !isAuditor);
  const intelligence = await optional('Renseignements', () => apiAll<ApiIntelligence>('/renseignements/?page_size=100'), [], false);
  const agentPages: ApiUser[][] = [];
  const agentScopes: WorkspaceData['agentScopes'] = {};
  for (const unit of unitIds) {
    agentPages.push(await optional(`Agents de ${units.get(unit) || unit}`,
      () => apiAll<ApiUser>(`/agents/?unit=${encodeURIComponent(unit)}&classification=0&page_size=100`), [], false));
    agentScopes[unit] = { ordinary: agentPages.at(-1)!.map((agent) => agent.id), restricted: [] };
  }
  const restrictedAgentPages: ApiUser[][] = [];
  for (const membership of memberships.filter((item) => item.clearance >= 1)) {
    restrictedAgentPages.push(await optional(`Agents habilités de ${membership.unit.name}`,
      () => apiAll<ApiUser>(`/agents/?unit=${encodeURIComponent(membership.unit.id)}&classification=1&page_size=100`), [], false));
    agentScopes[membership.unit.id].restricted = restrictedAgentPages.at(-1)!.map((agent) => agent.id);
  }
  const users = [...new Map([me, ...agentPages.flat()].map((user) => [user.id, {
    ...user, memberships: user.memberships || [],
  }])).values()];

  const intelLinks: Array<{ dossiers: string[] }> = [];
  for (const item of intelligence) {
    intelLinks.push(await optional(`Liens du renseignement ${item.reference || item.id}`,
      () => apiGet<{ dossiers: string[] }>(`/renseignements/${item.id}/dossiers/`), { dossiers: [] }, false));
  }
  const workItems: ApiWorkItem[] = [];
  if (!isAuditor) {
    for (const kind of ['cases', 'requests', 'decisions']) {
      workItems.push(...await optional(`Mon travail · ${kind}`,
        () => apiAll<ApiWorkItem>(`/mon-travail/?kind=${kind}&page_size=100`), [], false));
    }
  }
  const validationItems: ApiValidationItem[] = [];
  const isManager = memberships.some((m) => m.role === 'manager');
  if (isManager && !isAuditor) {
    for (const kind of ['requests', 'decisions']) {
      const items = await optional(`File à valider · ${kind}`,
        () => apiAll<ApiValidationItem>(`/a-valider/?kind=${kind}&page_size=100`), [], false);
      validationItems.push(...items);
    }
  }
  const statistics = unitIds.length && !isAuditor ? await optional('Statistiques',
    () => apiGet<ApiStatistics>(`/statistiques/?unit=${unitIds[0]}&start=${new Date().getFullYear()}-01-01&end=${new Date().toISOString().slice(0, 10)}`), null, false) : null;

  let workspaceData: WorkspaceData = {
    users, cases, intelligence, observationAssessments: {}, agentScopes,
    assignableAgentIds: [...new Set(agentPages.flat().map((agent) => agent.id))],
    restrictedAgentIds: [...new Set(restrictedAgentPages.flat().map((agent) => agent.id))],
    requests: Object.fromEntries(cases.map((c) => [c.id, []])),
    responses: {},
    defenses: {},
    missions: Object.fromEntries(cases.map((c) => [c.id, []])),
    assessments: {},
    sheets: Object.fromEntries(cases.map((c) => [c.id, []])),
    decisions: Object.fromEntries(cases.map((c) => [c.id, []])),
    transfers: Object.fromEntries(cases.map((c) => [c.id, []])),
    documents: Object.fromEntries(cases.map((c) => [c.id, []])),
    dossiers: cases.map((item) => dossierFromApi(item, users, units, item.current_decision ? [item.current_decision] : [])),
    renseignements: intelligence.map((item, index) => ({
      ...renseignementFromApi(item, users, units), dossiersLies: intelLinks[index]?.dossiers || [],
    })),
    demandesParDossier: Object.fromEntries(cases.map((c) => [c.id, []])),
    feuillesParDossier: Object.fromEntries(cases.map((c) => [c.id, []])),
    documentsParDossier: Object.fromEntries(cases.map((c) => [c.id, []])),
    workItems, validationItems, statistics,
    warnings,
    loadedCaseIds: new Set<string>(),
  };

  if (loadAll) {
    for (const item of cases) {
      const details = await fetchCaseDetailData(item, optional);
      workspaceData = applyCaseDetails(workspaceData, item, details, users, units);
    }
  } else if (cases.length > 0) {
    const targetCase = (initialCaseId ? cases.find((c) => c.id === initialCaseId) : null) || cases[0];
    const details = await fetchCaseDetailData(targetCase, optional);
    workspaceData = applyCaseDetails(workspaceData, targetCase, details, users, units);
  }

  return workspaceData;
}

export async function loadSingleCaseDetails(
  caseId: string,
  workspace: WorkspaceData,
  me: ApiUser,
): Promise<WorkspaceData> {
  const optional = async <T,>(label: string, read: () => Promise<T>, fallback: T, critical = true): Promise<T> => {
    try {
      return await read();
    } catch (error) {
      if (isSessionExpired(error) || error instanceof ApiCancelledError) throw error;
      if (critical) throw new Error(`${label} : ${error instanceof Error ? error.message : String(error)}`);
      workspace.warnings.push(`${label} : ${error instanceof Error ? error.message : String(error)}`);
      return fallback;
    }
  };
  const units = new Map(me.memberships.map((m) => [m.unit.id, m.unit.name]));
  let caseItem = workspace.cases.find((c) => c.id === caseId);
  if (!caseItem) {
    caseItem = await apiGet<ApiCase>(`/dossiers/${encodeURIComponent(caseId)}/`);
  }
  const details = await fetchCaseDetailData(caseItem, optional);
  return applyCaseDetails(workspace, caseItem, details, workspace.users, units);
}
