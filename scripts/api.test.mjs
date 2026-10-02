import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { demandeFromApi, feuilleFromApi, dossierFromApi } from '../src/api/mappers.ts';
import { apiGet, apiPost, apiAll, getSession, downloadFile, ApiError, isSessionExpired, onSessionExpired, cancelSessionRequests, ApiCancelledError } from '../src/api/client.ts';
import { loadWorkspace } from '../src/api/workspace.ts';
import { proposeClassification, saveRequest, saveSheet } from '../src/api/actions.ts';

const originalFetch = globalThis.fetch;
globalThis.document = { cookie: 'csrftoken=test-csrf' };
afterEach(() => { globalThis.fetch = originalFetch; cancelSessionRequests(); });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const page = (rows = []) => ({ count: rows.length, results: rows, next: null, previous: null });
const user = { id: 1, username: 'agent', first_name: 'Ada', last_name: 'Mbuyi', email: '', memberships: [] };
const caseRow = { id: 'case', reference: 'DOS-1', unit: 'unit', unit_code: 'U', assignee: 1, assignee_username: 'agent', created_at: '2026-10-01T10:00:00Z', status: 'open', version: 1, capabilities: ['case.update'] };
const request = { id: 'request', case: 'case', author: 1, state: 'issued', created_at: caseRow.created_at, target_name: 'Tiers', items: [{ id: 'a', label: 'Pièce A' }, { id: 'b', label: 'Pièce B' }], version: 1 };
const reply = (ids, voided = []) => ({ id: 'response', request: 'request', received_on: '2026-10-02', letter: 'letter', annexes: ['annex'], item_links: ids.map((item) => ({ item, voided_at: voided.includes(item) ? '2026-10-02' : null })) });
const assessment = (version, substance = 'satisfactory', completeness = 'complete', receipt = 'received') => ({ id: `assessment-${version}`, version, receipt, completeness, substance, reason: 'Motif' });
const sheet = { id: 'sheet', case: 'case', created_at: caseRow.created_at, author: 1, observations: [{ id: 'o1', number: 1, facts: 'Faits 1', documents: ['proof'] }, { id: 'o2', number: 2, facts: 'Faits 2', documents: [] }] };

test('a complete response, including successive complements, stays complete without an assessment', () => {
  const mapped = demandeFromApi(request, [reply(['a']), { ...reply(['b']), id: 'complement' }], [], {});
  assert.equal(mapped.statut, 'REPONSE_COMPLETE');
  assert.equal(mapped.evaluationReponse, undefined);
  assert.deepEqual(mapped.elementsDemandes.map((item) => item.statutRemise), ['FOURNI', 'FOURNI']);
  assert.deepEqual(mapped.reponsesRecues[0].piecesJointes, ['letter', 'annex']);
});
test('one satisfactory element never makes the whole request satisfactory', () => {
  assert.equal(demandeFromApi(request, [reply(['a', 'b'])], [], { a: [assessment(1)] }).evaluationReponse, undefined);
  assert.equal(demandeFromApi(request, [reply(['a'])], [], { a: [assessment(1)] }).statut, 'REPONSE_PARTIELLE');
  assert.equal(demandeFromApi(request, [reply(['a', 'b'])], [], { a: [assessment(1)], b: [assessment(1)] }).evaluationReponse, 'SATISFAISANTE');
});
test('latest versions, insufficient or missing items, and voided links are respected', () => {
  const mapped = demandeFromApi(request, [reply(['a', 'b'])], [], { a: [assessment(3, 'pending', 'insufficient'), assessment(1)], b: [assessment(2, 'pending', 'unknown', 'not_received')] });
  assert.deepEqual(mapped.elementsDemandes.map((item) => item.statutRemise), ['INCOMPLET', 'MANQUANT']);
  assert.equal(mapped.evaluationReponse, undefined);
  assert.equal(demandeFromApi(request, [reply(['a', 'b'], ['b'])], [], {}).statut, 'REPONSE_PARTIELLE');
});
test('validated and signed requests keep their distinct lifecycle states', () => {
  for (const [state, expected] of [['draft', 'BROUILLON'], ['submitted', 'A_VALIDER'], ['validated', 'VALIDEE'], ['signed', 'SIGNEE']]) {
    assert.equal(demandeFromApi({ ...request, state }, [], [], {}).statut, expected);
  }
});
test('a rectified response no longer supplies an element even if its old assessment was satisfactory', () => {
  const mapped = demandeFromApi(request, [reply(['a', 'b'], ['b'])], [], { a: [assessment(1)], b: [assessment(1)] });
  assert.equal(mapped.statut, 'REPONSE_PARTIELLE');
  assert.equal(mapped.elementsDemandes[1].statutRemise, 'MANQUANT');
  assert.equal(mapped.evaluationReponse, undefined);
});
test('defenses and assessments remain local to each observation and do not close the sheet', () => {
  const defense = { id: 'defense', sheet: 'sheet', observations: ['o1'], received_on: '2026-10-02', recorded_at: caseRow.created_at, letter: 'letter', annexes: [] };
  const mapped = feuilleFromApi(sheet, [], [defense], { o1: [{ version: 1, conclusion: 'satisfactory', reason: 'Expliqué' }] });
  assert.equal(mapped.statutFeuille, 'DEFENSE_RECUE');
  assert.equal(mapped.observations[0].appreciationEnqueteur, 'POINT_EXPLIQUE');
  assert.deepEqual(mapped.observations[0].justificatifsAssocies, ['proof']);
  assert.equal(mapped.observations[1].statutConstat, 'OUVERT');
  assert.equal(mapped.observations[1].defenseRecue, undefined);
  assert.equal(mapped.decisionFinale, undefined);
});
test('decisions are explicit; a proposed classification never closes a case', () => {
  const mapped = dossierFromApi(caseRow, [], new Map(), [{ id: 'decision', kind: 'classification', state: 'proposed', reason: 'Motif', created_at: caseRow.created_at }]);
  assert.equal(mapped.statut, 'OUVERT');
  assert.equal(mapped.decisionCloture, undefined);
  assert.equal(mapped.decisions[0].state, 'proposed');
});
test('a validated replacement supersedes the previous classification without inventing a closed case status', () => {
  const classification = { id: 'classification', kind: 'classification', state: 'validated', reason: 'Motif', created_at: caseRow.created_at, validated_at: caseRow.created_at };
  assert.equal(dossierFromApi(caseRow, [], new Map(), [classification]).decisionCloture, 'CLASSE_SANS_SUITE');
  const mapped = dossierFromApi(caseRow, [], new Map(), [classification, { ...classification, id: 'replacement', kind: 'litigation', replaces: classification.id }]);
  assert.equal(mapped.statut, 'OUVERT');
  assert.equal(mapped.decisionCloture, undefined);
  assert.equal(mapped.decisions.length, 2);
});
test('DRF session expiry is detected even with HTTP 403; permission denials and login errors differ', async () => {
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    globalThis.fetch = async () => response({ code: 'not_authenticated' }, 403);
    await assert.rejects(apiGet('/me/'), isSessionExpired);
    assert.equal(expired, 1);
    globalThis.fetch = async () => response({ code: 'permission_denied' }, 403);
    await assert.rejects(apiGet('/dossiers/'), (error) => !isSessionExpired(error));
    globalThis.fetch = async () => response({ code: 'authentication_failed' }, 401);
    await assert.rejects(apiPost('/session/', {}));
    assert.equal(expired, 1);
  } finally { unsubscribe(); }
});
test('server HTML, invalid successful JSON and field validation are actionable', async () => {
  globalThis.fetch = async () => new Response('<html>Failure</html>', { status: 502 });
  await assert.rejects(apiGet('/me/'), (error) => error instanceof ApiError && error.status === 502);
  globalThis.fetch = async () => new Response('<html>Wrong route</html>');
  await assert.rejects(apiGet('/me/'), /Réponse du serveur invalide/);
  globalThis.fetch = async () => response({ code: 'validation_error', message: 'Entrée invalide.', fields: { reason: ['Motif requis.'] } }, 400);
  await assert.rejects(apiPost('/decisions/', {}), /reason : Motif requis/);
});
test('request cancellation stops pending requests without turning it into session expiry', async () => {
  globalThis.fetch = (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const pending = apiGet('/dossiers/');
  cancelSessionRequests();
  await assert.rejects(pending, ApiCancelledError);
});
test('a malformed session response is an error rather than a false logout', async () => {
  globalThis.fetch = async () => response({});
  await assert.rejects(getSession(), /Réponse de session invalide/);
});
test('a download completed after logout cannot produce a private client file', async () => {
  let resolveBlob;
  let started;
  const bodyStarted = new Promise((resolve) => { started = resolve; });
  globalThis.fetch = async () => ({ ok: true, blob: () => { started(); return new Promise((resolve) => { resolveBlob = resolve; }); } });
  const pending = downloadFile('/documents/proof/telecharger/', 'proof.pdf');
  await bodyStarted;
  cancelSessionRequests();
  resolveBlob(new Blob(['private']));
  await assert.rejects(pending, ApiCancelledError);
});
test('pagination consumes all pages and rejects malformed lists', async () => {
  let count = 0;
  globalThis.fetch = async () => response(count++ === 0 ? { ...page([1]), next: 'http://localhost/api/v1/dossiers/?page=2' } : page([2]));
  assert.deepEqual(await apiAll('/dossiers/'), [1, 2]);
  globalThis.fetch = async () => response({});
  await assert.rejects(apiAll('/dossiers/'), /Liste du serveur invalide/);
});
test('workspace loads existing defense endpoints and never swallows expired sessions', async () => {
  globalThis.fetch = async (url) => {
    if (url.includes('/dossiers/')) return response(page([caseRow]));
    if (url.startsWith('/api/v1/feuilles/?')) return response(page([sheet]));
    if (url.includes('/defenses/')) return response(page([{ id: 'defense', sheet: 'sheet', observations: ['o1'], letter: 'letter', annexes: [], received_on: '2026-10-02', recorded_at: caseRow.created_at }]));
    if (url.includes('/o1/appreciations/')) return response(page([{ version: 1, conclusion: 'satisfactory', reason: 'Expliqué' }]));
    return response(page());
  };
  const workspace = await loadWorkspace(user);
  assert.equal(workspace.feuillesParDossier.case[0].observations[0].appreciationEnqueteur, 'POINT_EXPLIQUE');
  globalThis.fetch = async (url) => url.includes('/dossiers/') ? response(page()) : response({ code: 'not_authenticated' }, 403);
  await assert.rejects(loadWorkspace(user), isSessionExpired);
});
test('essential server failures fail workspace loading instead of displaying false empty data', async () => {
  globalThis.fetch = async (url) => url.includes('/dossiers/') ? response(page([caseRow])) : url.includes('/demandes/') ? response({ code: 'dependency_unavailable' }, 503) : response(page());
  await assert.rejects(loadWorkspace(user), /demandes/);
});
test('classification never uses a historical satisfactory assessment superseded by a pending one', async () => {
  const workspace = { cases: [caseRow], requests: { case: [request] }, sheets: {}, decisions: {}, assessments: { a: [assessment(2, 'pending'), assessment(1)] }, observationAssessments: {} };
  await assert.rejects(proposeClassification(workspace, 'case', 'Motif'), /actuelle/);
  let posted;
  globalThis.fetch = async (_url, init) => { posted = JSON.parse(init.body); return response({ id: 'decision' }); };
  workspace.assessments.a = [assessment(3)];
  workspace.requests.case = [{ ...request, items: request.items.map((item) => ({ ...item, assessment_version: item.id === 'a' ? 3 : 0 })) }];
  workspace.decisions.case = [{ id: 'old', state: 'returned', created_at: caseRow.created_at }];
  await proposeClassification(workspace, 'case', 'Motif');
  assert.equal(posted.request_assessment, 'assessment-3');
  assert.equal(posted.replaces, 'old');
});
test('a global satisfactory write cannot assess a partial response', async () => {
  globalThis.fetch = async () => response(page([reply(['a'])]));
  const item = demandeFromApi(request, [reply(['a'])], [], {});
  item.evaluationReponse = 'SATISFAISANTE';
  await assert.rejects(saveRequest({ requests: { case: [request] }, demandesParDossier: { case: [] } }, item), /Tous les éléments/);
});
test('editing a sheet retains its document links', async () => {
  let posted;
  globalThis.fetch = async (_url, init) => { posted = JSON.parse(init.body); return response({}); };
  const item = feuilleFromApi({ ...sheet, recipient_address: 'Adresse', concerned_party: 'Tiers' }, []);
  await saveSheet({ sheets: { case: [{ ...sheet, version: 1 }] } }, item);
  assert.deepEqual(posted.observations[0].documents, ['proof']);
});
test('an unsatisfactory substance assessment retains a complete receipt independently', async () => {
  const writes = [];
  globalThis.fetch = async (_url, init) => {
    if (init.method === 'POST') { writes.push(JSON.parse(init.body)); return response({}); }
    return response(page([reply(['a', 'b'])]));
  };
  const item = demandeFromApi(request, [reply(['a', 'b'])], [], { a: [assessment(1, 'pending')], b: [assessment(1, 'pending')] });
  item.evaluationReponse = 'NON_SATISFAISANTE';
  item.motifSatisfaction = 'Fond non justifié';
  await saveRequest({ requests: { case: [request] }, demandesParDossier: { case: [] }, assessments: { a: [assessment(1, 'pending')], b: [assessment(1, 'pending')] } }, item);
  assert.equal(writes.length, 2);
  assert.ok(writes.every((row) => row.receipt === 'received' && row.completeness === 'complete' && row.substance === 'unsatisfactory'));
});
