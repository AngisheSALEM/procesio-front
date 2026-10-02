import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchStatistics,
  fetchStatisticsDetail,
  fetchDocumentTemplates,
  approveDocumentTemplate,
  apiPatch,
  cancelSessionRequests,
} from '../src/api/client.ts';
import { loadSingleCaseDetails } from '../src/api/workspace.ts';

const originalFetch = globalThis.fetch;
globalThis.document = { cookie: 'csrftoken=test-csrf' };
afterEach(() => {
  globalThis.fetch = originalFetch;
  cancelSessionRequests();
});

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('fetchStatistics queries /statistiques/ with unit, start, and end parameters', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return jsonResponse({
      unit: 'u-1',
      start: '2026-01-01',
      end: '2026-10-02',
      definition_version: 'prototype-1',
      prototype_only: true,
      families: [],
    });
  };

  const stats = await fetchStatistics('u-1', '2026-01-01', '2026-10-02');
  assert.equal(requestedUrl, '/api/v1/statistiques/?unit=u-1&start=2026-01-01&end=2026-10-02');
  assert.equal(stats.unit, 'u-1');
  assert.equal(stats.definition_version, 'prototype-1');
});

test('fetchStatisticsDetail queries /statistiques/<key>/ and includes provenance when provided', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({
      key: 'requests.issued',
      label: 'Demandes émises',
      definition: 'Une demande par date réelle',
      definition_version: 'prototype-1',
      unit: 'u-1',
      start: '2026-01-01',
      end: '2026-10-02',
      count: 3,
      next: null,
      previous: null,
      results: [
        { id: 'req-1', url: '/api/v1/demandes/req-1/', reference: 'DEM-001', title: 'Factures', date: '2026-02-01', case_id: 'c-1', case_reference: 'DOS-1' }
      ],
    });
  };

  const detail = await fetchStatisticsDetail('requests.issued', 'u-1', '2026-01-01', '2026-10-02');
  assert.equal(detail.count, 3);
  assert.equal(detail.results[0].reference, 'DEM-001');
  assert.equal(calls[0], '/api/v1/statistiques/requests.issued/?unit=u-1&start=2026-01-01&end=2026-10-02');

  await fetchStatisticsDetail('intelligence.received', 'u-1', '2026-01-01', '2026-10-02', 'douane');
  assert.equal(calls[1], '/api/v1/statistiques/intelligence.received/?unit=u-1&start=2026-01-01&end=2026-10-02&provenance=douane');
});

test('fetchDocumentTemplates filters by state and search string', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return jsonResponse({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'tpl-1',
          code: 'DGDA-DEM-COM',
          name: 'Demande de communication',
          category: 'demande',
          version: '1.0',
          state: 'approved',
          description: 'Modèle officiel',
          file_name: 'demande.pdf',
          content_type: 'application/pdf',
          effective_date: '2026-01-01',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          created_by: 1,
          approved_by: 1,
          approved_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
  };

  const templates = await fetchDocumentTemplates({ state: 'approved', search: 'communication' });
  assert.equal(templates.length, 1);
  assert.equal(templates[0].code, 'DGDA-DEM-COM');
  assert.ok(requestedUrl.includes('/modeles/'));
  assert.ok(requestedUrl.includes('state=approved'));
  assert.ok(requestedUrl.includes('search=communication'));
});

test('approveDocumentTemplate calls /modeles/<id>/approuver/', async () => {
  let requestedUrl = '';
  let requestedMethod = '';
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedMethod = String(init?.method);
    return jsonResponse({ id: 'tpl-2', state: 'approved', approved_at: '2026-10-02T12:00:00Z' });
  };

  const approved = await approveDocumentTemplate('tpl-2');
  assert.equal(requestedUrl, '/api/v1/modeles/tpl-2/approuver/');
  assert.equal(requestedMethod, 'POST');
  assert.equal(approved.state, 'approved');
});

test('PATCH /me/ updates agent profile grade and matricule', async () => {
  let requestedUrl = '';
  let requestedBody = null;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return jsonResponse({
      id: 1,
      username: 'inspecteur1',
      first_name: 'Alain',
      last_name: 'Kasongo',
      email: 'alain@dgda.cd',
      grade: 'Inspecteur Principal',
      matricule: 'DGDA-2026-99',
      memberships: [],
    });
  };

  const updated = await apiPatch('/me/', { grade: 'Inspecteur Principal', matricule: 'DGDA-2026-99' });
  assert.equal(requestedUrl, '/api/v1/me/');
  assert.equal(requestedBody.grade, 'Inspecteur Principal');
  assert.equal(requestedBody.matricule, 'DGDA-2026-99');
  assert.equal(updated.grade, 'Inspecteur Principal');
  assert.equal(updated.matricule, 'DGDA-2026-99');
});

test('loadSingleCaseDetails fetches only targeted case sub-resources and registers loadedCaseIds', async () => {
  const caseRow = {
    id: 'case-target',
    reference: 'DOS-TARGET',
    unit: 'u-1',
    assignee: 1,
    created_at: '2026-10-01',
    status: 'open',
    version: 1,
    capabilities: ['case.update'],
  };
  const mockWorkspace = {
    users: [{ id: 1, username: 'agent', first_name: 'A', last_name: 'B', email: '', memberships: [] }],
    cases: [caseRow],
    intelligence: [],
    observationAssessments: {},
    agentScopes: {},
    assignableAgentIds: [1],
    restrictedAgentIds: [],
    requests: { 'case-target': [] },
    responses: {},
    defenses: {},
    missions: { 'case-target': [] },
    assessments: {},
    sheets: { 'case-target': [] },
    decisions: { 'case-target': [] },
    transfers: { 'case-target': [] },
    documents: { 'case-target': [] },
    dossiers: [],
    renseignements: [],
    demandesParDossier: { 'case-target': [] },
    feuillesParDossier: { 'case-target': [] },
    documentsParDossier: { 'case-target': [] },
    workItems: [],
    validationItems: [],
    statistics: null,
    warnings: [],
    loadedCaseIds: new Set(),
  };

  const queriedEndpoints = [];
  globalThis.fetch = async (url) => {
    queriedEndpoints.push(String(url));
    if (url.includes('/demandes/?case=')) {
      return jsonResponse({
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 'req-target', case: 'case-target', version: 1, state: 'issued', items: [], target_name: 'Tiers' }],
      });
    }
    return jsonResponse({ count: 0, next: null, previous: null, results: [] });
  };

  const updatedWorkspace = await loadSingleCaseDetails('case-target', mockWorkspace, mockWorkspace.users[0]);
  assert.ok(updatedWorkspace.loadedCaseIds.has('case-target'));
  assert.equal(updatedWorkspace.requests['case-target'].length, 1);
  assert.equal(updatedWorkspace.demandesParDossier['case-target'].length, 1);
  assert.ok(queriedEndpoints.some((url) => url.includes('/demandes/?case=case-target')));
  assert.ok(!queriedEndpoints.some((url) => url.includes('/demandes/?case=other')));
});
