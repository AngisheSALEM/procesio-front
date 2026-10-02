import { useEffect, useRef, useState } from 'react';
import { apiAll, apiPatch, apiPost, downloadFile, type ApiDocument, type ApiRequest, type ApiRequestEvent, type ApiUser } from '../api/client';
import { DocumentPicker } from './common/DocumentPicker';
import './Workflow.css';

const requestStateLabels: Record<string, string> = {
  draft: 'Brouillon', submitted: 'Soumise à validation', validated: 'Validée', signed: 'Signature constatée', issued: 'Émission constatée',
};
const eventLabels: Record<string, string> = {
  submitted: 'Soumission', validated: 'Validation', returned: 'Retour pour correction', signed: 'Constat de signature', issued: 'Constat d’émission',
};

function DraftEditor({ request, busy, onSave }: {
  request: ApiRequest; busy: boolean; onSave: (body: object) => void;
}) {
  const [form, setForm] = useState({
    target_name: request.target_name, target_address: request.target_address || '',
    represented_name: request.represented_name, subject: request.subject,
    legal_basis: request.legal_basis || '', delivery_method: request.delivery_method || '',
    due_on: request.due_on || '', internal_comments: request.internal_comments || '', mode: request.mode,
  });
  const [items, setItems] = useState(request.items.map(({ id, label, period, reason }) => ({ id: id as string | null, label, period: period || '', reason: reason || '' })));
  const field = (name: keyof typeof form, label: string, required = false) => <label className="workflow-field">
    <span>{label}</span><input required={required} disabled={busy} value={form[name]} maxLength={name === 'target_address' || name === 'legal_basis' ? 500 : 240}
      type={name === 'due_on' ? 'date' : 'text'} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
  </label>;
  return <details><summary>Modifier le brouillon</summary>
    <form onSubmit={(event) => { event.preventDefault(); onSave({ ...form, due_on: form.due_on || null, items }); }} className="workflow-proof">
      <div className="workflow-fields">
        {field('target_name', 'Destinataire', true)}{field('represented_name', 'Pour le compte de')}
        {field('target_address', 'Adresse')}{field('subject', 'Objet', true)}
        {field('legal_basis', 'Base légale')}{field('delivery_method', 'Modalité de remise')}{field('due_on', 'Échéance')}
        <label className="workflow-field"><span>Format du PDF</span><select disabled={busy} value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}>
          <option value="generated">Générer avec Procezo</option><option value="imported">Pièce PDF déjà déposée</option>
        </select></label>
        <label className="workflow-field"><span>Commentaires internes</span><textarea maxLength={2000} disabled={busy} value={form.internal_comments} onChange={(event) => setForm({ ...form, internal_comments: event.target.value })} /></label>
      </div>
      {items.map((item, index) => <div className="workflow-fields" key={index}>
        {(['label', 'period', 'reason'] as const).map((name) => <label className="workflow-field" key={name}>
          <span>{name === 'label' ? `Élément ${index + 1}` : name === 'period' ? 'Période' : 'Motif'}</span>
          <input value={item[name]} required={name === 'label'} disabled={busy} maxLength={name === 'period' ? 160 : 500} onChange={(event) => setItems(items.map((row, i) => i === index ? { ...row, [name]: event.target.value } : row))} />
        </label>)}
        <button type="button" className="btn-secondary" disabled={busy || items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))}>Retirer l’élément {index + 1}</button>
      </div>)}
      <div className="workflow-actions">
        <button type="button" className="btn-secondary" disabled={busy || items.length >= 20} onClick={() => setItems([...items, { id: null, label: '', period: '', reason: '' }])}>Ajouter un élément</button>
        <button className="btn-primary" disabled={busy}>Enregistrer le brouillon</button>
      </div>
      <small>La modification crée une nouvelle version. Préparez ensuite son PDF avant de soumettre.</small>
    </form>
  </details>;
}

export function RequestWorkflowPanel({ request, documents, users, onRefresh }: {
  request: ApiRequest; documents: ApiDocument[]; users: ApiUser[]; onRefresh: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [history, setHistory] = useState<ApiRequestEvent[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyRevision, setHistoryRevision] = useState(0);
  const [importId, setImportId] = useState('');
  const [proofId, setProofId] = useState('');
  const [factualAt, setFactualAt] = useState('');
  const [comment, setComment] = useState('');
  const keys = useRef(new Map<string, string>());
  const allowed = request.allowed_actions || [];
  const currentAct = request.acts.find((act) => act.request_version === request.version);
  const signatureProof = [...history].reverse().find((event) => event.kind === 'signed')?.proof;
  const accepted = (id: string) => documents.some((item) => item.id === id && item.case === request.case && item.state === 'accepted' && item.content_type === 'application/pdf');
  const name = (id: number) => { const user = users.find((item) => item.id === id); return user ? `${user.first_name} ${user.last_name}`.trim() || user.username : `Agent ${id}`; };
  const pieceName = (id: string) => documents.find((item) => item.id === id)?.original_name || id;
  const path = `/demandes/${request.id}/`;

  useEffect(() => {
    let live = true;
    apiAll<ApiRequestEvent>(`${path}historique/`).then((events) => { if (live) { setHistory(events); setHistoryError(''); } })
      .catch((cause) => { if (live) setHistoryError(cause instanceof Error ? cause.message : 'Historique indisponible.'); });
    return () => { live = false; };
  }, [path, request.version, historyRevision]);

  async function run(operation: () => Promise<unknown>, message: string, refresh = true) {
    if (busy) return;
    setBusy(true); setError(''); setInfo('');
    let completed = false;
    try {
      await operation(); completed = true;
      if (refresh) await onRefresh();
      setInfo(message);
    } catch (cause) {
      setError(`${completed && refresh ? 'Opération enregistrée, mais actualisation impossible : ' : ''}${cause instanceof Error ? cause.message : 'Opération impossible.'}`);
      if (!completed && refresh) await onRefresh().catch(() => undefined);
    } finally { setBusy(false); }
  }
  function transition(endpoint: string, body: object, message: string) {
    void run(() => apiPost(`${path}${endpoint}/`, { version: request.version, ...body }), message);
  }
  function recordProof(kind: 'sign' | 'issue') {
    if (!accepted(proofId) || !factualAt) { setError('Choisissez une preuve disponible et renseignez la date.'); return; }
    const date = new Date(factualAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now()) { setError('La date réelle doit être valide et ne peut pas être future.'); return; }
    if (kind === 'sign') transition('constater-signature', { proof: proofId, signed_at: date.toISOString() }, 'Signature constatée avec sa preuve.');
    else {
      const payloadKey = `${request.id}/${request.version}/${proofId}/${date.toISOString()}`;
      if (!keys.current.has(payloadKey)) keys.current.set(payloadKey, crypto.randomUUID());
      transition('constater-emission', { dispatch_proof: proofId, sent_at: date.toISOString(), idempotency_key: keys.current.get(payloadKey) }, 'Émission constatée avec sa preuve.');
    }
  }

  return <section className="workflow-card" aria-label="Circuit de la demande" aria-busy={busy}>
    <div className="workflow-header"><h3>{requestStateLabels[request.state] || request.state} · version {request.version}</h3>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => { await onRefresh(); setHistoryRevision((value) => value + 1); }, 'Données actualisées.', false)}>Actualiser le circuit</button>
    </div>
    {error && <p role="alert" className="workflow-error">{error}</p>}{info && <p role="status">{info}</p>}
    {allowed.includes('edit') && <DraftEditor key={request.version} request={request} busy={busy} onSave={(body) => void run(() => apiPatch(path, { version: request.version, ...body }), 'Nouvelle version du brouillon enregistrée.')} />}
    {allowed.includes('prepare') && <div className="workflow-proof">
      {request.mode === 'imported' && <DocumentPicker documents={documents} value={importId} onChange={setImportId} label="PDF de la demande" disabled={busy || Boolean(currentAct)} />}
      <div className="workflow-actions">
        <button className="btn-secondary" disabled={busy || Boolean(currentAct) || (request.mode === 'imported' && !accepted(importId))} onClick={() => transition('preparer', request.mode === 'imported' ? { document: importId } : {}, 'PDF préparé pour cette version.')}>
          {currentAct ? 'PDF de cette version préparé' : 'Préparer le PDF'}
        </button>
        <button className="btn-primary" disabled={busy || !currentAct} onClick={() => transition('soumettre', {}, 'Demande soumise à validation.')}>Soumettre la demande</button>
      </div>
    </div>}
    {allowed.includes('validate') && <div className="workflow-proof">
      <button className="btn-primary" disabled={busy} onClick={() => transition('valider', {}, 'Demande validée.')}>Valider la demande</button>
      <label className="workflow-field"><span>Motif du retour</span><textarea maxLength={500} disabled={busy} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
      <button className="btn-secondary" disabled={busy || !comment.trim()} onClick={() => transition('retourner', { comment: comment.trim() }, 'Demande retournée à son auteur pour correction.')}>Retourner pour correction</button>
    </div>}
    {(allowed.includes('sign') || allowed.includes('issue')) && <form className="workflow-proof" onSubmit={(event) => { event.preventDefault(); recordProof(allowed.includes('sign') ? 'sign' : 'issue'); }}>
      <p>{allowed.includes('sign') ? 'Joignez le document signé et indiquez la date de signature.' : 'Joignez la preuve du courrier envoyé et indiquez la date d’envoi.'}</p>
      <DocumentPicker documents={documents} value={proofId} onChange={setProofId} label={allowed.includes('sign') ? 'Preuve de signature' : 'Preuve d’envoi'} disabled={busy} exclude={allowed.includes('issue') && signatureProof ? [signatureProof] : []} />
      <label className="workflow-field"><span>{allowed.includes('sign') ? 'Date réelle de signature' : 'Date réelle d’envoi'} (heure locale)</span>
        <input type="datetime-local" required disabled={busy} value={factualAt} onChange={(event) => setFactualAt(event.target.value)} />
      </label>
      <button className="btn-primary" disabled={busy || !accepted(proofId) || !factualAt || (allowed.includes('issue') && proofId === signatureProof)}>{allowed.includes('sign') ? 'Constater la signature' : 'Constater l’émission'}</button>
    </form>}
    {!allowed.length && request.state !== 'issued' && <p>La demande attend le traitement de la personne habilitée.</p>}
    {request.issuance && <div className="workflow-proof"><p>Émission constatée le {new Date(request.issuance.issued_at).toLocaleString('fr-FR')} · enregistrée le {new Date(request.issuance.recorded_at).toLocaleString('fr-FR')}.</p>
      <p>Preuve de signature : {pieceName(request.issuance.signature_proof)} · preuve d’envoi : {pieceName(request.issuance.dispatch_proof)}.</p>
    </div>}
    <details open={request.acts.length > 0}><summary>Versions PDF ({request.acts.length})</summary>
      <ul className="workflow-events">{request.acts.map((act) => <li key={act.id}>
        Version {act.request_version} · {act.mode === 'generated' ? 'PDF Procezo' : pieceName(act.imported_document!)}
        <small>Préparée par {name(act.prepared_by)} · {new Date(act.prepared_at).toLocaleString('fr-FR')}</small>
        <button className="btn-secondary" disabled={busy || Boolean(act.imported_document && !accepted(act.imported_document))} onClick={() => void run(() => downloadFile(`/actes/${act.id}/telecharger/`, `${request.reference || request.id}-v${act.request_version}.pdf`), 'PDF téléchargé.')}>
          Télécharger le PDF v{act.request_version}
        </button>
      </li>)}</ul>
    </details>
    <details><summary>Historique et preuves ({history.length})</summary>
      {historyError && <p role="alert">{historyError}</p>}
      <ol className="workflow-events">{history.map((event) => <li key={event.id}>
        {eventLabels[event.kind] || event.kind} · version {event.version} · {name(event.actor)}
        <small>Enregistré le {new Date(event.occurred_at).toLocaleString('fr-FR')}{event.factual_at && ` · acte réalisé le ${new Date(event.factual_at).toLocaleString('fr-FR')}`}</small>
        {event.comment && <p>{event.comment}</p>}
        {event.proof && <button className="btn-secondary" disabled={busy || !accepted(event.proof)} onClick={() => void run(() => downloadFile(`/documents/${event.proof}/telecharger/`, pieceName(event.proof!)), 'Preuve téléchargée.')}>Télécharger la preuve : {pieceName(event.proof)}</button>}
      </li>)}</ol>
    </details>
  </section>;
}
