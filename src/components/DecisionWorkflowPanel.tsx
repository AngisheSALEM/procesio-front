import { useEffect, useRef, useState } from 'react';
import { apiAll, downloadFile, type ApiDecision, type ApiDecisionEvent, type ApiGelecTransfer, type ApiUser } from '../api/client';
import { currentDecision, decisionKindLabels, decisionSources, decisionStateLabels, orderedDecisions, prepareTransfer, proposeDecision, recordTransfer, reviewDecision, transferStateLabels } from '../api/decisions';
import type { WorkspaceData } from '../api/workspace';
import { DocumentPicker } from './common/DocumentPicker';
import './Workflow.css';

function actorName(id: number | null, users: ApiUser[]) {
  const actor = users.find((row) => row.id === id);
  return actor ? `${actor.first_name} ${actor.last_name}`.trim() || actor.username : `Agent ${id}`;
}
function dateLabel(date: string | null) { return date ? new Date(date).toLocaleString('fr-FR') : 'Non enregistrée'; }

function DecisionHistory({ decision, users }: { decision: ApiDecision; users: ApiUser[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ApiDecisionEvent[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    let live = true;
    apiAll<ApiDecisionEvent>(`/decisions/${decision.id}/historique/`).then((data) => { if (live) setRows(data); })
      .catch((cause) => { if (live) setError(cause instanceof Error ? cause.message : 'Historique indisponible.'); });
    return () => { live = false; };
  }, [open, decision.id, decision.version, retry]);
  return <details onToggle={(event) => { setOpen(event.currentTarget.open); setRows(null); setError(''); }}><summary>Historique de la décision</summary>
    {error && <p role="alert">{error} <button className="btn-secondary" onClick={() => { setError(''); setRows(null); setRetry((value) => value + 1); }}>Réessayer</button></p>}
    {open && !error && !rows && <p role="status">Chargement de l’historique…</p>}
    {rows && <ol className="workflow-events">{rows.map((row) => <li key={row.id}>
      {({ proposed: 'Proposition', returned: 'Retour motivé', validated: 'Validation' } as Record<string, string>)[row.kind] || row.kind} · v{row.version} · {actorName(row.actor, users)}
      <small>{dateLabel(row.created_at)}{row.comment && ` · ${row.comment}`}</small>
    </li>)}</ol>}
  </details>;
}

export function DecisionWorkflowPanel({ caseId, workspace, onRefresh }: {
  caseId: string; workspace: WorkspaceData; onRefresh: () => Promise<unknown>;
}) {
  const dossier = workspace.cases.find((row) => row.id === caseId)!;
  const decisions = orderedDecisions(workspace.decisions[caseId] || []);
  const current = currentDecision(decisions);
  const previous = decisions[0];
  const sources = decisionSources(workspace, caseId);
  const transfers = workspace.transfers[caseId] || [];
  const documents = (workspace.documents[caseId] || []).filter((row) => row.case === caseId);
  const [kind, setKind] = useState<ApiDecision['kind']>('classification');
  const [sourceId, setSourceId] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const canPropose = dossier.capabilities?.includes('case.update') && previous?.state !== 'proposed';
  const selectedSource = sources.find((row) => row.id === sourceId);

  async function run(operation: () => Promise<unknown>, message: string, after?: () => void) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setInfo('');
    let completed = false;
    try {
      await operation(); completed = true; after?.();
      await onRefresh(); setInfo(message);
    } catch (cause) {
      setError(`${completed ? 'Écriture enregistrée, mais actualisation impossible : ' : ''}${cause instanceof Error ? cause.message : 'Opération impossible.'}`);
      if (!completed) await onRefresh().catch(() => undefined);
    } finally { pending.current = false; setBusy(false); }
  }

  return <section className="workflow-card" aria-label="Décisions et relais GELEC" aria-busy={busy}>
    <div className="workflow-header"><h3>Décisions et relais GELEC</h3>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => undefined, 'Circuit actualisé.')}>Actualiser le circuit</button></div>
    <p>Prototype : ces décisions enregistrent une orientation interne. Le relais GELEC documente un envoi et sa réception ; il ne crée ni PV officiel, ni signature officielle, ni transmission automatique à GELEC.</p>
    <p><strong>Décision courante :</strong> {current ? `${decisionKindLabels[current.kind]} · ${current.reason}` : 'Aucune décision validée.'}</p>
    {error && <p className="workflow-error" role="alert">{error}</p>}{info && <p role="status">{info}</p>}
    {canPropose && <form onSubmit={(event) => { event.preventDefault(); void run(() => proposeDecision(workspace, caseId, kind, reason, sourceId), 'Proposition enregistrée. Un autre agent habilité doit la valider.', () => { setReason(''); setSourceId(''); }); }}>
      <h4>{previous ? 'Proposer un remplacement historisé' : 'Proposer une décision'}</h4>
      {previous && <p>Remplace la décision {previous.id} ({decisionStateLabels[previous.state]}). La décision validée courante reste applicable jusqu’à la validation du remplacement.</p>}
      <fieldset disabled={busy} className="decision-fieldset"><div className="workflow-fields">
        <label className="workflow-field">Orientation<select value={kind} onChange={(event) => setKind(event.target.value as ApiDecision['kind'])}>
          {Object.entries(decisionKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label className="workflow-field">Appréciation actuelle de référence<select required value={selectedSource ? sourceId : ''} onChange={(event) => setSourceId(event.target.value)}>
          <option value="">Choisir une appréciation actuelle</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.label} · {source.conclusion === 'satisfactory' ? 'Satisfaisante' : 'Non satisfaisante'}</option>)}
        </select></label>
        <label className="workflow-field">Motif de décision<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      </div>
      {selectedSource && <p>Motif de l’appréciation : {selectedSource.reason}</p>}
      {!sources.length && <p>Enregistrez d’abord une appréciation de fond dans une demande ou une observation.</p>}
      <button className="btn-primary" disabled={!selectedSource || !reason.trim()}>Enregistrer la proposition</button></fieldset>
    </form>}
    {previous?.state === 'proposed' && <p>Une proposition attend un autre agent habilité. Son auteur ne peut pas la valider ou la retourner.</p>}
    {!decisions.length && <p>Aucune proposition enregistrée.</p>}
    {decisions.map((decision) => <article key={decision.id} className="workflow-proof">
      <h4>{decisionKindLabels[decision.kind]} · {decisionStateLabels[decision.state]} · v{decision.version}{decision.id === current?.id ? ' · Courante' : decision.state === 'validated' ? ' · Historique' : ''}</h4>
      <p>{decision.reason}</p><p>Proposée par {actorName(decision.author, workspace.users)} le {dateLabel(decision.created_at)}{decision.validator && ` · Validée par ${actorName(decision.validator, workspace.users)} le ${dateLabel(decision.validated_at)}`}</p>
      <p>Source : {decision.request_assessment ? 'Appréciation de demande' : 'Appréciation d’observation'} · {decision.request_assessment || decision.observation_assessment}{decision.source_current === false && ' · Une appréciation plus récente existe'}</p>
      {decision.replaces && <p>Remplace : {decision.replaces}</p>}{decision.return_comment && <p><strong>Motif du retour :</strong> {decision.return_comment}</p>}
      <div className="workflow-actions">
        {decision.allowed_actions?.includes('validate') && <button className="btn-primary" disabled={busy} onClick={() => void run(() => reviewDecision(decision, 'validate'), 'Décision validée ; les vues du dossier et de classement ont été actualisées.')}>Valider la décision</button>}
        {decision.allowed_actions?.includes('return') && <form onSubmit={(event) => { event.preventDefault(); void run(() => reviewDecision(decision, 'return', comment), 'Décision retournée avec son motif.', () => setComment('')); }}>
          <label className="workflow-field">Motif du retour<textarea disabled={busy} required maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
          <button className="btn-secondary" disabled={busy || !comment.trim()}>Retourner la décision</button></form>}
        {decision.allowed_actions?.includes('prepare_transfer') && !transfers.some((row) => row.decision === decision.id) && <button className="btn-primary" disabled={busy} onClick={() => void run(() => prepareTransfer(decision), 'Relais GELEC préparé. La preuve de transmission reste à enregistrer.')}>Préparer le relais GELEC</button>}
      </div>
      <DecisionHistory decision={decision} users={workspace.users} />
    </article>)}
    {transfers.map((transfer) => <TransferPanel key={transfer.id} transfer={transfer} workspace={workspace} busy={busy} current={transfer.decision === current?.id} run={run} documents={documents} />)}
  </section>;
}

function TransferPanel({ transfer, workspace, documents, busy, current, run }: {
  transfer: ApiGelecTransfer; workspace: WorkspaceData; documents: WorkspaceData['documents'][string]; busy: boolean; current: boolean;
  run: (operation: () => Promise<unknown>, message: string, after?: () => void) => Promise<void>;
}) {
  const [proof, setProof] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState(transfer.reference);
  const keys = useRef(new Map<string, string>());
  const action = transfer.allowed_actions?.includes('transmit') ? 'transmit' : transfer.allowed_actions?.includes('confirm') ? 'confirm' : null;
  function piece(id: string | null) {
    if (!id) return null;
    const document = documents.find((row) => row.id === id);
    return <button className="btn-secondary" disabled={busy || document?.state !== 'accepted'} onClick={() => void run(() => downloadFile(`/documents/${id}/telecharger/`, document!.original_name), 'Preuve téléchargée.')}>{document?.original_name || id}</button>;
  }
  return <article className="workflow-proof" aria-label="Relais GELEC">
    <h4>Relais GELEC · {transferStateLabels[transfer.state]} · v{transfer.version}{!current && ' · Décision historique'}</h4>
    <p>Préparé par {actorName(transfer.prepared_by, workspace.users)} le {dateLabel(transfer.prepared_at)}</p>
    {transfer.transmitted_at && <div><p>Transmission réelle : {dateLabel(transfer.transmitted_at)} · enregistrée par {actorName(transfer.transmitted_by, workspace.users)} le {dateLabel(transfer.transmission_recorded_at)} · Référence d’envoi : {transfer.transmission_reference || 'Non renseignée'}</p>{piece(transfer.transmission_proof)}</div>}
    {transfer.received_at && <div><p>Réception réelle : {dateLabel(transfer.received_at)} · confirmée par {actorName(transfer.confirmed_by, workspace.users)} le {dateLabel(transfer.confirmation_recorded_at)} · Référence GELEC : {transfer.reference || 'Non renseignée'}</p>{piece(transfer.receipt_proof)}</div>}
    {!current && transfer.state === 'prepared' && <p>Cette préparation historique ne peut plus être transmise.</p>}
    {action && <form onSubmit={(event) => { event.preventDefault(); void run(() => recordTransfer(transfer, action, proof, date, reference, documents, keys.current), action === 'transmit' ? 'Transmission enregistrée ; la réception reste à confirmer.' : 'Réception GELEC confirmée avec sa preuve.', () => { setProof(''); setDate(''); }); }}>
      <fieldset disabled={busy} className="decision-fieldset"><div className="workflow-fields">
        <DocumentPicker documents={documents} value={proof} onChange={setProof} label={action === 'transmit' ? 'Preuve de transmission' : 'Preuve de réception GELEC'} />
        <label className="workflow-field">{action === 'transmit' ? 'Date réelle de transmission' : 'Date réelle de réception'}<input type="datetime-local" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="workflow-field">{action === 'transmit' ? 'Référence d’envoi (facultative)' : 'Référence GELEC (facultative)'}<input maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      </div><button className="btn-primary" disabled={!proof || !date}>{action === 'transmit' ? 'Enregistrer la transmission' : 'Confirmer la réception GELEC'}</button></fieldset>
    </form>}
  </article>;
}
