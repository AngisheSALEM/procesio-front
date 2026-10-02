import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequest, saveRequest } from '../src/api/actions.ts';
import { ApiError, uploadFile, downloadFile, cancelSessionRequests, onSessionExpired } from '../src/api/client.ts';

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
globalThis.document = { cookie: 'csrftoken=test-only' };
afterEach(() => { globalThis.fetch = originalFetch; cancelSessionRequests(); });
process.on('exit', () => { globalThis.document = originalDocument; });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const item = {
  id: 'new', dossierId: 'case-1', statut: 'BROUILLON', objet: 'Factures fictives',
  destinataire: { nom: 'Entreprise test', qualite: 'Entreprise', adresse: 'Adresse test' },
  elementsDemandes: [{ id: 'element-1', libelle: 'Factures' }], reponsesRecues: [],
};
const document = { id: 'piece-1', case: 'case-1', state: 'accepted', content_type: 'application/pdf', original_name: 'lettre.pdf' };
const file = () => new File(['%PDF-1.4\nTEST'], 'lettre.pdf', { type: 'application/pdf' });

test('draft and uploaded PDF survive quarantine without implicit preparation or submission', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push([url, init.body]);
    if (url === '/api/v1/demandes/') return json({ id: 'request-1', reference: 'DC-TEST', version: 1 });
    if (url === '/api/v1/documents/') return json({ ...document, state: 'quarantine' }, 201);
    assert.fail(`Unexpected operation: ${url}`);
  };
  const created = await createRequest(item, file());
  assert.equal(created.id, 'request-1');
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[0][1]).mode, 'imported');
  assert.equal(calls[1][1].get('case'), 'case-1');
});

test('upload failure identifies the saved draft so the user can resume without recreating it', async () => {
  globalThis.fetch = async (url) => url === '/api/v1/demandes/' ? json({ id: 'request-1', reference: 'DC-TEST' }) : json({ code: 'dependency_unavailable' }, 503);
  await assert.rejects(createRequest(item, file()), /Brouillon DC-TEST enregistré.*Documents/);
});

test('oversized uploads never create a draft or send a multipart request', async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; return json({}); };
  const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'oversized.pdf');
  await assert.rejects(uploadFile(oversized, { case: 'case-1' }), /10 Mio/);
  await assert.rejects(createRequest(item, oversized), /10 Mio/);
  assert.equal(called, false);
});

const responseItem = { ...item, id: 'request-1', statut: 'REPONSE_PARTIELLE', reponseDocumentId: 'piece-1',
  reponsesRecues: [{ id: 'new-response', dateReception: '2026-10-02', elementsFournisIds: ['element-1'], referenceCourrier: 'COURRIER-TEST' }] };
const workspace = { requests: { 'case-1': [{ id: 'request-1', case: 'case-1', version: 1, state: 'issued', items: [{ id: 'element-1' }] }] } };

test('an accepted existing letter can be attached without uploading it again', async () => {
  const writes = [];
  globalThis.fetch = async (url, init) => {
    if (init.method === 'POST') { writes.push(JSON.parse(init.body)); return json({ id: 'response-1' }, 201); }
    if (url === '/api/v1/documents/piece-1/') return json(document);
    return json({ results: [], next: null });
  };
  await saveRequest(workspace, responseItem);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].letter, 'piece-1');
  assert.deepEqual(writes[0].item_ids, ['element-1']);
});

test('quarantined and cross-case pieces cannot be reused for a response', async () => {
  for (const piece of [{ ...document, state: 'quarantine' }, { ...document, case: 'other-case' }]) {
    let wrote = false;
    globalThis.fetch = async (url, init) => {
      if (init.method === 'POST') wrote = true;
      return url.includes('/documents/') ? json(piece) : json({ results: [], next: null });
    };
    await assert.rejects(saveRequest(workspace, responseItem));
    assert.equal(wrote, false);
  }
});

test('a denied or expired download never produces a client file and expiry is propagated', async () => {
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    globalThis.fetch = async () => json({ code: 'permission_denied' }, 403);
    await assert.rejects(downloadFile('/documents/piece-1/telecharger/', 'lettre.pdf'), (error) => error instanceof ApiError && error.status === 403);
    assert.equal(expired, 0);
    globalThis.fetch = async () => json({ code: 'not_authenticated' }, 403);
    await assert.rejects(downloadFile('/documents/piece-1/telecharger/', 'lettre.pdf'));
    assert.equal(expired, 1);
  } finally { unsubscribe(); }
});
