import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateCase,
  assignCase,
  linkIntelligenceToCase,
  fetchProtectedSource,
  fetchDisseminations,
  createDissemination,
  confirmDissemination,
  fetchDisseminationReturns,
  createDisseminationReturn,
  fetchAllUnits,
  updateIntelligence,
} from '../src/api/actions.ts';
import { cancelSessionRequests, ApiError } from '../src/api/client.ts';

const originalFetch = globalThis.fetch;
globalThis.document = { cookie: 'csrftoken=test-csrf' };
afterEach(() => {
  globalThis.fetch = originalFetch;
  cancelSessionRequests();
});

const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const mockUser = {
  id: 1,
  username: 'chef_bureau',
  first_name: 'Jean',
  last_name: 'Mukendi',
  email: 'jean@dgda.cd',
  memberships: [
    {
      unit: { id: 'unit-kinshasa', code: 'KIN', name: 'Direction Kinshasa' },
      role: 'manager',
      clearance: 1,
      capabilities: ['case.update', 'case.assign', 'intelligence.update', 'intelligence.distribute', 'source.read', 'source.write'],
    },
  ],
};

const mockWorkspace = {
  cases: [
    {
      id: 'case-123',
      reference: 'DOS-2026-001',
      unit: 'unit-kinshasa',
      unit_code: 'KIN',
      classification: 0,
      assignee: 1,
      status: 'in_progress',
      version: 3,
      capabilities: ['case.update', 'case.assign'],
    },
  ],
  intelligence: [
    {
      id: 'intel-456',
      reference: 'REN-2026-001',
      unit: 'unit-kinshasa',
      classification: 0,
      assignee: 1,
      subject: 'Signalement importation réactifs',
      summary: 'Détournement présumé de tarif douanier',
      provenance: 'Douane',
      occurred_on: '2026-10-01',
      version: 2,
    },
  ],
  users: [mockUser],
  assignableAgentIds: [1, 2],
  restrictedAgentIds: [1],
};

test('updateCase sends version and case update payload', async () => {
  let requestedUrl = '';
  let requestedMethod = '';
  let requestedBody = null;

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedMethod = init?.method || 'GET';
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return response({ id: 'case-123', version: 4, object: 'Nouvel objet' });
  };

  const result = await updateCase(mockWorkspace, mockUser, 'case-123', {
    object: 'Nouveau contrôle',
    next_action: 'Vérifier apurement déclaration',
    priority: 'urgent',
  });

  assert.equal(requestedMethod, 'PATCH');
  assert.equal(requestedUrl, '/api/v1/dossiers/case-123/');
  assert.equal(requestedBody.version, 3);
  assert.equal(requestedBody.object, 'Nouveau contrôle');
  assert.equal(requestedBody.next_action, 'Vérifier apurement déclaration');
  assert.equal(requestedBody.priority, 'urgent');
  assert.equal(result.version, 4);
});

test('assignCase sends new assignee, reason, and preserves optimistic version check', async () => {
  let requestedUrl = '';
  let requestedBody = null;

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return response({ id: 'case-123', version: 4, assignee: 2 }, 201);
  };

  await assignCase(
    mockWorkspace,
    mockUser,
    'case-123',
    2,
    'Réaffectation motivée suite à redistribution de charge de contrôle',
    3
  );

  assert.equal(requestedUrl, '/api/v1/dossiers/case-123/affectations/');
  assert.equal(requestedBody.assignee, 2);
  assert.equal(requestedBody.reason, 'Réaffectation motivée suite à redistribution de charge de contrôle');
  assert.equal(requestedBody.version, 3);
});

test('assignCase fails when reason is missing', async () => {
  await assert.rejects(
    async () => {
      await assignCase(mockWorkspace, mockUser, 'case-123', 2, '   ', 3);
    },
    /Le motif de réaffectation est requis/
  );
});

test('linkIntelligenceToCase posts target case and version to intelligence dossiers endpoint', async () => {
  let requestedUrl = '';
  let requestedBody = null;

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return response({ id: 'intel-456', version: 3 }, 201);
  };

  await linkIntelligenceToCase(mockWorkspace, 'intel-456', 'case-123', 2);

  assert.equal(requestedUrl, '/api/v1/renseignements/intel-456/dossiers/');
  assert.equal(requestedBody.case, 'case-123');
  assert.equal(requestedBody.version, 2);
});

test('fetchProtectedSource retrieves confidential source identity for authorized user', async () => {
  let requestedUrl = '';

  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return response({ identity: 'AGENT-SECRET-DOUANE-07' });
  };

  const identity = await fetchProtectedSource('intel-456');

  assert.equal(requestedUrl, '/api/v1/renseignements/intel-456/source/');
  assert.equal(identity, 'AGENT-SECRET-DOUANE-07');
});

test('dissemination lifecycle: create, confirm, and record return', async () => {
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : null });
    if (String(url).includes('/diffusions/') && init?.method === 'POST') {
      return response({ id: 'diss-789', recipient_unit: 'unit-lubumbashi', sent_at: null }, 201);
    }
    if (String(url).includes('/confirmer/')) {
      return response({ id: 'diss-789', sent_at: '2026-10-02T12:00:00Z' });
    }
    if (String(url).includes('/retours/')) {
      return response({ id: 'ret-101', acknowledged: true, note: 'Prise en charge' }, 201);
    }
    return response([]);
  };

  // 1. Create dissemination
  const diss = await createDissemination('intel-456', {
    recipient_unit: 'unit-lubumbashi',
    channel: 'Bordereau officiel',
    expected_action: 'Contrôle contradictoire local',
    reference: 'DIFF-2026-001',
  });
  assert.equal(diss.id, 'diss-789');

  // 2. Confirm dissemination
  await confirmDissemination('diss-789', '2026-10-02T12:00:00Z');
  assert.equal(calls[1].url, '/api/v1/diffusions/diss-789/confirmer/');
  assert.equal(calls[1].body.sent_at, '2026-10-02T12:00:00Z');

  // 3. Create return
  await createDisseminationReturn('diss-789', {
    acknowledged: true,
    received_at: '2026-10-02',
    note: 'Prise en compte par le bureau provincial',
  });
  assert.equal(calls[2].url, '/api/v1/diffusions/diss-789/retours/');
  assert.equal(calls[2].body.acknowledged, true);
  assert.equal(calls[2].body.received_at, '2026-10-02');
});

test('updateIntelligence includes rating fields for managers and preserves version', async () => {
  let requestedUrl = '';
  let requestedBody = null;

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body || '{}'));
    return response({ id: 'intel-456', version: 3 });
  };

  await updateIntelligence(mockWorkspace, mockUser, {
    id: 'intel-456',
    reference: 'REN-2026-001',
    objet: 'Signalement mis à jour',
    resume: 'Description détaillée complétée',
    origine: 'Douane centrale',
    dateReception: '2026-10-01',
    piecesDisponibles: ['Piece1.pdf', 'Piece2.pdf'],
    priorite: 'URGENTE',
    degreFiabilite: 'Cotation A1',
    instructionCotation: 'Vérifier les flux douaniers 2025',
    delaiPrescritJours: 10,
    serviceDestinataire: 'unit-kinshasa',
    niveauAcces: 'Interne',
    statut: 'En cours',
  });

  assert.equal(requestedUrl, '/api/v1/renseignements/intel-456/');
  assert.equal(requestedBody.version, 2);
  assert.equal(requestedBody.subject, 'Signalement mis à jour');
  assert.equal(requestedBody.priority, 'urgent');
  assert.equal(requestedBody.reliability, 'Cotation A1');
  assert.equal(requestedBody.rating_instruction, 'Vérifier les flux douaniers 2025');
  assert.equal(requestedBody.rating_deadline_days, 10);
});

test('fetchAllUnits queries with all=true', async () => {
  let requestedUrl = '';

  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return response({ count: 2, results: [{ id: 'u1', name: 'Bureau 1' }], next: null, previous: null });
  };

  const units = await fetchAllUnits();

  assert.ok(requestedUrl.includes('/unites/?all=true'));
  assert.equal(units.length, 1);
});
