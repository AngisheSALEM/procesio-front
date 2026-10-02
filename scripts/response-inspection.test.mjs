import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordResponse, rectifyResponse, assessRequestItem, recordDefense, assessObservation } from '../src/api/workflows.ts';
import { demandeFromApi, feuilleFromApi } from '../src/api/mappers.ts';
import { loadWorkspace } from '../src/api/workspace.ts';
import { cancelSessionRequests } from '../src/api/client.ts';

const originalFetch = globalThis.fetch;
globalThis.document = { cookie: 'csrftoken=test-only' };
afterEach(() => { globalThis.fetch = originalFetch; cancelSessionRequests(); });
const json = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const page = (results) => ({ count: results.length, results, next: null, previous: null });
const request = { id: 'request', case: 'case', state: 'issued', created_at: '2026-10-02', author: 1, target_name: 'Test', items: [{ id: 'o1', number: 1, label: 'O1', assessment_version: 3 }, { id: 'o2', number: 2, label: 'O2', assessment_version: 0 }] };
const documents = ['letter1', 'letter2', 'annex'].map((id) => ({ id, case: 'case', state: 'accepted', content_type: 'application/pdf' }));
const response = { id: 'response', request: 'request', version: 4, letter: 'letter1', annexes: ['annex'], received_on: '2026-10-02', item_links: [{ id: 'link1', item: 'o1', voided_at: null }] };
const sheet = { id: 'sheet', case: 'case', author: 1, created_at: '2026-10-02', observations: [{ id: 'o1', number: 1, facts: 'O1', documents: [], assessment_version: 2 }, { id: 'o2', number: 2, facts: 'O2', documents: [], assessment_version: 0 }] };
const defense = { id: 'defense', sheet: 'sheet', observations: ['o1'], letter: 'letter1', annexes: ['annex'], received_on: '2026-10-02', recorded_at: '2026-10-02' };

test('two partial replies for O1 and an individual unsatisfactory assessment never supply or assess O2', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { const body = JSON.parse(init.body); calls.push({ url, body }); return json(body); };
  await recordResponse(request, documents, { letter: 'letter1', annexes: ['annex'], received_on: '2026-10-02', item_ids: ['o1'], external_reference: 'A', sender_name: 'Test', note: '' });
  await recordResponse(request, documents, { letter: 'letter2', annexes: [], received_on: '2026-10-02', item_ids: ['o1'], complement_of: 'response', external_reference: 'B', sender_name: 'Test', note: '' });
  await assessRequestItem(request, request.items[0], true, 'complete', 'unsatisfactory', 'Motif O1');
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.slice(0, 2).map((row) => row.body.item_ids), [['o1'], ['o1']]);
  assert.deepEqual(calls[2].body, { version: 3, receipt: 'received', completeness: 'complete', substance: 'unsatisfactory', reason: 'Motif O1' });
  assert.match(calls[2].url, /elements\/o1\/appreciations/);
  const mapped = demandeFromApi(request, [response, { ...response, id: 'second', letter: 'letter2' }], [], { o1: [{ version: 4, receipt: 'received', completeness: 'complete', substance: 'unsatisfactory', reason: 'Motif O1' }] });
  assert.equal(mapped.statut, 'REPONSE_PARTIELLE');
  assert.equal(mapped.elementsDemandes[1].statutRemise, 'EN_ATTENTE');
  assert.equal(mapped.elementsDemandes[1].appreciation, undefined);
});

test('rectification sends the current response version, link ids for removals and item ids for additions', async () => {
  let call;
  globalThis.fetch = async (url, init) => { call = { url, body: JSON.parse(init.body) }; return json(response); };
  await rectifyResponse(response, ['o2'], 'Association corrigée');
  assert.equal(call.url, '/api/v1/reponses/response/rectifier-liens/');
  assert.deepEqual(call.body, { version: 4, add_item_ids: ['o2'], remove_link_ids: ['link1'], reason: 'Association corrigée' });
  assert.throws(() => rectifyResponse(response, ['o1'], 'Identique'), /association/);
});

test('defense and assessment write only O1 and reload without changing O2', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return json(defense); };
  await recordDefense(sheet, documents, { letter: 'letter1', annexes: ['annex'], received_on: '2026-10-02', observation_ids: ['o1'] });
  await assessObservation(sheet, sheet.observations[0], defense, 'satisfactory', 'Motif O1');
  assert.deepEqual(calls[0].body.observation_ids, ['o1']);
  assert.deepEqual(calls[1].body, { version: 2, defense: 'defense', conclusion: 'satisfactory', reason: 'Motif O1' });
  assert.throws(() => assessObservation(sheet, sheet.observations[1], defense, 'satisfactory', 'Motif O2'), /ce constat/);
  const mapped = feuilleFromApi(sheet, [], [defense], { o1: [{ version: 3, conclusion: 'satisfactory', reason: 'Motif O1' }] });
  assert.equal(mapped.observations[0].appreciationEnqueteur, 'POINT_EXPLIQUE');
  assert.equal(mapped.observations[1].defenseRecue, undefined);
  assert.equal(mapped.observations[1].appreciationEnqueteur, undefined);
  assert.equal(mapped.observations[1].statutConstat, 'OUVERT');
});

test('missing, duplicate, quarantined, foreign documents and observations fail before any write', () => {
  globalThis.fetch = async () => assert.fail('Must not write invalid associations');
  for (const rows of [documents.map((doc) => ({ ...doc, case: 'other' })), documents.map((doc) => ({ ...doc, state: 'quarantine' }))]) {
    assert.throws(() => recordDefense(sheet, rows, { letter: 'letter1', annexes: [], received_on: '2026-10-02', observation_ids: ['o1'] }));
  }
  assert.throws(() => recordDefense(sheet, documents, { letter: 'letter1', annexes: ['letter1'], received_on: '2026-10-02', observation_ids: ['o1'] }));
  assert.throws(() => recordDefense(sheet, documents, { letter: 'letter1', annexes: [], received_on: '2026-10-02', observation_ids: ['foreign'] }));
  assert.throws(() => recordResponse(request, documents, { letter: 'letter1', annexes: [], received_on: '2026-10-02', item_ids: [] }));
  assert.throws(() => assessRequestItem(request, request.items[0], true, 'complete', 'unsatisfactory', ' '), /motif/);
});

test('workspace retains raw responses, defenses, missions and project versions alongside their display mappings', async () => {
  const caseRow = { id: 'case', reference: 'DOS', unit: 'unit', assignee: 1, created_at: '2026-10-02', status: 'open' };
  const project = { id: 'project', sheet: 'sheet', sheet_version: 1 };
  const mission = { id: 'mission', case: 'case', participants: [1], documents: ['annex'] };
  globalThis.fetch = async (url) => {
    if (url === '/api/v1/dossiers/?page_size=100') return json(page([caseRow]));
    if (url.startsWith('/api/v1/demandes/?')) return json(page([request]));
    if (url.startsWith('/api/v1/feuilles/?')) return json(page([{ ...sheet, mission: 'mission', projects: [project] }]));
    if (url.startsWith('/api/v1/missions/?')) return json(page([mission]));
    if (url.includes('/reponses/')) return json(page([response]));
    if (url.includes('/defenses/')) return json(page([defense]));
    return json(page([]));
  };
  const loaded = await loadWorkspace({ id: 1, memberships: [] });
  assert.equal(loaded.responses.request[0].version, 4);
  assert.equal(loaded.defenses.sheet[0].id, 'defense');
  assert.equal(loaded.missions.case[0].id, 'mission');
  assert.equal(loaded.sheets.case[0].projects[0].id, 'project');
  assert.equal(loaded.feuillesParDossier.case[0].missionId, 'mission');
  assert.equal(loaded.feuillesParDossier.case[0].observations[1].defenseRecue, undefined);
});
