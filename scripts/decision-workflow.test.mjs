import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { currentDecision, decisionSources, proposeDecision, reviewDecision, prepareTransfer, recordTransfer, transferSubmission } from '../src/api/decisions.ts';
import { dossierFromApi } from '../src/api/mappers.ts';
import { cancelSessionRequests, ApiError } from '../src/api/client.ts';
import { loadWorkspace } from '../src/api/workspace.ts';

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
globalThis.document = { cookie: 'csrftoken=test-only' };
afterEach(() => { globalThis.fetch = originalFetch; cancelSessionRequests(); });
process.on('exit', () => { globalThis.document = originalDocument; });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const dossier = { id: 'case', capabilities: ['case.update'], version: 8, reference: 'CASE', created_at: '2026-01-01T00:00:00Z', status: 'open' };
const source = { id: 'assessment-2', version: 2, substance: 'unsatisfactory', reason: 'Justification insuffisante' };
function workspace() { return { cases: [dossier], decisions: {}, requests: { case: [{ reference: 'DC', items: [{ id: 'item', label: 'Factures', assessment_version: 2 }] }] }, assessments: { item: [source, { ...source, id: 'old', version: 1, substance: 'satisfactory' }] }, sheets: {}, observationAssessments: {} }; }
const proof = { id: 'proof', case: 'case', state: 'accepted', content_type: 'application/pdf' };
const transfer = { id: 'transfer', case: 'case', version: 1, state: 'prepared', allowed_actions: ['transmit'] };
const date = '2026-01-02T12:00:00Z';

test('proposals explicitly select a current source, kind, case version and historical replacement', async () => {
  const data = workspace();
  data.decisions.case = [{ id: 'returned', state: 'returned', created_at: date }];
  let payload;
  globalThis.fetch = async (_url, init) => { payload = JSON.parse(init.body); return json({ id: 'new' }, 201); };
  await proposeDecision(data, 'case', 'gelec', ' Motif de relais ', source.id);
  assert.deepEqual(payload, { case: 'case', case_version: 8, kind: 'gelec', reason: 'Motif de relais', request_assessment: source.id, replaces: 'returned' });
  assert.deepEqual(decisionSources(data, 'case').map((row) => row.id), [source.id]);
  data.requests.case[0].items[0].assessment_version = 3;
  assert.deepEqual(decisionSources(data, 'case'), []);
  await assert.rejects(proposeDecision(data, 'case', 'gelec', 'Motif', source.id), /actuelle/);
});

test('pending, historical, cross-case sources, missing rights and a second proposal are refused before writing', async () => {
  let writes = 0;
  globalThis.fetch = async () => { writes++; return json({}); };
  for (const alter of [
    (data) => { data.cases = [{ ...dossier, capabilities: [] }]; },
    (data) => { data.assessments.item = [{ ...source, substance: 'pending' }]; },
    (data) => { data.decisions.case = [{ state: 'proposed', created_at: date, id: 'pending' }]; },
  ]) {
    const data = workspace(); alter(data);
    await assert.rejects(proposeDecision(data, 'case', 'classification', 'Motif', source.id));
  }
  await assert.rejects(proposeDecision(workspace(), 'case', 'mission', ' ', source.id));
  await assert.rejects(proposeDecision(workspace(), 'case', 'mission', 'Motif', 'other-case-assessment'));
  assert.equal(writes, 0);
});

test('observation sources are current and remain explicit in the proposal', async () => {
  const data = workspace();
  data.sheets.case = [{ reference: 'FO', observations: [{ id: 'observation', number: 1, assessment_version: 4 }] }];
  data.observationAssessments.observation = [{ id: 'obs-assessment', version: 4, conclusion: 'satisfactory', reason: 'Expliqué' }];
  let payload;
  globalThis.fetch = async (_url, init) => { payload = JSON.parse(init.body); return json({}); };
  await proposeDecision(data, 'case', 'complement', 'Motif', 'obs-assessment');
  assert.equal(payload.observation_assessment, 'obs-assessment');
  assert.equal(payload.request_assessment, undefined);
});

test('the last validated decision applies through proposals and returns; indirect replacement clears classification', () => {
  const first = { id: 'first', state: 'validated', kind: 'classification', reason: 'Motif initial', created_at: '2026-01-01', validated_at: date };
  const returned = { id: 'returned', replaces: first.id, state: 'returned', kind: 'mission', created_at: '2026-01-02' };
  const next = { id: 'next', replaces: returned.id, state: 'proposed', kind: 'gelec', created_at: '2026-01-03' };
  const rows = [returned, next, first];
  assert.equal(currentDecision(rows).id, first.id);
  assert.equal(dossierFromApi(dossier, [], new Map(), rows).decisionCloture, 'CLASSE_SANS_SUITE');
  next.state = 'validated';
  const mapped = dossierFromApi(dossier, [], new Map(), rows);
  assert.equal(mapped.decisionCloture, undefined);
  assert.equal(mapped.decisionCourante.kind, 'gelec');
  assert.equal(mapped.statut, 'OUVERT');
  assert.equal(mapped.hasPv, undefined);
});

test('validation, motivated return and preparation use only server-authorized actions', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push([url, JSON.parse(init.body)]); return json({}); };
  const decision = { id: 'decision', version: 3, allowed_actions: ['validate', 'return', 'prepare_transfer'] };
  await reviewDecision(decision, 'validate');
  await assert.rejects(reviewDecision(decision, 'return', ' '), /motif/);
  await reviewDecision(decision, 'return', ' Reprendre les faits ');
  await prepareTransfer(decision);
  assert.deepEqual(calls, [
    ['/api/v1/decisions/decision/valider/', { version: 3 }],
    ['/api/v1/decisions/decision/retourner/', { version: 3, comment: 'Reprendre les faits' }],
    ['/api/v1/transferts-gelec/', { decision: 'decision' }],
  ]);
  await assert.rejects(reviewDecision({ ...decision, allowed_actions: [] }, 'validate'));
  await assert.rejects(prepareTransfer({ ...decision, allowed_actions: [] }));
  assert.equal(calls.length, 3);
});

test('an uncertain transmission retry preserves its key; changed evidence gets another key', async () => {
  const bodies = [];
  const keys = new Map();
  globalThis.fetch = async (_url, init) => { bodies.push(JSON.parse(init.body)); if (bodies.length === 1) throw new Error('network'); return json({ state: 'transmitted' }); };
  await assert.rejects(recordTransfer(transfer, 'transmit', 'proof', date, 'REF', [proof], keys));
  await recordTransfer(transfer, 'transmit', 'proof', date, 'REF', [proof], keys);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.notEqual(transferSubmission(transfer, 'transmit', 'proof', date, 'OTHER', [proof], keys).idempotency_key, bodies[0].idempotency_key);
  assert.equal(bodies[0].version, 1);
  assert.equal(bodies[0].received_at, undefined);
  const confirm = transferSubmission({ ...transfer, version: 2, state: 'transmitted', allowed_actions: ['confirm'] }, 'confirm', 'proof', date, 'REF', [proof], keys);
  assert.equal(confirm.received_at, date.replace('Z', '.000Z'));
  assert.equal(confirm.transmitted_at, undefined);
});

test('GELEC rejects unavailable proofs, wrong scope, future dates and missing actions', () => {
  for (const row of [{ ...proof, state: 'quarantine' }, { ...proof, case: 'other' }, { ...proof, content_type: 'image/png' }]) {
    assert.throws(() => transferSubmission(transfer, 'transmit', 'proof', date, '', [row], new Map()), /PDF accepté/);
  }
  for (const value of ['', 'bad-date', new Date(Date.now() + 60_000).toISOString()]) assert.throws(() => transferSubmission(transfer, 'transmit', 'proof', value, '', [proof], new Map()), /date réelle/);
  assert.throws(() => transferSubmission({ ...transfer, allowed_actions: [] }, 'transmit', 'proof', date, '', [proof], new Map()), /autorisée/);
});

test('GELEC server conflicts propagate and unavailable transfer lists fail workspace loading', async () => {
  globalThis.fetch = async () => json({ code: 'conflict' }, 409);
  await assert.rejects(recordTransfer(transfer, 'transmit', 'proof', date, '', [proof], new Map()), (error) => error instanceof ApiError && error.status === 409);
  globalThis.fetch = async (url) => url.includes('/dossiers/') ? json({ results: [dossier], next: null }) : url.includes('/transferts-gelec/') ? json({ code: 'dependency_unavailable' }, 503) : json({ results: [], next: null });
  await assert.rejects(loadWorkspace({ id: 1, memberships: [] }), /transferts GELEC/);
});
